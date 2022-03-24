import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { AWSService } from '../../../core/services/aws/AWS.service';
import { MatSnackBar } from '@angular/material';
import { FileServiceService } from '../../../core/services/general/files/file-service.service';
import { saveAs } from 'file-saver';
import { IconService } from '../../../core/services/utility/icon.service';
import * as lodash from 'lodash';
import { AttachmentUtility } from '../../../core/services/utility/attachment-utility.service';
import * as moment from 'moment'
import { ActionNotificationComponent } from '../../partials/content/crud';
import { FireBaseUserService } from '../../../core/services/user/fire-base-user.service';
import { TranslateService } from '@ngx-translate/core';
import { Attachment } from '../../../core/model/profile/profile.model';
@Component({
  selector: 'kt-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent implements OnInit {
  loadingOperation = false;
  innerWidth;
  newFiles: any[] = [];
  attachment: Attachment[] = [];
  fileSelectError = '';
  user = '';

  // files uploading
  uploading = false;

  //shared or cloud dropdown control
  sharedOrCloudDropDown = false;
  sharedOrCloud = 'cloud';

  // sort controls
  nameSortDropDown = false;
  nameSort = ''; // desc
  dateSortDropDown = false;
  dateSort = 'desc'; // desc

  // gridList control
  gridListDropDown = false;
  gridList = 'list'; // grid

  // controls
  lastTime = (new Date()).getTime();
  loading = false;
  currCount = 9;
  lastCount = 0;
  loadMore = true;

  // delete control
  deleting = false;

  // flag for IE file Select
  IETimerFlag = false;

  // initialLoadDone
  initialLoad = false;

  // all selection
  allSelection = false;


  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.innerWidth = window.innerWidth;
  }

  constructor(public cdr: ChangeDetectorRef, private s3Service: AWSService, private _snackBar: MatSnackBar, private fileService: FileServiceService, public iconService: IconService, private attachmentUtility: AttachmentUtility, private userService: FireBaseUserService, private translate: TranslateService) { }

  ngOnInit() {
    this.user = this.userService.userId;
    this.innerWidth = window.innerWidth;
    this.fetchAttachment();
  }

  onSelect(ev) {
    try {
      if (this.checkIfIE()) {
        if (this.IETimerFlag == false) {
          const timerTemp = setTimeout(() => {
            this.IETimerFlag = false;
          }, 1000);
        }
        else return;

        this.IETimerFlag = true;
      }

      this.fileSelectError = '';
      if (ev.rejectedFiles.length) {
        if (ev.rejectedFiles[0].size > 5242880) {
          this.fileSelectError = 'Maximum 5 MB file size is allowed';
          if( ev.addedFiles.length < 1 ){
            throw new Error('Maximum 5 MB file size is allowed');
          }
        }
      }
      if (ev.addedFiles.length < 1) {
        throw new Error('Some error happened please try again');
      }

      this.makeFileMeta(ev.addedFiles);
    } catch (error) {
      this.fileSelectError = error.message;
    }
  }

  async makeFileMeta(files: File[]) {
    try {
      let idx = 0;
      for (let file of files) {
        const fMeta = this.attachmentUtility.getAttachmentMeta(this.user, file.name, file.type, file.size, { uploadProgress: -1, deleted: false, mode: 'determinate' }, [], idx);
        fMeta.file = file;
        if (fMeta.media_type == 577) {
          fMeta.original = await this.attachmentUtility.fileToURL(fMeta.file);
        }
        fMeta['_time'] = this.toUnix(fMeta.time);
        fMeta['selected'] = false;
        this.newFiles.push(fMeta);
        idx++;
      }

      this.cdr.detectChanges()
    } catch (error) {
      this.fileSelectError = 'Error processing files try again';
      this.newFiles = [];
    }
  }

  bytesToBigUnits(a, b = 2) {
    if (0 === a) return "0 Bytes";
    const c = 0 > b ? 0 : b,
      d = Math.floor(Math.log(a) / Math.log(1024));
    return parseFloat((a / Math.pow(1024, d)).toFixed(c)) + " " + ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d]
  }

  deleteRecent(idx) {
    if (this.newFiles[idx].uploadProgress > -1) {
      if (this.newFiles[idx].uploadProgress < 100) {
        this.newFiles[idx].uploadStatus.abort();
        this.newFiles[idx].deleted = true;
        console.log('File Upload Canceled')
      }
      else {
        // file saved to cloud delete like a normal file
        this.deleteExisting(this.newFiles[idx], 'new', idx);
      }
    }
    else {
      this.newFiles.splice(idx, 1);
    }

    this.cdr.detectChanges();
  }

  selectFromCloud(ev) {
    ev.stopPropagation();
  }

  haveFilesToUpload() {
    for (let file of this.newFiles) {
      if (!file.deleted) {
        return true;
      }
    }
    return false;
  }

  async submit() {
    try {
      this.uploading = true;
      this.loadingOperation = true;
      for (let file of this.newFiles) {
        const tempAttachment: Attachment = lodash.pick(file, ["account", "attachment_id", "cloud", "cover", "crud", "last_update", "media_type", "mime_type", "owner", "profile", "size", "time", "title"]);
        const s3Meta = {
          sender: this.user,
          attachment: tempAttachment
        }
        // const managed_upload = this.s3Service.attachmentUpload(file);
        const managed_upload = this.s3Service.upload(file.file, s3Meta, tempAttachment.title, this.user);
        file.uploadStatus = managed_upload;
        managed_upload.send();

        const subs = this.s3Service.getUploadStatus(managed_upload).subscribe(
          data => {
            file.uploadProgress = data;
            this.cdr.detectChanges()
          },
          err => {
            console.log(err);
          },
          () => {
            subs.unsubscribe();
          }
        );

        try {
          await managed_upload.promise();
          this.cdr.detectChanges();
        } catch (error) {
          file.uploadError = error.message;
        }
      }

      this.attachment.unshift(...this.newFiles.filter(item => !item.deleted));
      let count = this.newFiles.filter(item => !item.deleted).length;
      const file_s = count > 1 ? 'Files' : 'File';
      if (count > 0) {
        this.openSnackBar(`${file_s} successfully uploaded`, {success: true});
      }

    } catch (error) {
      console.log(error);
      this.openSnackBar("Something went wrong, please try again", {error: true});
    }
    finally {
      this.newFiles = [];
      this.uploading = false;
      // this.complete.emit();
      this.loadingOperation = false;
      this.cdr.detectChanges();
    }
  }


  openSnackBar(text, meta) {
		this._snackBar.openFromComponent(ActionNotificationComponent, {
			data:{ message: text, ...meta },
			duration: 5000,
			horizontalPosition: 'right',
			panelClass: 'customSnackBarBackground'
		})
	}


  fetchAttachment() {

    let time_ = new Date().getTime().toString();
    if (this.lastTime != undefined) {
      time_ = (this.lastTime - 1).toString();
    }

    this.loading = true;

    let url = 'attachment';
    if (this.sharedOrCloud == 'shared') url = 'attachment/shared';

    this.fileService.getFiles(url, time_, this.currCount.toString()).subscribe(
      response => {
        if (response.code == 200) {
          this.initialLoad = true;
          let attachmentsTemp: any[] = [];
          let sortKey = 'time';

          if (this.sharedOrCloud == 'shared') {
            attachmentsTemp = response['data']['attachment']['shared'];
            sortKey = 'date_of_share';
          }
          else {
            attachmentsTemp = response['data']['attachment'];
          }



          attachmentsTemp = attachmentsTemp.map(item => {
            item._time = this.toUnix(item[sortKey]);
            item['more'] = false;
            item.original = item.original.replace('http://', 'https://');
            item['selected'] = false;
            return item;
          })

          attachmentsTemp.sort((a, b) => {
            return a._time - b._time;
          })

          this.lastCount = attachmentsTemp.length;
          if (this.lastCount < this.currCount) {
            this.loadMore = false;
          }
          else {
            this.lastTime = attachmentsTemp[1]._time;
            attachmentsTemp.shift();
          }

          this.attachment.push(...(attachmentsTemp.reverse()));
          this.loading = false;
          this.cdr.detectChanges();
          console.log(this.attachment)
        }
        else {
          this.loading = false;
          this.cdr.detectChanges();
          console.error(response);
        }
      }
    )
  }


  toggleMenu(item) {
    item['more'] = !item['more'];
  }


  async downloadFile(url, name, item) {
    try {
      if (item.uploadProgress) {
        item["downloadStatus"] = 1;
        this.cdr.detectChanges();
        saveAs(item.file);
      }
      else {
        let temp = url.split('.cloudfront.net/');
        let managedDownload = await this.s3Service.downloadAttachment(temp[temp.length - 1], name);
        item['downloadStatus'] = managedDownload;
        managedDownload.send();

        const subs = this.s3Service.getDownloadProgress(managedDownload).subscribe(
          data => {
            item['downloadProgress'] = Math.round(data);
            this.cdr.detectChanges();
          },
          err => {
            console.log(err);
          },
          () => {
            subs.unsubscribe();
          }
        );

        let data = await managedDownload.promise();
        let uint8Array: any = data.Body;
        let blob = new Blob([uint8Array], { type: data.ContentType });
        saveAs(blob, name);
      }
    } catch (error) {
      console.log(error);
    }
    finally {
      item['downloadProgress'] = undefined;
      this.cdr.detectChanges();
    }
  }


  deleteExisting(file: Attachment, from: string, idx: number) {
    if (this.deleting) {
      alert('Please wait for the previous file to be deleted');
      return;
    }

    this.deleting = true;

    this.fileService.deleteAttachment(file.attachment_id)
      .subscribe(
        async (reponse) => {
          console.log('File deleted Succesfully');
          this.openSnackBar(`File successfully deleted`, {success: true});
        },
        err => {
          console.log(err)
        },
        () => {
          if (from == 'new') {
            this.newFiles.splice(idx, 1);
          }
          else if (from == 'old') {
            this.attachment.splice(idx, 1);
          }
          this.deleting = false;
          this.cdr.detectChanges();
        }
      )
  }


  sortAttachments(by: string) {
    switch (by) {
      case 'name':

        if (this.nameSort == 'asc') {
          this.attachment.sort((a, b) => {
            if (a.title < b.title) {
              return -1;
            }
            if (a.title > b.title) {
              return 1;
            }
            return 0;
          })
        }
        else if (this.nameSort == 'desc') {
          this.attachment.sort((a, b) => {
            if (a.title > b.title) {
              return -1;
            }
            if (a.title < b.title) {
              return 1;
            }
            return 0;
          })
        }
        this.dateSort = '';
        break;
      case 'date':
        if (this.dateSort == 'asc') {
          this.attachment.sort((a, b) => {
            return a['_time'] - b['_time'];
          })
        }
        else if (this.dateSort == 'desc') {
          this.attachment.sort((a, b) => {
            return b['_time'] - a['_time'];
          })
        }
        this.nameSort = '';
        break;
      default:
        break;
    }
    this.cdr.detectChanges();
  }

  switchSharedOrCloud(toggleTo) {
    if (this.sharedOrCloud == toggleTo) return;
    this.sharedOrCloud = toggleTo;
    this.newFiles = [];
    this.attachment = [];
    this.fileSelectError = '';
    this.uploading = false;
    this.nameSortDropDown = false;
    this.nameSort = '';
    this.dateSortDropDown = false;
    this.dateSort = 'desc';
    this.lastTime = (new Date()).getTime();
    this.loading = false;
    this.currCount = 9;
    this.lastCount = 0;
    this.loadMore = true;
    this.deleting = false;
    this.initialLoad = false;
    this.fetchAttachment();
  }

  toUnix(dateString) {
    return moment(dateString).valueOf();
  }

  checkIfIE() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))  // If Internet Explorer, return version number
    {
      return true;
    }
    else  // If another browser, return 0
    {
      return false;
    }
  }

  allSelectionToggle(ev){
    for(let file of this.attachment){
      file['selected'] = ev.checked;
    }
  }

  downloadAll(){
    for(let file of this.attachment){
      if( file['selected'] ) this.downloadFile(file.original, file.title, file);
    }
  }

  isSelected(){
    const count = this.attachment.filter(item=>item['selected']).length;
    this.allSelection = count == this.attachment.length;
    return count;
  }

  async deleteBulk(){
    try {
      this.deleting = true;

      const delPromiseCollection = [];
      const attIdx = [];
      let recentUploadFlag = false;
      
      this.attachment.forEach( (file, idx) => {
        if(file['selected']){
          if( file.uploadProgress != undefined ){
            recentUploadFlag = true;
          }
          else{
            delPromiseCollection.push(this.fileService.deleteAttachment(file.attachment_id).toPromise())
            attIdx.push(file.attachment_id);
          }
        }
      })

      if( recentUploadFlag ){
        this.openSnackBar(`some recently uploaded files are processing, they won't be deleted`, {success: true});
      }

      const response = await Promise.all(delPromiseCollection);

      attIdx.forEach(id=>{
        let idx = this.attachment.findIndex((file)=>file.attachment_id == id);
        if( idx > -1 ){
          this.attachment.splice(idx, 1);
          this.cdr.detectChanges();
        }
      });
      if( attIdx.length ){
        this.openSnackBar(`Files successfully deleted`, {success: true});
      }

    } catch (error) {
      console.error(error);
    }
    finally{
      
      this.deleting = false;
      this.cdr.detectChanges;

    }
  }

}
