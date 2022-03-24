import { Component, OnInit, Input, HostListener, ChangeDetectorRef, Output, EventEmitter, ViewChild } from '@angular/core';
import { AWSService } from '../../../../core/services/aws/AWS.service';
import * as Croppie from 'croppie';
import { MatSnackBar, MatSlider } from '@angular/material';
import * as moment from 'moment';
import { v4 as uuid } from 'uuid';
import { FireBaseUserService } from '../../../../core/services/user/fire-base-user.service';
import { ActionNotificationComponent } from '../../../partials/content/crud';
import { AttachmentUtility } from '../../../../core/services/utility/attachment-utility.service';
import { RestBoolean } from '../../../../core/model/restBoolean.model';
import { ProfileService } from '../../../../core/services/profile/profile.service';

@Component({
  selector: 'kt-profile-image',
  templateUrl: './profile-image.component.html',
  styleUrls: ['./profile-image.component.scss']
})
export class ProfileImageComponent implements OnInit {
  image: File;
  @Input() coverMeta;
  @Output() update = new EventEmitter<any>();
  @ViewChild('slide') slide: MatSlider;
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.innerWidth = window.innerWidth;
  }

  innerWidth = 1025;
  imageURL: any = 'assets/media/profile_images/profile-placeholder-300x300.png';
  imageEditing = false;
  loadingOperation = false;

  // image to edit
  newImageName;
  editImageUrl;
  croopedImage;
  croppieInstance: Croppie;
  zoom = 0;
  minZoom = 0;
  zoomLoaded = false;

  // error controls
  uploadErrorMessage = '';

  // select from cloud controls
  cloudFileSelect = false;

  constructor(private s3Service: AWSService, private cdr: ChangeDetectorRef, private _snackBar: MatSnackBar, private userService: FireBaseUserService, private attachmentUtility: AttachmentUtility, private profileService: ProfileService) {
    this.innerWidth = window.innerWidth;
  }

  ngOnInit() {
    if (this.coverMeta) {
      if (this.coverMeta.original && this.coverMeta.original.startsWith('http')) {
        this.imageURL = this.coverMeta.original.replace('http://', 'https://');
      }
    }
  }

  ngOnViewInit() {
  }

  onSelect(_e) {
    try {
      if (_e.addedFiles.length < 1) {
        if (_e.rejectedFiles.length) {
          if (!_e.rejectedFiles[0].type.match(/^image\//)) {
            throw new Error('Only image is allowed')
          }
          else if (_e.rejectedFiles[0].size > 5242880) {
            throw new Error('Maximum 5 MB file size is allowed')
          }
        }
        throw new Error('Some error happened please try again');
      }

      this.uploadErrorMessage = '';
      const temp = new FileReader();

      temp.onload = (ev) => {
        this.editImageUrl = temp.result;
        this.cdr.detectChanges();
        this.setCropperInstance();
      }
      this.newImageName = _e.addedFiles[0].name;
      temp.readAsDataURL(_e.addedFiles[0]);
    } catch (error) {
      if (this.croppieInstance) {
        this.croppieInstance.destroy();
        this.croppieInstance = undefined;
      }
      this.editImageUrl = '';
      this.uploadErrorMessage = error.message;
    }
  }

  selectFromCloud(_event) {
    this.cloudFileSelect = true;
    this.cdr.detectChanges();
    _event.stopPropagation();
  }

  setCropperInstance() {
    this.zoomLoaded = false;
    this.uploadErrorMessage = '';
    this.minZoom = 0;
    this.cdr.detectChanges();


    if (this.croppieInstance) {
      this.croppieInstance.destroy();
      this.croppieInstance = undefined;
    }
    this.croppieInstance = new Croppie(document.getElementById('cropper'), {
      enforceBoundary: true,
      viewport: {
        height: 368,
        width: 368
      },
      boundary: {
        height: 368,
        width: 368
      },
      customClass: 'myCroppie',
      showZoomer: false,
      mouseWheelZoom: false
    })

    this.croppieInstance.bind({
      url: this.editImageUrl
    })
      .then(() => {
        this.minZoom = this.croppieInstance.get().zoom;
        this.zoomLoaded = true;
        this.cdr.detectChanges();
        this.slide.value = this.minZoom;
        this.cdr.detectChanges();
      })

  }

  zoomIn() {
    this.onZoomChange({
      value: (this.croppieInstance.get().zoom + 0.05 > 1.5) ? 1.5 : this.croppieInstance.get().zoom + 0.05
    })
  }

  zoomOut() {
    this.onZoomChange({
      value: (this.croppieInstance.get().zoom - 0.05 < 0) ? 0 : this.croppieInstance.get().zoom - 0.05
    })
  }

  onZoomChange($ev) {
    this.croppieInstance.setZoom($ev.value);
    this.zoom = this.croppieInstance.get().zoom;
  }

  async getCroppedImage() {
    try {
      const img = await this.croppieInstance.result({
        format: "png"
      });
      return img;
    }
    catch (err) {
      throw err;
    }
  }

  async base64ToFile() {
    try {
      const dataurl: any = await this.getCroppedImage();
      // const filename = this.newImageName;  
      this.croopedImage = dataurl;
      let arr = dataurl.split(',');
      let mime = arr[0].match(/:(.*?);/)[1];
      let bstr = atob(arr[1]);
      let n = bstr.length;
      let u8arr = new Uint8Array(n);

      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
      // return new File([u8arr], filename, { type: mime });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }



  async submit() {

    try {
      const imgFile = await this.base64ToFile();
      const tempAttachment = this.attachmentUtility.getAttachmentMeta(this.userService.userId, this.newImageName, imgFile.type, imgFile.size, {}, ["cover"]);
      const s3Meta = {
        sender: this.userService.userId,
        attachment: tempAttachment
      }

      const s3UploadControl = this.s3Service.upload(imgFile, s3Meta, this.newImageName, this.userService.userId);
      s3UploadControl.send();

      this.loadingOperation = true;
      await s3UploadControl.promise();
      await this.postUpload();
      this.openSnackBar("Profile image changed", { success: true });
    } catch (error) {
      console.log(error.stack);
      this.openSnackBar("Something went wrong, please try again", { error: true });
    } finally {
      this.loadingOperation = false;
      this.croppieInstance.destroy();
      this.croppieInstance = undefined;
      this.editImageUrl = '';
      this.imageEditing = false;
      this.uploadErrorMessage = '';
      this.cdr.detectChanges();
    }

  }

  async postUpload() {
    try {
      const cover = {
        original: this.croopedImage
      }
      this.imageURL = cover.original;
      this.update.emit(cover);
    } catch (error) {
      throw error;
    }
  }

  cancel() {
    if (this.croppieInstance) this.croppieInstance.destroy();
    this.croppieInstance = undefined;
    this.editImageUrl = '';
    this.imageEditing = false;
    this.uploadErrorMessage = '';
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

  cloudSelectClosed(files: any) {

    if (files) {
      const file = files[0];
      file.cover = RestBoolean.TRUE;
      this.loadingOperation = true;
      this.cdr.detectChanges();

      this.profileService.httpPutWithHeader('attachment', {
        attachment: [file]
      })
        .subscribe(
          response => {
            console.log(response);
            const cover = {
              original: file.original
            }
            this.imageURL = cover.original;
            this.update.emit(cover);
            this.loadingOperation = false;
            this.cdr.detectChanges();
          },
          err => {
            this.loadingOperation = false;
            this.openSnackBar('Error selecting image from cloud, try again', { error: true })
            this.cdr.detectChanges();
            console.error(err);
          }
        )

    }

    
    this.cloudFileSelect = false;
    this.cdr.detectChanges();
  }

}
