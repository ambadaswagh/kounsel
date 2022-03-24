import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { languageList } from '../../../../language-list';
import { ActivatedRoute } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile/profile.service';
import { MatSnackBar } from '@angular/material';
import { FirebaseUtility } from '../../../core/services/firebase/firebase.service';
import { ActionNotificationComponent } from '../../partials/content/crud/action-natification/action-notification.component'
import { Profile, ProfileModel } from '../../../core/model/profile/profile.model';

@Component({
	selector: 'kt-profile',
	templateUrl: './profile.component.html',
	styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
	public profileForm: FormGroup;
	public activeLink = 'basic-profile';
	public profileInfo: ProfileModel;
	public selectedLanguage = [];
	languages = languageList;

	completed = new Set();
	incomplete = new Set();

	selectCategory = false;
	categoryMetaData = {
		data: undefined,
		loaded: false
	}

	profilePrevVersion = {
		name: '',
		profession: '',
		category: '',
		rate: ''
	}
	laguagePrevValue = '';
	languageDirty = false;
	rateDirty = false;
	newProfile = false;
	profileCategoryPath = '/app/counseling/category/edit_profile/US/en-us';

	constructor(private activatedRoute: ActivatedRoute, private profileService: ProfileService, private cdr: ChangeDetectorRef, private _snackBar: MatSnackBar, private firebaseUtility: FirebaseUtility) {
		this.profileInfo = {};
	}

	ngOnInit() {

		this.profileInfo = JSON.parse(JSON.stringify(this.activatedRoute.snapshot.data.ProfileResolverService));

		if (this.profileInfo.profile) {
			this.profileInfo.profile.category = this.capitalizeFirstLetter(this.profileInfo.profile.category);
		}
		else {
			this.newProfile = true;
			this.profileInfo.profile = {};
		}

		this.completed = new Set(this.profileInfo['completed']);
		this.incomplete = new Set(this.profileInfo['incomplete']);



		const that = this;
		const profile: Profile = that.profileInfo.profile;

		if (profile) {
			const language = profile.language;
			that.selectedLanguage = language ? language.split(',') : [];
			that.profileForm = new FormGroup({
				name: new FormControl(profile.name || '', [Validators.required, this.customSpaceValidator]),
				profession: new FormControl(profile.profession, [Validators.required, this.customSpaceValidator]),
				category: new FormControl(profile.category, [Validators.required]),
				rate: new FormControl((profile.rate / 100), [Validators.min(0.01), Validators.max(1000), Validators.required])
			});
		} else {
			that.profileForm = new FormGroup({
				name: new FormControl('', [Validators.required, this.customSpaceValidator]),
				profession: new FormControl('', [Validators.required, this.customSpaceValidator]),
				category: new FormControl('', [Validators.required]),
				rate: new FormControl('', [Validators.min(0.01), Validators.max(1000), Validators.required])
			});
		}

		this.updatePrevProfile();
	}

	activateLink(linkName: string): void {
		this.activeLink = linkName;
	}

	isActiveLink(linkName: string): boolean {
		return this.activeLink === linkName;
	}

	onSubmit() {
		this.selectCategory = false;
		const that = this;
		this.trimSpaces();
		const formData = that.profileForm.value;
		const payload: ProfileModel = { profile: formData };
		payload.profile.language = this.selectedLanguage.join();
		payload.profile.rate = payload.profile.rate * 100;
		this.updatePrevProfile();
		if (!this.newProfile) {
			that.profileService.putProfile(payload).subscribe((profile: any) => {
				this.openSnackBar("Profile successfully updated", { success: true });
				this.toggleToComplete('basic-profile');
			}, (error) => {
				console.log('Profile update error: ', error);
				this.openSnackBar("Something went wrong, please try again", { error: true });
			});
		} else {
			that.profileService.postProfile(payload).subscribe((response: any) => {

				if (response.data.profile) {
					this.profileInfo.profile = response.data.profile;
				}

				this.openSnackBar("Profile created successfully", { success: true });
				this.toggleToComplete('basic-profile');
				this.newProfile = false;
				this.cdr.detectChanges();
			}, (error) => {
				console.log('Profile create error: ', error);
				this.openSnackBar("Something went wrong, please try again", { error: true });
			});
		}
	}

	openCategorySelection() {
		if (!this.categoryMetaData.loaded) {
			this.categoryMetaData.data = this.firebaseUtility.getDocument(this.profileCategoryPath).toPromise();
			this.categoryMetaData.loaded = true;
		}
		this.selectCategory = true;
	}

	saveCategory(category) {
		if (category) {
			this.profileInfo.profile.category = category;
			this.profileForm.controls['category'].setValue(this.profileInfo.profile.category)
		}
		this.selectCategory = false;
	}

	capitalizeFirstLetter(string) {
		if (!string) return string;
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	updatePrevProfile() {
		for (let key in this.profilePrevVersion) {
			this.profilePrevVersion[key] = this.profileForm.controls[key].value;
		}
		this.laguagePrevValue = this.selectedLanguage.join();
	}

	profileChanged() {
		for (let key in this.profilePrevVersion) {
			if (this.profilePrevVersion[key] != this.profileForm.controls[key].value) {
				return true;
			}
		}
		if (this.laguagePrevValue != this.selectedLanguage.join()) {
			return true;
		}
		return false;
	}

	revertProfile() {
		for (let key in this.profilePrevVersion) {
			this.profileForm.controls[key].setValue(this.profilePrevVersion[key]);
		}
		this.selectedLanguage = this.laguagePrevValue ? this.laguagePrevValue.split(',') : [];
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

	isLast(name) {
		return name === this.selectedLanguage[this.selectedLanguage.length - 1];
	}

	customSearch(term, item) {
		const regex = new RegExp(`^${term}`, 'i');
		return regex.test(item.name);
	}

	toggleToComplete(item: string) {
		this.completed.add(item);
		this.incomplete.delete(item);
	}

	toggleToIncomplete(item: string) {
		this.incomplete.add(item);
		this.completed.delete(item);
	}

	getProfileStatus() {
		switch (this.profileInfo.profile.status) {
			case 0:
				return { value: 'DEFAULT', display: 'Create Counselor Profile', class: 'grey' };
			case 2:
				return { value: 'NOT_FOUND', display: 'Create Counselor Profile', class: 'red' };
			case 3:
				return { value: 'INCOMPLETE', display: 'Incomplete', class: 'grey' };
			case 13:
				return { value: 'COMPLETE', display: 'Review', class: 'green' };
			case 5:
				return { value: 'PUBLISHED', display: 'Published', class: 'green' };
			case 7:
				return { value: 'PRIVATE', display: 'Published', class: 'green' };
			case 11:
				return { value: 'BLOCK', display: 'Blocked', class: 'red' };
			case 15:
				return { value: 'REVIEW', display: 'Review', class: 'green' };
			case 17:
				return { value: 'APPROVED', display: 'Published', class: 'green' };
			case 19:
				return { value: 'DELETED', display: 'Deleted', class: 'red' }
			default:
				return { value: 'NOT_FOUND', display: 'Create Counselor Profile', class: 'red' }
		}
	}

	customSpaceValidator(inp) {
		if (inp.pristine) {
			return null;
		}

		let spaceValidationRegex = new RegExp(/^\s*$/);
		inp.markAsTouched();
		if (!spaceValidationRegex.test(inp.value)) {
			return null;
		}
		return {
			required: true
		};
	}

	moveToEnd(inp) {
		setImmediate(()=>{
			const len = inp.target.value.length;
			inp.target.setSelectionRange(len, len);
		})
	}

	trimSpaces() {
		this.profileForm.get('name').setValue(this.profileForm.get('name').value.trim());
		this.profileForm.get('profession').setValue(this.profileForm.get('profession').value.trim());
	}
}