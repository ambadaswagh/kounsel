import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SettingsService } from '../../../core/services/general/settings/settings.service';
import { MatSnackBar } from '@angular/material';
import { ActionNotificationComponent } from '../../partials/content/crud';

@Component({
  selector: 'kt-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  menu = {
    counselor: true,
    notification: false,
    email: false
  }

  counselor_submenu = {
    message: true,
    counselingSession: false,
    searchVisibility: false
  }

  settings;

  constructor(private activatedRoute: ActivatedRoute, private settingService: SettingsService, private _snackBar: MatSnackBar) { }

  ngOnInit() {
    this.settings = JSON.parse(JSON.stringify(this.activatedRoute.snapshot.data.response.data));
    console.log(this.settings);
    this.refreshSettings();
  }

  menuToggle(item: string) {
    for (let key in this.menu) this.menu[key] = key == item;
    for (let key in this.counselor_submenu) this.counselor_submenu[key] = false;
  }

  counselorSubMenuToggle(item: string) {
    for (let key in this.counselor_submenu) this.counselor_submenu[key] = key == item;
    this.menu.email = false;
    this.menu.notification = false;
  }

  updateSetting() {
    this.settingService.putSettings({
      preferences: this.settings
    }).subscribe(
      response => {
        console.log(response);
      },
      err => {
        this.openSnackBar("Something went wrong, please try again", {error: true});
        this.refreshSettings();
        console.log(err);
      }
    )
  }

  refreshSettings() {
    this.settingService.getSettings().subscribe(
      response => {
        this.settings = response.data;
      },
    )
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

  counslourPrestine() {
    return !this.counselor_submenu.counselingSession && !this.counselor_submenu.message && !this.counselor_submenu.searchVisibility
  }


}
