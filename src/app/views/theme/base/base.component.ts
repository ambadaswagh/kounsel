// Angular
import { Component, OnDestroy, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
// RxJS
import { Observable, Subscription } from 'rxjs';
// Object-Path
import * as objectPath from 'object-path';
// Layout
import { LayoutConfigService, MenuConfigService, PageConfigService } from '../../../core/_base/layout';
import { HtmlClassService } from '../html-class.service';
import { LayoutConfig } from '../../../core/_config/layout.config';
import { MenuConfig } from '../../../core/_config/menu.config';
import { PageConfig } from '../../../core/_config/page.config';
// User permissions
import { NgxPermissionsService } from 'ngx-permissions';
import { currentUserPermissions, Permission } from '../../../core/auth';
import { select, Store } from '@ngrx/store';
import { AppState } from '../../../core/reducers';
import { AccountService } from '../../../core/services/general/account/account.service';
import { FireBaseUserService } from '../../../core/services/user/fire-base-user.service';
import { Router } from '@angular/router';
import { PushNotificationService } from '../../../core/services/pushNotification/push-notification.service';
import { ConferenceService } from '../../../core/services/general/meeting/conference.service';
declare var $: any;

@Component({
	selector: 'kt-base',
	templateUrl: './base.component.html',
	styleUrls: ['./base.component.scss'],
	encapsulation: ViewEncapsulation.None
})
export class BaseComponent implements OnInit, OnDestroy {
	// Public variables
	selfLayout: string;
	asideDisplay: boolean;
	asideSecondary: boolean;
	subheaderDisplay: boolean;
	desktopHeaderDisplay: boolean;
	fitTop: boolean;
	fluid: boolean;
	userName: string = '';
	imageSrc: string = 'assets/media/profile_images/profile-placeholder-300x300.png';

	// Private properties
	private unsubscribe: Subscription[] = [];
	private currentUserPermissions$: Observable<Permission[]>;


	constructor(
		private layoutConfigService: LayoutConfigService,
		private menuConfigService: MenuConfigService,
		private pageConfigService: PageConfigService,
		private htmlClassService: HtmlClassService,
		private store: Store<AppState>,
		private permissionsService: NgxPermissionsService,
		private accountService: AccountService,
		private cdr: ChangeDetectorRef,
		private userService: FireBaseUserService,
		private router: Router,
		private pushNotification: PushNotificationService,
		private conference: ConferenceService
	) {
		this.loadRolesWithPermissions();

		// register configs by demos
		this.layoutConfigService.loadConfigs(new LayoutConfig().configs);
		this.menuConfigService.loadConfigs(new MenuConfig().configs);
		this.pageConfigService.loadConfigs(new PageConfig().configs);

		// setup element classes
		this.htmlClassService.setConfig(this.layoutConfigService.getConfig());

		const subscr = this.layoutConfigService.onConfigUpdated$.subscribe(layoutConfig => {
			// reset body class based on global and page level layout config, refer to html-class.service.ts
			document.body.className = '';
			this.htmlClassService.setConfig(layoutConfig);
		});
		this.unsubscribe.push(subscr);
	}

	/**
	 * @ Lifecycle sequences => https://angular.io/guide/lifecycle-hooks
	 */

	/**
	 * On init
	 */
	ngOnInit(): void {
		const config = this.layoutConfigService.getConfig();
		this.selfLayout = objectPath.get(config, 'self.layout');
		this.asideDisplay = objectPath.get(config, 'aside.self.display');
		this.subheaderDisplay = objectPath.get(config, 'subheader.display');
		this.desktopHeaderDisplay = objectPath.get(config, 'header.self.fixed.desktop');
		this.fitTop = objectPath.get(config, 'content.fit-top');
		this.fluid = objectPath.get(config, 'content.width') === 'fluid';

		// let the layout type change
		const subscr = this.layoutConfigService.onConfigUpdated$.subscribe(cfg => {
			setTimeout(() => {
				this.selfLayout = objectPath.get(cfg, 'self.layout');
			});
		});
		this.unsubscribe.push(subscr);

		this.accountService.getAccount().subscribe(
			response => {
				const data = response.data;
				if (data.account) {
					this.userService.UserNamePromise = data.account.name;
					this.userName = data.account.name;
					if (data.account.image_url) {
						
						if(  data.account.image_url.startsWith('http') ){
							this.imageSrc = data.account.image_url.replace('http://', 'https://');
						}
						else{
							this.imageSrc = data.account.image_url;
						}
						
					}

					this.userService.USER_IMAGE = this.imageSrc;
					// terms and condition validation
					if (!this.accountService.termAndConditionValidation(data.account)) {
						this.openTermsCondition();
					}

					this.setLocation(data);

				}
				this.cdr.detectChanges();
			},
			err => {

			}
		)

		if( !this.pushNotification.initAtLogin ){
			if( this.router.url.includes('meeting/conference') ){
				if( !this.conference.guest ){
					this.pushNotification.initialize();
				}
			}
			else{
				this.pushNotification.initialize();
			}
			console.log('Login via base');
			
		}

		this.userService.USER_IMAGE.subscribe((img => {
			this.imageSrc = img;
			this.cdr.detectChanges();
		}))
	}

	/**
	 * On destroy
	 */
	ngOnDestroy(): void {
		this.unsubscribe.forEach(sb => sb.unsubscribe());
	}

	/**
	 * NGX Permissions, init roles
	 */
	loadRolesWithPermissions() {
		this.currentUserPermissions$ = this.store.pipe(select(currentUserPermissions));
		const subscr = this.currentUserPermissions$.subscribe(res => {
			if (!res || res.length === 0) {
				return;
			}

			this.permissionsService.flushPermissions();
			res.forEach((pm: Permission) => this.permissionsService.addPermission(pm.name));
		});
		this.unsubscribe.push(subscr);
	}

	openTermsCondition() {
		$('#registerTermConditionBase').modal({
			backdrop: 'static',
			keyboard: false
		})
		$("#registerTermConditionBase").modal('show');
	}

	closeTermCondition(_event) {
		$("#registerTermConditionBase").modal('hide');
		if (_event) {
			this.acceptedTerms();
		}
		else {
			this.rejectedTerms();
		}
	}

	async acceptedTerms() {
		try {
			// const UID = localStorage.getItem('mirach_accountId');
			// const TOKEN = localStorage.getItem('mirach_authToken');
			const UID = this.userService.userId;
			const TOKEN = await this.userService.getTokenAutoRefresh();
			const response = await this.accountService.signUpAcceptAgreement(UID, TOKEN, {
				account: {
					legal_user_agreement: 10,
					legal_privacy_policy: 10,
					legal_escrow_agreement: 10,
					legal_confidentiality_agreement: 10,
					legal_ach_fees_agreement: 10
				}
			}).toPromise();
		} catch (error) {
			console.error(error);
		}
	}

	async rejectedTerms() {
		await this.pushNotification.deleteToken();
		this.userService.logout();
		this.router.navigate(['auth', 'login']);
	}

	setLocation(data){
		let location = {}
		if( data.account.city ){
			location['city'] = data.account.city; 
		}
		if( data.account.state ){
			location['state'] = data.account.state;
		}

		if( data.account.country ){
			location['country'] = data.account.country;
		}

		this.userService.setLocation(location);
	}

}
