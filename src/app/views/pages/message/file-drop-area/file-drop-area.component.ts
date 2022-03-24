import { Component, OnInit, Input, ChangeDetectorRef, Output, EventEmitter, ViewChild } from '@angular/core';
import { AttachmentUtility } from '../../../../core/services/utility/attachment-utility.service';
import * as moment from 'moment';
import { v4 as uuid } from 'uuid';
import { AWSService } from '../../../../core/services/aws/AWS.service';
import { NgxDropzoneComponent } from 'ngx-dropzone';
import { MatSnackBar } from '@angular/material';
import { ActionNotificationComponent } from '../../../partials/content/crud';

@Component({
  selector: 'kt-file-drop-area',
  templateUrl: './file-drop-area.component.html',
  styleUrls: ['./file-drop-area.component.scss']
})
export class FileDropAreaComponent implements OnInit {
  @Input() messageTo;
  @Input() user;
  @Input() receiver;
  @Input() topicId;
  @Input() receivers;

  @Output() close = new EventEmitter<any>();
  @Output() dEnter = new EventEmitter<any>();
  @Output() dLeave = new EventEmitter<any>();
  @Output() fileUploaded = new EventEmitter<any>();

  @ViewChild('dpZone') dpZone: NgxDropzoneComponent;

  IETimerFlag = false;
  newFiles = [];
  fileSelectError = '';
  uploadObj;
  uploadingFiles = false;

  constructor(
    private attachmentUtility: AttachmentUtility,
    private cdr: ChangeDetectorRef,
    private s3Service: AWSService,
    private _snackBar: MatSnackBar
  ) { }

  ngOnInit() {
  }

  drop(ev) {
    this.onSelect(ev)
  }

  onSelect(ev) {
    try {
      console.log(ev)
      if (this.checkIfIE()) {
        console.log('IE')
        if (this.IETimerFlag == false) {
          const timerTemp = setTimeout(() => {
            this.IETimerFlag = false;
          }, 1000);
        }
        else return;

        this.IETimerFlag = true;
      }


      this.newFiles = [];
      this.fileSelectError = '';
      if (ev.rejectedFiles.length) {
        if (ev.rejectedFiles[0].size > 5242880) {
          throw new Error('Maximum 5 MB file size is allowed')
        }
      }

      if (ev.addedFiles.length < 1) {
        throw new Error('Some error happened please try again')
      }
      this.makeFileMeta(ev.addedFiles);
    } catch (error) {
      console.error(error);
      this.openSnackBar(error.message, { error: true });
      this.close.emit();
    }
  }

  async makeFileMeta(files: File[]) {
    try {
      for (let file of files) {
        const fMeta = this.attachmentUtility.getAttachmentMeta(this.user, file.name, file.type, file.size, { uploadProgress: -1, deleted: false, mode: 'determinate' });
        fMeta.file = file;
        if (fMeta.media_type == 577 || fMeta.media_type == 569 || fMeta.media_type == 587) {
          fMeta.original = await this.attachmentUtility.fileToURL(fMeta.file);
        }
        this.newFiles.push(fMeta);
      }

      this.submit();
    } catch (error) {
      this.newFiles = [];
      this.openSnackBar('Error processing files try again', { error: true });
      this.close.emit();
    }
  }

  async submit() {
    try {
      this.uploadingFiles = true;
      for (let i = 0; i < this.newFiles.length; i++) {
        const file = this.newFiles[i];
        const toS3Data = this.metaForChatUpload(i); // prepare meat data for file

        const toS3Sep = JSON.parse(JSON.stringify(toS3Data));

        // get s3 upload object
        const managed_upload = this.s3Service.upload(file.file, toS3Sep, file.file.name, this.user);
        this.uploadObj = managed_upload;
        file.uploadStatus = managed_upload;
        managed_upload.send();

        // subscribe to progress counter
        let progressObj;
        const subs = this.s3Service.getUploadStatus(managed_upload).subscribe(
          data => {
            progressObj = Math.round(data);
            this.cdr.detectChanges()
          },
          err => {
            console.log(err);
          },
          () => {
            console.log('unsubscribing', subs);
            subs.unsubscribe();
          }
        );


        if (!file.uploadError) {
          console.log(i, " : index")
          toS3Data.attachment.original = file.original;
          this.fileUploaded.emit({
            file: file.file,
            chat: toS3Data.chat,
            attachment: toS3Data.attachment,
            progressObj,
            managed_upload
          });
        }
        else {
          throw new Error(file.uploadError);
        }

      }
      this.uploadingFiles = false;
      this.close.emit();
    }
    catch (error) {
      this.uploadingFiles = false;
      console.log(error);
      this.openSnackBar('Error processing files try again', { error: true });
      this.close.emit(undefined);
    }

  }


  metaForChatUpload(idx: number) {
    let time = this.getFormattedTime();
    let initialMeta = this.newFiles[idx];
    let message = this.getMessage(initialMeta);
    let chatId = this.getChatUUID();

    message['date_of_share'] = time;

    let attachment_share = this.receivers.map(item => {
      return {
        last_update: time,
        attachment_id: initialMeta.attachment_id,
        shared_with: item.user_id,
        time: time,
        crud: 0,
        sync: 0,
        shared_in: 7
      }
    })

    const meta = {
      sender: this.user,
      receiver: this.receiver,
      attachment_share: attachment_share,
      chat: {
        time: time,
        last_update: time,
        sender: this.user,
        message: JSON.stringify(message),
        message_id: chatId,
        root_id: chatId,
        topic_id: this.topicId,
        crud: 0,
        sync: 0,
        read: 10,
        type: 3,
        incoming: 20,
        mqtt: 2,
        root: 10,
        bookmark: 20
      },
      attachment: message
    }
    return meta;
  }

  getChatUUID() {
    return `CHAT-${uuid()}`;
  }

  getFormattedTime() {
    let temp = moment();
    let isoTime = temp.toISOString();
    return isoTime.split('.')[0] + '-0000';
  }

  getMessage(meta) {
    let message = JSON.parse(JSON.stringify(meta));
    delete message['deleted'];
    delete message['file'];
    delete message['original'];
    delete message['uploadProgress'];
    return message;
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

  openFileSelector() {
    this.dpZone.showFileSelector();
  }

  openSnackBar(text, meta) {
    this._snackBar.openFromComponent(ActionNotificationComponent, {
      data: { message: text, ...meta },
      duration: 5000,
      horizontalPosition: 'right',
      panelClass: 'customSnackBarBackground'
    })
  }

}
