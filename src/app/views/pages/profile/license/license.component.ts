import { Component, OnInit, Input, ChangeDetectorRef, Output, EventEmitter, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ProfileService } from '../../../../core/services/profile/profile.service';
import { MatSnackBar } from '@angular/material';
import * as _ from 'lodash';
import moment from 'moment';
import { FirebaseUtility } from '../../../../core/services/firebase/firebase.service';
import { ActionNotificationComponent } from '../../../partials/content/crud';
import { FireBaseUserService } from '../../../../core/services/user/fire-base-user.service';
import { Licence } from '../../../../core/model/profile/profile.model';

export interface License_array {
  data: any,
  editing: boolean
}

@Component({
  selector: 'kt-license',
  templateUrl: './license.component.html',
  styleUrls: ['./license.component.scss']
})
export class LicenseComponent implements OnInit {

  @Input() license: Licence[];
  @Output() onUpdate = new EventEmitter<any>();
  @Output() complete = new EventEmitter<any>();
  @Output() inComplete = new EventEmitter<any>();
  @ViewChild('myState') state: ElementRef;
  @ViewChild('EditingPane') editPane: ElementRef;


  licenseArray = [];
  originalLicenseArray = [];
  // user_id: string = localStorage.getItem('mirach_accountId');
  user_id = '';
  licenseMetaData = { data: undefined, loaded: false }
  requiredFields = ['country', 'type', 'board', 'state', 'number', 'expiration'];
  errors = { 'country': false, 'type': false, 'board': false, 'state': false, 'number': false, 'expiration': false }
  selectLicenseType = false;
  option = {
    types: ['(regions)']
  }

  stateEditing = false;
  innerWidth = 0;
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.innerWidth = window.innerWidth;
  }
  licenseTypesPath = '/app/counseling/license/type/US/en-us';


  constructor(private profileService: ProfileService, private _snackBar: MatSnackBar, public cdr: ChangeDetectorRef, private firebaseUtility: FirebaseUtility, private userService: FireBaseUserService) { }

  ngOnInit() {
    this.user_id = this.userService.userId;
    this.innerWidth = window.innerWidth;

    this.license.forEach((temp) => {

      let item: any = JSON.parse(JSON.stringify(temp));
      item.expiration = new Date(temp.expiration);

      this.licenseArray.push({
        editing: false,
        more: false,
        data: item,
        errors: { ...this.errors }
      })
    })

    this.originalLicenseArray = JSON.parse(JSON.stringify(this.licenseArray));
    this.originalLicenseArray.forEach(item => {
      item['data']['expiration'] = new Date(item['data']['expiration']);
    })

  }

  cancelEditing() {
    let _idx = 0;
    for (let item of this.licenseArray) {
      if (item.editing) break;
      _idx++;
    }

    if (_idx > this.license.length - 1) {
      this.licenseArray.splice(_idx, 1);
    }
    else {
      for (let key in this.license[_idx]) {
        if (key === 'expiration') {
          this.licenseArray[_idx]['data'][key] = new Date(this.license[_idx][key]);
        }
        else {
          this.licenseArray[_idx]['data'][key] = this.license[_idx][key];
        }
      }
      this.licenseArray[_idx].editing = false;
    }
    this.cdr.detectChanges();
  }

  addNewLicense() {
    let temp = {
      'user_id': this.user_id,
      'number': '',
      'board': '',
      'country': '',
      'type': '',
      'state': '',
      'expiration': ''
    }
    this.licenseArray.push({
      data: temp,
      editing: true,
      errors: { ...this.errors }
    });
    this.cdr.detectChanges();
  }


  openLicenseTypeSelection(_idx) {
    if (!this.licenseMetaData.loaded) {
      this.licenseMetaData.data = this.firebaseUtility.getDocument(this.licenseTypesPath).toPromise();
      this.licenseMetaData.loaded = true;
    }
    this.selectLicenseType = true;
  }

  saveLicenseType(type, _idx) {
    this.selectLicenseType = false;
    if (!type) return;
    this.licenseArray[_idx].data['type'] = type;
    this.licenseArray[_idx].errors['type'] = false;
    this.licenseArray[_idx].errors['board'] = false;

    this.licenseMetaData.data.then(
      data => {
        for (let key in data) {
          for (let tp in data[key]) {
            if (tp === type) {
              this.licenseArray[_idx].data['board'] = key;
              return;
            }
          }
        }
      }
    )
    this.cdr.detectChanges();
  }

  isEditing() {
    for (let item of this.licenseArray) {
      if (item.editing) return true;
    }
    return false;
  }


  deleteLicense(_idx) {
    this.profileService.deleteLisense(this.licenseArray[_idx].data['id']).subscribe(
      resp => {
        this.openSnackBar("License deleted successfully", {success: true});
        this.toggleCompleteIncomplete();
        this.notifyProfile();
      },
      err => {
        this.openSnackBar("Something went wrong, please try again", {error: true});
        console.log(err);
      }
    )
    this.licenseArray.splice(_idx, 1);
    this.cdr.detectChanges();
  }

  save() {
    let _idx = 0;
    for (let item of this.licenseArray) {
      if (item.editing) break;
      _idx++;
    }

    // let valid = true;

    // for (let key of this.requiredFields) {
    //   if( key === 'expiration' ){
    //     this.licenseArray[_idx]['errors'][key] = false;
    //     if( !this.licenseArray[_idx]['data'][key] ){
    //       this.licenseArray[_idx]['errors'][key] = true;
    //       this.licenseArray[_idx]['data'][key] = '';
    //       valid = false;
    //     }
    //     else if( moment(this.licenseArray[_idx]['data'][key], "mm/dd/yyyy") <= moment() ){
    //       this.licenseArray[_idx]['errors'][key] = true;
    //       this.licenseArray[_idx]['data'][key] = '';
    //       valid = false;
    //     }
    //   }
    //   else if (!this.licenseArray[_idx]['data'][key] || this.licenseArray[_idx]['data'][key].match(/^\s*$/)) {
    //     this.licenseArray[_idx]['errors'][key] = true;
    //     this.licenseArray[_idx]['data'][key] = '';
    //     valid = false;
    //   }
    //   else {
    //     this.licenseArray[_idx]['errors'][key] = false;
    //   }
    // }

    // if (!valid) {
    //   alert("there are errors in license!");
    //   return;
    // }

    this.licenseArray[_idx].editing = false;
    this.cdr.detectChanges();
    this.upload(_idx)
  }

  licenseValid() {
    let _idx = 0;
    for (let item of this.licenseArray) {
      if (item.editing) break;
      _idx++;
    }

    let valid = true;

    for (let key of this.requiredFields) {
      this.licenseArray[_idx]['errors'][key] = false;
      if (key === 'expiration') {
        if (!this.licenseArray[_idx]['data'][key]) {
          valid = false;
        }
        else if (moment(this.licenseArray[_idx]['data'][key], "mm/dd/yyyy") <= moment()) {
          this.licenseArray[_idx]['errors'][key] = true;
          valid = false;
        }
      }
      else if( key === 'number' ){
        if( !this.licenseArray[_idx]['data'][key] || !this.licenseArray[_idx]['data'][key].match(/^(?=.*[A-Za-z\d]).{1,}$/) ){
          valid = false;
          this.licenseArray[_idx]['errors'][key] = true;
        }
      }
      else if (!this.licenseArray[_idx]['data'][key] || this.licenseArray[_idx]['data'][key].match(/^\s*$/)) {

        valid = false;
      }

    }
    return valid
  }

  upload(_idx) {
    const _copy = JSON.parse(JSON.stringify(this.licenseArray));
    const payload = {
      "profile": {
        "license": [{ ..._copy[_idx].data }]
      }
    }

    payload.profile.license[0]['expiration'] = (new Date(payload.profile.license[0]['expiration'])).getTime();
    this.cdr.detectChanges();

    if (payload.profile.license[0]['id']) {
      this.profileService.putLicense(payload).subscribe(
        response => {
          this.openSnackBar("License successfully updated", {success: true});
          this.notifyProfile();
          this.toggleCompleteIncomplete();
          this.cdr.detectChanges();
        },
        err => {
          this.openSnackBar("Something went wrong, please try again", {error: true});
          console.log(err);
        })
    }
    else {
      this.profileService.postLicense(payload).subscribe(
        response => {
          this.licenseArray[_idx].data = response['data']['license'][0];
          this.licenseArray[_idx].data.expiration = new Date(this.licenseArray[_idx].data.expiration);
          this.openSnackBar("License added successfully", {success: true});
          this.notifyProfile();
          this.toggleCompleteIncomplete();
          this.cdr.detectChanges();
        },
        err => {
          this.openSnackBar("Something went wrong, please try again", {error: true});
          console.log(err);
        })
    }
  }

  notifyProfile() {
    const _lArray = JSON.parse(JSON.stringify(this.licenseArray))
    const data = _lArray.map(item => {
      item.data['expiration'] = (new Date(item.data['expiration'])).getTime();
      return item.data;
    })

    this.onUpdate.emit(JSON.parse(JSON.stringify(data)));
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


  handleAddressChange(_event, _idx) {
    this.stateEditing = false;
    let state = '';
    let country = '';
    const address_components = _event['address_components'];

    for (let area of address_components) {
      const state_idx = area['types'].findIndex(val => val == 'administrative_area_level_1');
      const country_idx = area['types'].findIndex(val => val == 'country');

      if (state_idx > -1) {
        state = area['long_name'];
      }

      if (country_idx > -1) {
        country = area['long_name'];
      }
    }

    if (state && country) {
      this.licenseArray[_idx]['data']['state'] = state;
      this.licenseArray[_idx]['data']['country'] = country;
    }
    else {
      this.licenseArray[_idx]['data']['state'] = undefined;
      this.licenseArray[_idx]['data']['country'] = '';
      this.cdr.detectChanges();
      alert('Please select a valid state');

    }
    this.cdr.detectChanges();

  }

  toggleCompleteIncomplete() {
    this.originalLicenseArray = JSON.parse(JSON.stringify(this.licenseArray));
    this.originalLicenseArray.forEach(item => {
      item['data']['expiration'] = new Date(item['data']['expiration']);
    })
    if (this.licenseArray.length) this.complete.emit();
    else this.inComplete.emit();
  }

  toDate(_dt) {
    return new Date(_dt)
  }

  scrollToEdit() {
    setTimeout(_ => { this.editPane.nativeElement.scrollIntoView({ behavior: "smooth" }); console.log('scroll') }, 10)
  }

  licenseChanged(idx) {
    if (idx > this.originalLicenseArray.length - 1) return true;
    for (let key in this.licenseArray[idx].data) {
      if (key == 'expiration') {
        if (this.licenseArray[idx]['data'][key].getTime() != this.originalLicenseArray[idx]['data'][key].getTime()) return true;
      }
      else if (this.licenseArray[idx]['data'][key] != this.originalLicenseArray[idx]['data'][key]) return true;
    }
    return false;
  }
}
