import { Component, OnInit, ChangeDetectorRef, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { FireBaseUserService } from '../../../../../../core/services/user/fire-base-user.service';
import { v4 as uuid } from 'uuid';
import * as moment from 'moment';
import { AWSService } from '../../../../../../core/services/aws/AWS.service';
import { MatSnackBar } from '@angular/material';
import { AttachmentUtility } from '../../../../../../core/services/utility/attachment-utility.service';
import { ActionNotificationComponent } from '../../../../../partials/content/crud';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'kt-file-upload-area',
  templateUrl: './file-upload-area.component.html',
  styleUrls: ['./file-upload-area.component.scss']
})
export class FileUploadAreaComponent implements OnInit {
  @Input() receivers;
  @Input() receiver;
  @Input() topicId;
  @Output() closed = new EventEmitter<any>();
  loadingOperation = false;
  fileSelectError = '';
  user = '';
  newFiles = [];
  innerWidth;
  uploadObj;
  progressObj;

  IETimerFlag = false;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if ((this.innerWidth > 1024 && window.innerWidth < 1025) || (this.innerWidth < 1025 && window.innerWidth > 1024)) {
      this.innerWidth = window.innerWidth;
    }

  }

  constructor(private userService: FireBaseUserService, private cdr: ChangeDetectorRef, private s3Service: AWSService, private _snackBar: MatSnackBar, private attachmentUtility: AttachmentUtility, public translateService: TranslateService) { }

  ngOnInit() {
    this.user = this.userService.userId;
    this.innerWidth = window.innerWidth;
  }

  onSelect(ev) {
    try {

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
          throw new Error(this.translateService.instant('MEETING.conference.fileUploadArea.maxMbAllowed'));
        }
      }

      if (ev.addedFiles.length < 1) {
        throw new Error(this.translateService.instant('COMMON.error'));
      }

      this.makeFileMeta(ev.addedFiles);
    } catch (error) {
      this.fileSelectError = error.message;
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

      this.cdr.detectChanges()
    } catch (error) {
      this.fileSelectError = this.translateService.instant('MEETING.conference.fileUploadArea.errorProcessing');
      this.newFiles = [];
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

  async submit() {
    try {
      this.loadingOperation = true;
      const file = this.newFiles[0];
      const toS3Data = this.metaForChatUpload(); // prepare meat data for file

      const toS3Sep = JSON.parse(JSON.stringify(toS3Data));

      // get s3 upload object
      const managed_upload = this.s3Service.upload(file.file, toS3Sep, file.file.name, this.userService.userId);
      this.uploadObj = managed_upload;
      file.uploadStatus = managed_upload;
      managed_upload.send();

      // subscribe to progress counter
      const subs = this.s3Service.getUploadStatus(managed_upload).subscribe(
        data => {
          this.progressObj = Math.round(data);
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

      // wait for file upload to finish
      try {
        await managed_upload.promise();
        this.cdr.detectChanges();
      } catch (error) {
        file.uploadError = error.message;
      }

      if (!file.uploadError) {

        // check for upload errors
        this.openSnackBar(this.translateService.instant('MEETING.conference.fileUploadArea.fileSuccess'), {success: true});
        toS3Data.attachment.original = file.original;
        this.close({
          file: file.file,
          chat: toS3Data.chat,
          attachment: toS3Data.attachment
        });

      }
      else {
        throw new Error(file.uploadError);
      }

    } catch (error) {
      console.error(error);
      if (error.message != 'Request aborted') {
        this.openSnackBar(this.translateService.instant('COMMON.error'), {error: true});
      }
      this.close(undefined);
    }
    finally {
      this.loadingOperation = false;
      this.cdr.detectChanges();
    }
  }

  openSnackBar(text, meta) {
		this._snackBar.openFromComponent(ActionNotificationComponent, {
			data:{
				message: text, ...meta
			},
			duration: 5000,
			horizontalPosition: 'right',
			panelClass: 'customSnackBarBackground'
		})
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

  metaForChatUpload() {
    let time = this.getFormattedTime();
    let initialMeta = this.newFiles[0];
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
      sender: this.userService.userId,
      receiver: this.receiver || this.userService.userId,
      attachment_share: attachment_share.length? attachment_share: [this.userService.userId],
      chat: {
        time: time,
        last_update: time,
        sender: this.userService.userId,
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

  resetState() {
    this.loadingOperation = false;
    this.fileSelectError = '';
    this.user = '';
    this.newFiles = [];
    this.uploadObj = undefined;
    this.progressObj = undefined;
  }

  cancel() {
    if (this.loadingOperation) {
      if (this.progressObj < 100) {
        this.uploadObj.abort();
      }
    }
    this.fileSelectError = this.translateService.instant('MEETING.conference.fileUploadArea.fileUploadCancel');
    this.newFiles = [];
    this.close(undefined);
  }

  close(uploaded) {
    if (uploaded) {
      this.closed.emit(uploaded);
    }
    else {
      this.closed.emit(undefined);
    }
    this.resetState();
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
}
