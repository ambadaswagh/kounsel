import { Component, OnInit, Input, ViewChild, NgZone, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ProfileService } from '../../../../core/services/profile/profile.service';
import { MatSnackBar } from '@angular/material';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { take } from 'rxjs/operators';
import { ActionNotificationComponent } from '../../../partials/content/crud';
import { Profile } from '../../../../core/model/profile/profile.model';

@Component({
  selector: 'kt-description',
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.scss']
})
export class DescriptionComponent implements OnInit {
  @Input() profile: Profile;
  @Input() newProfile;
  @ViewChild('autoHeightTextArea') autosize: CdkTextareaAutosize;
  @Output() complete = new EventEmitter<any>();
  @Output() inComplete = new EventEmitter<any>();

  prevDesc = '';
  desc = new FormControl('');
  error = '';

  constructor( private profileService: ProfileService, private _snackBar: MatSnackBar, private _ngZone: NgZone) { }

  ngOnInit() {
    console.log(this.profile, 'test');
    if( this.profile.hasOwnProperty('description') ){
      this.desc.setValue(this.profile.description);
      this.prevDesc = this.profile.description;
    }
  }

  ngOnViewInit(){
    this.triggerResize();
  }

  save(){
    if( this.desc.value.match(/^\s*$/) ){
      this.error = 'Please enter Text';
      this.desc.setValue('');
      return;
    }
    this.error = '';

    let payload = {
      profile: {
        description : this.desc.value
      }
    }

    this.prevDesc = this.desc.value;

    if( !this.newProfile ){
      this.profileService.putProfile(payload).subscribe( data => {
        this.openSnackBar("Description successfully updated", {success: true});
        this.profile.description = this.desc.value;
        this.toggleCompleteIncomplete();
      },
      error => {
        this.openSnackBar("Something went wrong, please try again", {error: true});
        console.log(error);
      })
    }
    else{
      this.profileService.postProfile(payload).subscribe( data => {
        this.openSnackBar("Description successfully updated", {success: true});
        this.profile.description = this.desc.value;
        this.toggleCompleteIncomplete();
      },
      error => {
        this.openSnackBar("Something went wrong, please try again", {error: true});
        console.log(error);
      })
    }

    
  }

  cancel(){
    this.desc.setValue(this.prevDesc);
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

  limit(){
    if(this.desc.value.length > 1000){
      this.desc.setValue(this.desc.value.substr(0,1000))
    }
  }

  triggerResize() {
    // Wait for changes to be applied, then trigger textarea resize.
    this._ngZone.onStable.pipe(take(1))
        .subscribe(() => this.autosize.resizeToFitContent(true));
  }

  toggleCompleteIncomplete(){
    if( this.desc.value ) this.complete.emit();
    else this.inComplete.emit();
  }
}
