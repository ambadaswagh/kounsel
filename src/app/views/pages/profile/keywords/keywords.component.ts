import { Component, OnInit, Input, ChangeDetectorRef, Output, EventEmitter} from '@angular/core';
import { ProfileService } from '../../../../core/services/profile/profile.service';
import { MatSnackBar } from '@angular/material';
import * as _ from 'lodash';
import { ActionNotificationComponent } from '../../../partials/content/crud';
import { Profile } from '../../../../core/model/profile/profile.model';
@Component({
  selector: 'kt-keywords',
  templateUrl: './keywords.component.html',
  styleUrls: ['./keywords.component.scss']
})
export class KeywordsComponent implements OnInit {

  @Input() profile : Profile;
  @Input() newProfile;
  @Output() complete = new EventEmitter<any>();
  @Output() inComplete = new EventEmitter<any>();
  keywords : Array<string> = [];
  keywordText: string = '';
  dropdownActive: boolean = false;
  // allKeywordsList : Array<string> = []; for autoComplete
  originalUsersKeyword: any = [];
  editingKeywords: boolean = false;
  error = '';

  constructor(private profileService: ProfileService, private _snackBar: MatSnackBar, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    if( this.profile.hasOwnProperty('keywords') ){
      this.keywords = this.profile.keywords.split(' ')
    }

    this.originalUsersKeyword = [...this.keywords];
  }

  /**
   * add new keyword
   */
  addKeyword() {
    if( this.keywordText.match(/^\s*$/) ){
      this.keywordText = '';
      this.error = 'Please enter text';
      return;
    }
    this.error = '';
    this.keywords.push(this.keywordText);
    this.keywordText = '';
  }

  /**
   * remove keyword
   * @param index index of element to bre removed
   */
  removeKeyword(index: number) {
    this.keywords.splice(index, 1);
  }

  /**
   * check if original keywords has been changes
   * to turn on/off the save/cancel button
   */
  isKeywordChanged() {
    return !_.isEqual(_.countBy(this.keywords), _.countBy(this.originalUsersKeyword));
  }

  /**
   * revert all changes to keyword
   */
  cancelKeywordChanges() {
    this.keywords = JSON.parse(JSON.stringify(this.originalUsersKeyword));
    this.editingKeywords = false;
    this.cdr.detectChanges();
  }

  /**
   * update user keywords
   */
  updateKeywords() {
    this.originalUsersKeyword = JSON.parse(JSON.stringify(this.keywords));
    this.editingKeywords = false;

    let keywordUpdatePayload = {
      profile: {
        keywords: this.keywords.join(' ')
      }
    }

    this.cdr.detectChanges();

    if( !this.newProfile ){
      this.profileService.putProfile(keywordUpdatePayload)
      .subscribe( response => {
        this.profile.keywords = this.keywords.join(' ');
        this.openSnackBar("Keywords successfully updated", {success: true});
        this.toggleCompleteIncomplete();
        this.cdr.detectChanges();
      },
      err => {
        console.log(err);
        this.openSnackBar("Something went wrong, please try again", {error: true});
      } )
    }
    else{
      this.profileService.postProfile(keywordUpdatePayload)
      .subscribe( response => {
        this.profile.keywords = this.keywords.join(' ');
        this.openSnackBar("Keywords successfully updated", {success: true});
        this.toggleCompleteIncomplete();
        this.cdr.detectChanges();
      },
      err => {
        console.log(err);
        this.openSnackBar("Something went wrong, please try again", {error: true});
      } )
    }

    
  }

  toEdit() {
    return (this.editingKeywords || this.originalUsersKeyword.size == 0)
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

  limit(value: string){
    if(value.length > 32){
      this.keywordText = value;
      this.cdr.detectChanges();
      this.keywordText = value.substr(0,32);
      this.cdr.markForCheck();
    }
  }

  toggleCompleteIncomplete(){
    if( this.keywords.length ) this.complete.emit();
    else this.inComplete.emit();
  }

}
