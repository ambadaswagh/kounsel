import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'kt-counseling-session',
  templateUrl: './counseling-session.component.html',
  styleUrls: ['./counseling-session.component.scss']
})
export class CounselingSessionComponent implements OnInit {
  @Input() settings;
  @Output() settingsUpdated = new EventEmitter<any>();

  info = {
    counseling_availability: false,
    counseling_licensed_state: false,
    counseling_appointment: false,
  }

  constructor() { }

  ngOnInit() {
    this.initialize();
  }

  toggleInfo(item: string) {
    this.info[item] = !this.info[item];
    this.updateSetting(item, this.info[item]);
  }

  initialize() {
    if (this.settings['counseling_availability'] == 10) {
      this.info.counseling_availability = true;
    }

    if (this.settings['counseling_licensed_state'] == 10) {
      this.info.counseling_licensed_state = true;
    }

    if (this.settings['counseling_appointment'] == 10) {
      this.info.counseling_appointment = true;
    }
  }

  updateSetting(key, value) {
    this.settings[key] = value ? 10 : 30;
    this.settingsUpdated.emit();
  }

}
