import { Component, OnInit, HostListener, ChangeDetectorRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FireBaseUserService } from '../../../core/services/user/fire-base-user.service';
import { PushNotificationService } from '../../../core/services/pushNotification/push-notification.service';
import { MatSlider, MatSnackBar } from '@angular/material';
import * as Croppie from 'croppie';
import { AttachmentUtility } from '../../../core/services/utility/attachment-utility.service';
import { AWSService } from '../../../core/services/aws/AWS.service';
import { ActionNotificationComponent } from '../../partials/content/crud';
import { Account, AccountModel } from '../../../core/model/general/account/account.model'
import { RestBoolean } from '../../../core/model/restBoolean.model';
import { BaseService } from '../../../core/services/base/base.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'kt-account',
	templateUrl: './account.component.html',
	styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
	@ViewChild('slide') slide: MatSlider;

	public accountForm: FormGroup;
	public accountInfo: AccountModel;
	loadingOperation = false;
	uploadErrorMessage = '';
	// image to edit
	newImageName;
	editImageUrl;
	croopedImage;
	croppieInstance: Croppie;
	zoom = 0;
	minZoom = 0;
	zoomLoaded = false;
	imageEditing = false;
	imageURL: any = 'assets/media/profile_images/profile-placeholder-300x300.png';
	cloudFileSelect = false;

	innerWidth;
	@HostListener('window:resize', ['$event'])
	onResize(event) {
		this.innerWidth = window.innerWidth;
	}

	constructor(private formBuilder: FormBuilder, private activatedRoute: ActivatedRoute, private userService: FireBaseUserService, private router: Router, private pushNotification: PushNotificationService, private cdr: ChangeDetectorRef, private attachmentUtility: AttachmentUtility, private s3Service: AWSService, private _snackBar: MatSnackBar, private dataService: BaseService, public translate: TranslateService) {
		this.activatedRoute.data.subscribe(data => {
			if( data.AccountResolverService.accountInfo ){
				this.accountInfo = JSON.parse(JSON.stringify(data.AccountResolverService.accountInfo));
			}
			else{
				this.accountInfo = {};
			}
			
			if (!this.accountInfo.account) {
				this.accountInfo.account = JSON.parse("{}");
			}
		});
	}

	ngOnInit() {
		this.innerWidth = window.innerWidth;
		const accountInfo: Account = JSON.parse(JSON.stringify(this.accountInfo.account));
		accountInfo.phone = this.formatPhoneNumber(accountInfo.phone);

		this.accountForm = this.formBuilder.group({
			name: [accountInfo.name],
			email: [accountInfo.email, Validators.compose([
				Validators.required,
				Validators.email,
				Validators.minLength(3),
				Validators.maxLength(320)
			])],
			phone: [accountInfo.phone]
		});

		if( this.accountInfo && this.accountInfo.account && this.accountInfo.account.image_url ){
			if(  this.accountInfo.account.image_url.startsWith('http') ){
				this.imageURL = this.accountInfo.account.image_url.replace('http://', 'https://');
				this.userService.USER_IMAGE = this.imageURL;
			}
			else{
				this.imageURL = this.accountInfo.account.image_url
				this.userService.USER_IMAGE = this.imageURL;
			}
		}

		if( !this.accountInfo.account.review_count ){
			this.accountInfo.account.rating = 0;
		}
	}

	/**
	 * Checking control validation
	 *
	 * @param controlName: string => Equals to formControlName
	 * @param validationType: string => Equals to validators name
	 */
	isControlHasError(controlName: string, validationType: string): boolean {
		const control = this.accountForm.controls[controlName];
		if (!control) {
			return false;
		}
		return control.hasError(validationType) && (control.dirty || control.touched);
	}

	public getAccountStatus(): string {
		if (this.accountInfo.account.account_status === 0) {
			return this.translate.instant('ACCOUNT.unknown');
		} else if (this.accountInfo.account.account_status === 2) {
			return this.translate.instant('ACCOUNT.active');
		} else if (this.accountInfo.account.account_status === 3) {
			return this.translate.instant('ACCOUNT.paymentLocked');
		} else if (this.accountInfo.account.account_status === 5) {
			return this.translate.instant('ACCOUNT.blocked');
		}
	}

	public deleteAccount(): void {

	}

	async signOut() {
		await this.pushNotification.deleteToken();
		this.userService.logout();
		this.router.navigate(['auth', 'login']);
		// window.location.href = window.location.origin + '/auth/login';
		// this.router.navigate(['auth', 'login']).then(() => {
		// 	window.location.reload();
		// });
	}

	getRating() {
		return new Array(parseInt(this.accountInfo.account.rating || 0));
	}

	getNotRated() {
		return new Array(5 - parseInt(this.accountInfo.account.rating || 0));
	}

	getLoggedInMethod() {
		return this.userService.getLoggedInMethod();
	}

	formatCardNum(cardNum: string) {
		return 'XXXX-XXXX-XXXX-' + cardNum.substr(cardNum.length - 5, 4);
	}

	formatPhoneNumber(phNumber: string) {
		var cleaned = ('' + phNumber).replace(/\D/g, '')
		var match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/)
		if (match) {
			var intlCode = (match[1] ? '+1 ' : '')
			return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('')
		}
		// display original is not correct format
		return phNumber;
	}

	onSelect(_e) {
		try {
			if (_e.addedFiles.length < 1) {
				if (_e.rejectedFiles.length) {
					if (!_e.rejectedFiles[0].type.match(/^image\//)) {
						throw new Error(this.translate.instant('IMAGE.onlyImage'));
					}
					else if (_e.rejectedFiles[0].size > 5242880) {
						throw new Error(this.translate.instant('FILES.maxFileSizeError'));
					}
				}
				throw new Error(this.translate.instant('COMMON.error'));
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

	async postUpload() {
		try {
		  const cover = {
			original: this.croopedImage
		  }
		  this.imageURL = cover.original;
		  this.userService.USER_IMAGE = this.imageURL;
		} catch (error) {
		  throw error;
		}
	  }

	async submit() {

		try {
			const imgFile = await this.base64ToFile();
			const tempAttachment = this.attachmentUtility.getAttachmentMeta(this.userService.userId, this.newImageName, imgFile.type, imgFile.size, {}, ["account"]);
			const s3Meta = {
				sender: this.userService.userId,
				attachment: tempAttachment
			}

			const s3UploadControl = this.s3Service.upload(imgFile, s3Meta, this.newImageName, this.userService.userId);
			s3UploadControl.send();

			this.loadingOperation = true;
			await s3UploadControl.promise();
			await this.postUpload();
			this.openSnackBar(this.translate.instant('ACCOUNT.accountImageChanged'), { success: true });
		} catch (error) {
			console.log(error.stack);
			this.openSnackBar(this.translate.instant('COMMON.error'), { error: true });
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

	selectFromCloud(_event) {
		this.cloudFileSelect = true;
		this.cdr.detectChanges();
		_event.stopPropagation();
	  }

	cloudSelectClosed(files: any) {

		if (files) {
		  const file = files[0];
		  file.account = RestBoolean.TRUE;
		  this.loadingOperation = true;
		  this.cdr.detectChanges();
	
		  this.dataService.httpPutWithHeader('attachment', {
			attachment: [file]
		  })
			.subscribe(
			  response => {
				console.log(response);
				const cover = {
				  original: file.original
				}
				this.imageURL = cover.original;
				this.loadingOperation = false;
				this.userService.USER_IMAGE = this.imageURL;
				this.cdr.detectChanges();
			  },
			  err => {
				this.loadingOperation = false;
				this.openSnackBar(this.translate.instant('IMAGE.errorSelectingFromCloud'), { error: true })
				this.cdr.detectChanges();
				console.error(err);
			  }
			)
	
		}
	
		
		this.cloudFileSelect = false;
		this.cdr.detectChanges();
	  }

	
}
