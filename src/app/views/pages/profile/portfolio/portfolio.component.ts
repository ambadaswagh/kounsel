import { Component, OnInit, Input, HostListener, Output, EventEmitter } from '@angular/core';
import { ProfileService } from '../../../../core/services/profile/profile.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActionNotificationComponent } from '../../../partials/content/crud';
import { Profile } from '../../../../core/model/profile/profile.model';

@Component({
  selector: 'kt-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent implements OnInit {
  @Input() profile : Profile;
  @Input() newProfile;
  @Output() completed = new EventEmitter<any>();
  @Output() incomplete = new EventEmitter<any>();

  portfolio = [
    { name: 'Behance', key: 'behance', value: '', editing: false, svgName : 'behance' },
    { name: 'Medium', key: 'medium',value: '', editing: false, svgName: 'plus' },
    { name: 'Dribble', key: 'dribble', value: '', editing: false, svgName : 'plus'},
    { name: 'Linkedin', key: 'linkedin', value: '', editing: false, svgName: 'linked-in'},
    { name: 'Stack overflow', key: 'stackoverflow', value: '', editing: false, svgName: 'stack-overflow' },
    { name: 'Yelp', key: 'yelp', value: '', editing: false, svgName: 'yelp' },
    { name: 'Web', key: 'web', value: '', editing: false, svgName: 'web' }
  ];

  original = [];
  spaceValidationRegex = new RegExp(/^\s*$/);
  formValid = false;


  screenWidth : number;
  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    this.screenWidth = window.innerWidth;
  }

  constructor( private profileService: ProfileService, private _snackBar: MatSnackBar ) {
    this.onResize();
  }

  ngOnInit() {
    this.resetPortfolioItem();
  }

  resetPortfolioItem(){
    this.portfolio.forEach( item => {
      if( this.profile.hasOwnProperty(item.key) ){
        item.value = this.profile[item.key];
      }
      item.editing = false;
    });

    this.portfolio = JSON.parse(JSON.stringify(this.portfolio));
    this.original = JSON.parse(JSON.stringify(this.portfolio));
  }

  cancel(){
    this.portfolio = JSON.parse(JSON.stringify(this.original));
  }
  save(){

    let payload = {}
    this.portfolio.forEach( item => {
      item.value = item.value.trim();
      this.profile[item.key] = item.value;
      payload[item.key] = item.value;
      item.editing = false;
      delete item['dirty'];
    } )

    this.original = JSON.parse(JSON.stringify(this.portfolio));

    if( !this.newProfile ){
      this.profileService.putProfile({profile: payload}).subscribe( response => {
        console.log(response);
        this.openSnackBar("Portfolio successfully updated", {success: true});
        this.toggleCompleteIncomplete();
      },
      err => {
        console.log(err);
        this.openSnackBar("Something went wrong, please try again", {error: true});
      } )
    }
    else{
      this.profileService.postProfile({profile: payload}).subscribe( response => {
        console.log(response);
        this.openSnackBar("Portfolio successfully updated", {success: true});
        this.toggleCompleteIncomplete();
      },
      err => {
        console.log(err);
        this.openSnackBar("Something went wrong, please try again", {error: true});
      } )
    }
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

  isChanged(){
    for(let i = 0; i < this.portfolio.length; i++){
      if( this.portfolio[i].value != this.original[i].value ){
        return true;
      }
    }
    return false;
  }

  toggleCompleteIncomplete(){
    for( let item of this.portfolio ){
      if( item.value ){
        this.completed.emit();
        return;
      }
    }
    this.incomplete.emit();
  }

  isValid(){
    let errFlag = true;
    for(let item of this.portfolio){
      item['error'] = undefined;
      if( item.editing && this.spaceValidationRegex.test(item.value)){
        item['error'] = true;
        errFlag = false;
      }
    }
    this.formValid = errFlag;
  }

  ifAllSpace(inp){
		 let spaceValidationRegex = new RegExp(/^\s*$/);
		 if (spaceValidationRegex.test(inp)) {
			return false;
		 }
		 return false;
	}
}
