import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { ProfileService } from '../../../../core/services/profile/profile.service';
import { MatSnackBar } from '@angular/material';
import { ActionNotificationComponent } from '../../../partials/content/crud';

@Component({
  selector: 'kt-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss']
})
export class LocationComponent implements OnInit {
  @Input() profile;
  @Input() newProfile;
  @ViewChild('mCity') myCity: ElementRef;
  @Output() complete = new EventEmitter<any>();
  option = {
    types: ['(cities)']
  }
  stateEditing = true;

  city = '';
  state = '';
  country = '';

  loading = false;

  constructor(private cdr: ChangeDetectorRef, private profileService: ProfileService, private _snackBar: MatSnackBar) { }

  ngOnInit() {
    this.initLocation();
  }

  initLocation() {
    if (this.profile.state && this.profile.country && this.profile.city) {
      const temp = JSON.parse(JSON.stringify(this.profile));
      this.city = temp.city;
      this.state = temp.state;
      this.country = temp.country;
    }
    else {
      this.city = '';
      this.state = '';
      this.country = '';
    }
    this.cdr.detectChanges();
  }

  otherStateChangeEvents() {
    if (this.city !== this.profile.city && !( this.city && this.state && this.country ) ) {
      this.city = '';
      this.cdr.markForCheck();
    }
    this.cdr.detectChanges();
  }

  handleAddressChange(_event) {

    this.city = undefined;
    this.city = undefined;
    this.state = undefined;

    this.stateEditing = false;
    let state = '';
    let country = '';
    let city = '';
    const address_components = _event['address_components'];

    this.cdr.detectChanges();
    for (let area of address_components) {
      const state_idx = area['types'].findIndex(val => val == 'administrative_area_level_1');
      const country_idx = area['types'].findIndex(val => val == 'country');
      const city_idx = area['types'].findIndex(val => val == 'locality');

      if (state_idx > -1) {
        state = area['long_name'];
      }

      if (country_idx > -1) {
        country = area['long_name'];
      }

      if (city_idx > -1) {
        city = area['long_name']
      }
    }

    if (state && country && city) {
      this.city = undefined;
      this.city = city;
      this.state = state;
      this.country = country;
    }
    else {
      this.city = undefined;
      this.state = '';
      this.country = '';
      alert('Please select a valid city from dropdown');
    }
    this.cdr.detectChanges();

  }

  isChanged() {
    return this.city != (this.profile.city || '') || this.state != (this.profile.state || '') || this.country != (this.profile.country || '');
  }

  allFilled() {
    return this.city != '' && this.state != '' && this.country != '';
  }

  save() {
    let payload = {
      profile: {
        city: this.city,
        country: this.country,
        state: this.state
      }
    }

    this.cdr.detectChanges();

    if (!this.newProfile) {
      this.profileService.putProfile(payload)
        .subscribe(
          response => {
            this.profile.city = this.city;
            this.profile.state = this.state;
            this.profile.country = this.country;
            this.complete.emit();
            this.openSnackBar("Location successfully updated", {success: true});
            this.cdr.detectChanges();
          },
          err => {
            console.log(err);
            this.openSnackBar("Something went wrong, please try again", {error: true});
          })
    }
    else{
      this.profileService.postProfile(payload)
        .subscribe(
          response => {
            this.profile.city = this.city;
            this.profile.state = this.state;
            this.profile.country = this.country;

            this.complete.emit();
            this.openSnackBar("Location successfully updated", {success: true});
            this.cdr.detectChanges();
          },
          err => {
            console.log(err);
            this.openSnackBar("Something went wrong, please try again", {error: true});
          })
    }
    

  }


  cancel() {
    this.initLocation();
    this.cdr.detectChanges();
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

}
