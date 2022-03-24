// Angular
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// RxJS
import { Observable, Subject } from 'rxjs';
// import { finalize, takeUntil, tap } from 'rxjs/operators';
// Translate
import { TranslateService } from '@ngx-translate/core';
// Store
import { Store } from '@ngrx/store';
import { AppState } from '../../../../core/reducers';
// Auth
import { AuthNoticeService, AuthService, Login } from '../../../../core/auth';
import { AuthInfo } from '../../../../core/auth/_models/auth-info.model';
import { SessionStore } from '../../../../core/services/base/session-store.service';
import { DeviceDetectorService } from 'ngx-device-detector';
import _ from 'lodash';
import { FireBaseUserService } from '../../../../core/services/user/fire-base-user.service';
import { PushNotificationService } from '../../../../core/services/pushNotification/push-notification.service';

/**
 * ! Just example => Should be removed in development
 */
// const DEMO_PARAMS = {
// 	EMAIL: '',
// 	PASSWORD: ''
// };

@Component({
	selector: 'kt-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnInit, OnDestroy {
	// Public params
	loginForm: FormGroup;
	loading = false;
	isLoggedIn$: Observable<boolean>;
	errors: any = [];
	osType = '';
	passwordTypeToggle = true;
	private deviceInfo: any = {};
	private osList: Array<string> = ['iOS', 'Android'];
	private unsubscribe: Subject<any>;

	private returnUrl: any;

	private authInfo: AuthInfo;

	// Read more: => https://brianflove.com/2016/12/11/anguar-2-unsubscribe-observables/

	/**
	 * Component constructor
	 *
	 * @param router: Router
	 * @param auth: AuthService
	 * @param authNoticeService: AuthNoticeService
	 * @param translate: TranslateService
	 * @param store: Store<AppState>
	 * @param fb: FormBuilder
	 * @param cdr
	 * @param route
	 * @param deviceDetectorService: DeviceDetectorService
	 */
	constructor(
		private router: Router,
		private authService: AuthService,
		private authNoticeService: AuthNoticeService,
		private translate: TranslateService,
		private store: Store<AppState>,
		private fb: FormBuilder,
		private cdr: ChangeDetectorRef,
		private route: ActivatedRoute,
		private sessionStore: SessionStore,
		private deviceDetectorService: DeviceDetectorService,
		private userService: FireBaseUserService,
		private pushNotification: PushNotificationService
	) {
		this.unsubscribe = new Subject();
		this.deviceInfo = this.deviceDetectorService.getDeviceInfo();
	}

	/**
	 * @ Lifecycle sequences => https://angular.io/guide/lifecycle-hooks
	 */

	/**
	 * On init
	 */
	ngOnInit(): void {
		this.initLoginForm();
		// this.authNoticeService.setNotice(this.translate.instant('AUTH.VALIDATION.INVALID_LOGIN'), 'danger');
		// redirect back to the returnUrl before login
		this.route.queryParams.subscribe(params => {
			this.returnUrl = params.returnUrl || '/';
		});
	}

	/**
	 * On destroy
	 */
	ngOnDestroy(): void {
		this.authNoticeService.setNotice(null);
		this.unsubscribe.next();
		this.unsubscribe.complete();
		this.loading = false;
	}

	/**
	 * Form initalization
	 * Default params, validators
	 */
	initLoginForm() {
		// demo message to show
		if (!this.authNoticeService.onNoticeChanged$.getValue()) {
			/* const initialNotice = `Use account
			<strong>${DEMO_PARAMS.EMAIL}</strong> and password
			<strong>${DEMO_PARAMS.PASSWORD}</strong> to continue.`;
			this.authNoticeService.setNotice(initialNotice, 'info'); */
		}

		this.loginForm = this.fb.group({
			email: [null, Validators.compose([
				Validators.required,
				Validators.email,
				Validators.minLength(3),
				Validators.maxLength(320) // https://stackoverflow.com/questions/386294/what-is-the-maximum-length-of-a-valid-email-address
			])
			],
			password: [null, Validators.compose([
				Validators.required,
				Validators.minLength(6),
				Validators.maxLength(100)
			])
			]
		});
	}

	/**
	 * Form Submit
	 */
	submit() {
		this.authNoticeService.clearAuthNotice();
		const controls = this.loginForm.controls;
		/** check form */
		if (this.loginForm.invalid) {
			Object.keys(controls).forEach(controlName =>
				controls[controlName].markAsTouched()
			);
			return;
		}

		this.loading = true;

		const authData = {
			email: controls.email.value,
			password: controls.password.value
		};

		this.authService.login(authData.email, authData.password)
			.then(response => {
				this.doPostLogin(response);
			}, err => {
				this.loading = false;
				this.cdr.markForCheck();
				this.authNoticeService.setNotice(this.translate.instant('AUTH.VALIDATION.INVALID_LOGIN'), 'danger');
			});

		/* this.auth
			.login(authData.email, authData.password)
			.pipe(
				tap(user => {
					if (user) {
						this.store.dispatch(new Login({ authToken: user.accessToken }));
						this.router.navigateByUrl(this.returnUrl); // Main page
					} else {
						this.authNoticeService.setNotice(this.translate.instant('AUTH.VALIDATION.INVALID_LOGIN'), 'danger');
					}
				}),
				takeUntil(this.unsubscribe),
				finalize(() => {
					this.loading = false;
					this.cdr.markForCheck();
				})
			)
			.subscribe(); */
	}

	/**
	 * Checking control validation
	 *
	 * @param controlName: string => Equals to formControlName
	 * @param validationType: string => Equals to valitors name
	 */
	isControlHasError(controlName: string, validationType: string): boolean {
		const control = this.loginForm.controls[controlName];
		if (!control) {
			return false;
		}

		const result = control.hasError(validationType) && (control.dirty || control.touched);
		return result;
	}

	doFacebookLogin() {
		this.authService.doFacebookLogin()
			.then(response => {
				this.doPostLogin(response);
			});
	}

	doGoogleLogin() {
		this.authService.doGoogleLogin()
			.then(response => {
				this.doPostLogin(response);
			});
	}


	doPostLogin(response) {
		this.authInfo = JSON.parse(JSON.stringify(response));

		// console.log('Logged in user : ' + JSON.stringify(this.loggedInUserAuthInfo));
		this.store.dispatch(new Login({ authToken: this.authInfo.user.stsTokenManager.accessToken }));
		this.sessionStore.setAuthInfo(this.authInfo);
		// localStorage.setItem('mirach_authToken', this.authInfo.user.stsTokenManager.accessToken);
		// localStorage.setItem('mirach_accountId', this.authInfo.user.uid);
		this.loading = false;
		this.cdr.markForCheck();

		if (this.checkOs() && this.checkScreenSize()) {
			this.osType = this.deviceInfo.os;
			this.userService.logout();
			return;
		}
		this.pushNotification.loginInit();
		this.router.navigateByUrl(this.returnUrl).then();
	}

	closeGetApp(): void {
		this.osType = '';
	}

	private checkOs(): boolean {
		return _.includes(this.osList, this.deviceInfo.os);
	}

	private checkScreenSize() {
		return window.innerWidth < 675;
	}

	async doGoogleLoginAsync() {
		try {
			this.authNoticeService.clearAuthNotice();
			// console.log('FROM async method');
			const response = await this.authService.doGoogleLoginAsync();
			if (response.additionalUserInfo.isNewUser) {
				// console.log('New User')
				await response.user.delete();
				this.signUpNeeded();
			}
			else {
				this.doPostLogin(response);
			}
		} catch (error) {
			this.authNoticeService.setNotice(this.translate.instant('AUTH.VALIDATION.INVALID_LOGIN'), 'danger');
		}
	}

	async doFacebookLoginAsync() {
		try {
			this.authNoticeService.clearAuthNotice();
			// console.log('FROM async FACEBOOK method');
			const response = await this.authService.doFacebookLoginAsync();
			if (response.additionalUserInfo.isNewUser) {
				await response.user.delete();
				this.signUpNeeded();
			}
			else {
				this.doPostLogin(response);
			}
		} catch (error) {
			this.authNoticeService.setNotice(this.translate.instant('AUTH.VALIDATION.INVALID_LOGIN'), 'danger');
		}
	}

	signUpNeeded() {
		this.authNoticeService.setNotice('Not an Existing user', 'danger');
	}
}
