import { Component, OnInit, Input, Output, EventEmitter, HostListener, ChangeDetectorRef } from '@angular/core';
import * as moment from 'moment';
import { v4 as uuid } from 'uuid';
import { AWSService } from '../../../../core/services/aws/AWS.service';
import { ProfileService } from '../../../../core/services/profile/profile.service';
import { MatSnackBar } from '@angular/material';
import { IconService } from '../../../../core/services/utility/icon.service';
import * as lodash from 'lodash';
import { ActionNotificationComponent } from '../../../partials/content/crud';
import { AttachmentUtility } from '../../../../core/services/utility/attachment-utility.service';
import { FireBaseUserService } from '../../../../core/services/user/fire-base-user.service';
import { TranslateService } from '@ngx-translate/core';
import { Attachment } from '../../../../core/model/profile/profile.model';
import { RestBoolean } from '../../../../core/model/restBoolean.model';

@Component({
  selector: 'kt-attachment',
  templateUrl: './attachment.component.html',
  styleUrls: ['./attachment.component.scss']
})
export class AttachmentComponent implements OnInit {
  @Input() attachment: Attachment[];
  @Output() complete = new EventEmitter<any>();
  @Output() inComplete = new EventEmitter<any>();

  // loading control
  loadingOperation = false;

  // width controller
  innerWidth;

  // Window resize event listner
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.innerWidth = window.innerWidth;
  }

  // USerID
  // user = localStorage.getItem('mirach_accountId');
  user = '';

  // Error controls
  fileSelectError = '';

  // newlyAdded Files
  newFiles: Attachment[] = [];

  // files uploading
  uploading = false;


  // delete control
  deleting = false;

  // page info
  currCount = 7;
  lastTime = undefined;
  lastCount = 0;
  loadMore = false;
  loading = false;

  IETimerFlag = false;
  cloudFileSelect = false;

  constructor(private cdr: ChangeDetectorRef, private s3Service: AWSService, private profileService: ProfileService, private _snackBar: MatSnackBar, public iconService: IconService, private attachmentUtility: AttachmentUtility, private userService: FireBaseUserService, private translateService: TranslateService) { }

  ngOnInit() {
    this.innerWidth = window.innerWidth;
    this.user = this.userService.userId;

    this.attachment = this.attachment.map(item => {
      item['_time'] = this.toUnix(item.last_update);
      if( item.original && item.original.startsWith('http') ){
        item.original = item.original.replace('http://', 'https://');
      }
      return item;
    })

    this.attachment.sort((a, b) => {
      return a['_time'] - b['_time'];
    });

    if (this.attachment.length) {
      this.lastTime = this.attachment[0]['_time'];
    }

    this.attachment = this.attachment.reverse();

    if (this.attachment.length < this.currCount - 1) {
      this.loadMore = false;
    }
    else {
      this.checkForAttachments();
    }
  }


  onSelect(_e) {
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
      if (_e.rejectedFiles.length) {
        if (_e.rejectedFiles[0].size > 5242880) {
          this.fileSelectError = this.translateService.instant('FILES.maxFileSizeError');
          if( _e.addedFiles.length < 1 ){
            throw new Error(this.translateService.instant('FILES.maxFileSizeError'));
          }
        }
      }

      if (_e.addedFiles.length < 1) {
        throw new Error(this.translateService.instant('COMMON.error'))
      }

      this.makeFileMeta(_e.addedFiles);
    } catch (error) {
      this.fileSelectError = error.message;
    }
  }

  selectFromCloud(_event) {
    this.cloudFileSelect = !this.cloudFileSelect;
    this.cdr.detectChanges();
    _event.stopPropagation();
  }


  async makeFileMeta(files: File[]) {
    try {
      let idx = 0;
      for (let file of files) {
        const fMeta = this.attachmentUtility.getAttachmentMeta(this.user, file.name, file.type, file.size, { uploadProgress: -1, deleted: false, mode: 'determinate' }, ["profile"], idx);
        fMeta.file = file;
        if (fMeta.media_type == 577) {
          fMeta.original = await this.attachmentUtility.fileToURL(fMeta.file);
        }
        this.newFiles.push(fMeta);
        idx++;
      }

      this.cdr.detectChanges()
    } catch (error) {
      this.fileSelectError = 'Error processing files try again';
      this.newFiles = [];
    }
  }


  getFileName(fileName) {
    return `${this.user}/${uuid().substr(0, 8)}__${fileName}`;
  }


  cancel() {
    this.newFiles = [];
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


  async submit() {
    try {
      this.uploading = true;
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
          this.openSnackBar("Error uploading " + file.title, { error: true });
        }
      }

      this.attachment.unshift(...this.newFiles.filter(item => !item.deleted && !item.uploadError));
      let countt = this.newFiles.filter(item => !item.deleted && !item.uploadError).length;
      const file_s = countt > 1 ? 'Files' : 'File';
      if (countt > 0) {
        this.openSnackBar(`${file_s} successfully uploaded`, { success: true });
      }


    } catch (error) {
      console.log(error);
      this.openSnackBar("Something went wrong, please try again", { error: true });
    }
    finally {
      this.newFiles = [];
      this.uploading = false;
      this.complete.emit();
      this.cdr.detectChanges();
    }
  }


  haveFilesToUpload() {
    for (let file of this.newFiles) {
      if (!file.deleted) {
        return true;
      }
    }
    return false;
  }


  deleteExisting(file: Attachment, from: string, idx: number) {
    if (this.deleting) {
      alert('Please wait for the previous file to be deleted');
      return;
    }

    this.deleting = true;

    const _file = JSON.parse(JSON.stringify(file));
    _file.profile = 20;

    const _attachment: Attachment[] = [_file];

    const payload = {
      attachment: _attachment
    }

    this.profileService.putAttachment(payload)
      .subscribe(
        async (reponse) => {
          console.log('File deleted Succesfully')
          this.openSnackBar(`File successfully deleted`, { success: true });
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

  openSnackBar(text, meta) {
    this._snackBar.openFromComponent(ActionNotificationComponent, {
      data: {
        message: text, ...meta
      },
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

    this.profileService.getAttachmentForProfile(time_, this.currCount.toString()).subscribe(
      response => {
        if (response.code == 200) {

          let _attachments: any[] = response['data']['attachment'];

          _attachments = _attachments.map(item => {
            item._time = this.toUnix(item.last_update);
            if( item.original && item.original.startsWith('http') ){
              item.original = item.original.replace('http://', 'https://');
            }
            return item;
          })

          _attachments.sort((a, b) => {
            return a._time - b._time;
          })

          this.lastCount = _attachments.length;
          if (this.lastCount < this.currCount) {
            this.loadMore = false;
          }
          else {
            if (_attachments.length > 1) {
              this.lastTime = _attachments[1]._time;
              _attachments.shift();
            }
          }

          this.attachment.push(...(_attachments.reverse()));
          this.loading = false;
          this.cdr.detectChanges();
        }
        else {
          this.loading = false;
          this.cdr.detectChanges();
          console.error(response);
        }
      }
    )
  }

  checkForAttachments() {
    this.loading = true;
    this.profileService.getAttachmentForProfile((this.lastTime - 1).toString(), '1').subscribe(
      response => {
        if (response.code == 200) {
          let _attachments: any[] = response['data']['attachment'];
          if (_attachments.length) {
            this.loadMore = true;
          }
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      err => {
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    )
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

  cloudSelectClosed(attachments: Attachment[]){
    console.log(attachments);
    if( attachments && attachments.length ){
      const temp: Attachment[] = attachments.map(item=>{ item.profile = RestBoolean.TRUE; return item });
      this.attachment.unshift(...temp);
      this.cdr.detectChanges();
      this.profileService.httpPutWithHeader('attachment',{
        attachment: temp
      })
      .subscribe(
        response => {
          console.log(response);
        },
        err => {
          attachments.map(item => lodash.remove(this.attachment, { attachment_id: item.attachment_id}));
          this.openSnackBar('Error selecting from cloud try again', {error: true});
          this.cdr.detectChanges();
          console.error(err);
        }
      )
    }

    this.cloudFileSelect = false;
    this.cdr.detectChanges();
  }

}
