import { Component, OnInit, Input, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { ProfileService } from '../../../../core/services/profile/profile.service';
import { MatSnackBar } from '@angular/material';
import * as _ from 'lodash';
import { ActionNotificationComponent } from '../../../partials/content/crud';
import { FireBaseUserService } from '../../../../core/services/user/fire-base-user.service';
import { Skill } from '../../../../core/model/profile/profile.model';

@Component({
  selector: 'kt-skills',
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss']
})
export class SkillsComponent implements OnInit {
  @Input() skills: Array<Skill>;
  @Input() profile;
  @Output() skillIncomplete = new EventEmitter<any>();
  @Output() skillCompleted = new EventEmitter<any>();

  skillKeyWord: string = '';
  dropdownActive: boolean = false;
  // allSkillsList : Array<string> = []; for autoComplete
  originalUsersSkill: any = [];
  editingSkills: boolean = false;
  // user_id: string = localStorage.getItem('mirach_accountId');
  user_id = '';
  error = '';

  constructor(private profileService: ProfileService, private _snackBar: MatSnackBar, private crd: ChangeDetectorRef, private userService: FireBaseUserService) { }

  ngOnInit() {
    this.user_id = this.userService.userId;
    this.skills.sort((a, b) => {
      if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
      else if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
      return 0;
    });
    this.originalUsersSkill = [...this.skills];
  }

  /**
   * add new skill
   */
  addSkill() {
    if (this.skillKeyWord.match(/^\s*$/)) {
      this.skillKeyWord = '';
      this.error = 'Please enter text';
      return;
    }
    this.error = '';
    this.skills.push({
      user_id: this.user_id,
      name: this.skillKeyWord,
      learned: 3
    });
    this.skillKeyWord = '';
  }

  /**
   * remove skill
   * @param index index of element to bre removed
   */
  removeSkill(index: number) {
    this.skills.splice(index, 1);
  }

  /**
   * check if original skills has been changes
   * to turn on/off the save/cancel button
   */
  isSkillChanged() {
    return !_.isEqual(_.countBy(this.skills.map(i => i.name)), _.countBy(this.originalUsersSkill.map(i => i.name)));
  }

  /**
   * revert all changes to skill
   */
  cancelSkillChanges() {
    this.skills = JSON.parse(JSON.stringify(this.originalUsersSkill));
    this.crd.detectChanges();
    this.editingSkills = false;
    this.crd.markForCheck();
  }

  /**
   * update user skills
   */
  updateSkills() {
    this.originalUsersSkill = JSON.parse(JSON.stringify(this.skills));
    this.crd.detectChanges();
    this.editingSkills = false;
    let skillUpdatePayload = {
      profile: {
        skills: this.skills
      }
    }
    this.crd.markForCheck();

    if (Object.keys(this.profile).length) {

      this.profileService.putSkill(skillUpdatePayload).subscribe(
        response => {
          this.openSnackBar("Skills successfully updated", {success: true});
          console.log(response);
          this.completeIncompleteCheck();
        },
        error => {
          this.openSnackBar("Something went wrong, please try again", {error:true});
          console.log(error);
        })

    }
    else {
      this.profileService.postSkill(skillUpdatePayload).subscribe(
        response => {
          this.openSnackBar("Skills successfully updated", {success: true});
          console.log(response);
          this.completeIncompleteCheck();
        },
        error => {
          this.openSnackBar("Something went wrong, please try again", {error:true});
          console.log(error);
        })
    }


  }

  toEdit() {
    return (this.editingSkills || this.originalUsersSkill.size == 0)
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

  limit(value) {
    if (value.length > 32) {
      this.skillKeyWord = value;
      this.crd.detectChanges();
      this.skillKeyWord = value.substr(0, 32);
      this.crd.markForCheck();
    }
  }

  completeIncompleteCheck() {
    if (this.skills.length) this.skillCompleted.emit();
    else this.skillIncomplete.emit();
  }

}
