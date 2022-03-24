// Angular
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
// RxJS
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
// NGRX
import { Store, select } from '@ngrx/store';
import { Update } from '@ngrx/entity';
// Layout
import { SubheaderService, LayoutConfigService } from '../../../../core/_base/layout';
import { LayoutUtilsService, MessageType } from '../../../../core/_base/crud';
// Services and Models
import {
	User,
	UserUpdated,
	Address,
	SocialNetworks,
	selectUserById,
	UserOnServerCreated,
	selectLastCreatedUserId,
	selectUsersActionLoading
} from '../../../../core/auth';

@Component({
	selector: 'kt-account',
	templateUrl: './account.component.html',
	styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit, OnDestroy {
	// Public properties
	user: User;
	userId$: Observable<number>;
	oldUser: User;
	selectedTab = 0;
	loading$: Observable<boolean>;
	rolesSubject = new BehaviorSubject<number[]>([]);
	addressSubject = new BehaviorSubject<Address>(new Address());
	soicialNetworksSubject = new BehaviorSubject<SocialNetworks>(new SocialNetworks());
	userForm: FormGroup;
	hasFormErrors = false;
	// Private properties
	private subscriptions: Subscription[] = [];

	public accountInfo: any;

	public accountStatus;
	public statusClass = 'notActiveStatusClass'; 

	constructor(private activatedRoute: ActivatedRoute, private router: Router) {
		this.activatedRoute.data.subscribe(data => {
			// console.log(' Account Info = ' + JSON.stringify(data));
			this.accountInfo = data.data;
			this.populateDetails();
		});

	}

	populateDetails() {
		// UNKNOWN(0), ACTIVE(2), LOCK_PAYMENT(3), BLOCK_SPAM(5)
		if (this.accountInfo.accountInfo.account.account_status === 0) {
			this.accountStatus = 'UNKNOWN';
		} else if (this.accountInfo.accountInfo.account.account_status === 2) {
			this.accountStatus = 'ACTIVE';
			this.statusClass = 'activeStatusClass';
		} else if (this.accountInfo.accountInfo.account.account_status === 3) {
			this.accountStatus = 'PAYMENT LOCKED';
		} else if (this.accountInfo.accountInfo.account.account_status === 5) {
			this.accountStatus = 'BLOCKED';
		}
	}

	/**
	 * On init
	 */
	ngOnInit() {

	}

	ngOnDestroy() {
		this.subscriptions.forEach(sb => sb.unsubscribe());
	}

	/**
	 * Init user
	 */
	initUser() {

		// this.createForm();
		// if (!this.user.id) {
		// 	this.subheaderService.setTitle('Create user');
		// 	this.subheaderService.setBreadcrumbs([
		// 		{ title: 'User Management', page: `user-management` },
		// 		{ title: 'Users', page: `user-management/users` },
		// 		{ title: 'Create user', page: `user-management/users/add` }
		// 	]);
		// 	return;
		// }
		// this.subheaderService.setTitle('Edit user');
		// this.subheaderService.setBreadcrumbs([
		// 	{ title: 'User Management', page: `user-management` },
		// 	{ title: 'Users', page: `user-management/users` },
		// 	{ title: 'Edit user', page: `user-management/users/edit`, queryParams: { id: this.user.id } }
		// ]);
	}

	/**
	 * Create form
	 */
	createForm() {
		/* this.userForm = this.userFB.group({
			username: [this.user.username, Validators.required],
			fullname: [this.user.fullname, Validators.required],
			email: [this.user.email, Validators.email],
			phone: [this.user.phone],
			companyName: [this.user.companyName],
			occupation: [this.user.occupation]
		}); */
	}

	/**
	 * Redirect to list
	 *
	 */
	goBackWithId() {
		const url = `/general/account`;
		this.router.navigateByUrl(url, { relativeTo: this.activatedRoute });
	}

	/**
	 * Refresh user
	 *
	 * @param isNew: boolean
	 * @param id: number
	 */
	refreshUser(isNew: boolean = false, id = 0) {
		let url = this.router.url;
		if (!isNew) {
			this.router.navigate([url], { relativeTo: this.activatedRoute });
			return;
		}

		url = `/user-management/users/edit/${id}`;
		this.router.navigateByUrl(url, { relativeTo: this.activatedRoute });
	}

	/**
	 * Reset
	 */
	reset() {
		this.user = Object.assign({}, this.oldUser);
		this.createForm();
		this.hasFormErrors = false;
		this.userForm.markAsPristine();
		this.userForm.markAsUntouched();
		this.userForm.updateValueAndValidity();
	}

	/**
	 * Save data
	 *
	 * @param withBack: boolean
	 */
	onSumbit(withBack: boolean = false) {
		this.hasFormErrors = false;
		const controls = this.userForm.controls;
		/** check form */
		if (this.userForm.invalid) {
			Object.keys(controls).forEach(controlName =>
				controls[controlName].markAsTouched()
			);

			this.hasFormErrors = true;
			this.selectedTab = 0;
			return;
		}

		const editedUser = this.prepareUser();

		if (editedUser.id > 0) {
			this.updateUser(editedUser, withBack);
			return;
		}

		this.addUser(editedUser, withBack);
	}

	/**
	 * Returns prepared data for save
	 */
	prepareUser(): User {
		const controls = this.userForm.controls;
		const _user = new User();
		_user.clear();
		_user.roles = this.rolesSubject.value;
		_user.address = this.addressSubject.value;
		_user.socialNetworks = this.soicialNetworksSubject.value;
		_user.accessToken = this.user.accessToken;
		_user.refreshToken = this.user.refreshToken;
		_user.pic = this.user.pic;
		_user.id = this.user.id;
		_user.username = controls.username.value;
		_user.email = controls.email.value;
		_user.fullname = controls.fullname.value;
		_user.occupation = controls.occupation.value;
		_user.phone = controls.phone.value;
		_user.companyName = controls.companyName.value;
		_user.password = this.user.password;
		return _user;
	}

	/**
	 * Add User
	 *
	 * @param _user: User
	 * @param withBack: boolean
	 */
	addUser(_user: User, withBack: boolean = false) {
		/* this.store.dispatch(new UserOnServerCreated({ user: _user }));
		const addSubscription = this.store.pipe(select(selectLastCreatedUserId)).subscribe(newId => {
				const message = `New user successfully has been added.`;
				this.layoutUtilsService.showActionNotification(message, MessageType.Create, 5000, true, true);
				if (newId) {
						if (withBack) {
								this.goBackWithId();
						} else {
								this.refreshUser(true, newId);
						}
				}
		});
		this.subscriptions.push(addSubscription); */
	}

	/**
	 * Update user
	 *
	 * @param _user: User
	 * @param withBack: boolean
	 */
	updateUser(_user: User, withBack: boolean = false) {
		// Update User
		// tslint:disable-next-line:prefer-const

		/* const updatedUser: Update<User> = {
				id: _user.id,
				changes: _user
		};
		this.store.dispatch(new UserUpdated({ partialUser: updatedUser, user: _user }));
		const message = `User successfully has been saved.`;
		this.layoutUtilsService.showActionNotification(message, MessageType.Update, 5000, true, true);
		if (withBack) {
				this.goBackWithId();
		} else {
				this.refreshUser(false);
		} */
	}

	/**
	 * Returns component title
	 */
	getComponentTitle() {
		const result = 'Account';
		/* if (!this.user || !this.user.id) {
			return result;
		}

		result = `Edit user - ${this.user.fullname}`; */
		return result;
	}

	/**
	 * Close Alert
	 *
	 * @param $event: Event
	 */
	onAlertClose($event) {
		this.hasFormErrors = false;
	}
}
