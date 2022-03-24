import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'kt-email',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.scss']
})
export class EmailComponent implements OnInit {

  @Input() settings;
  @Output() settingsUpdated = new EventEmitter<any>();

  email_appointment = '0';
  email_message = '0';
  email_file = false;


  constructor() { }

  ngOnInit() {
    this.init();
  }

  init() {
    this.email_appointment = this.settings['email_appointment'].toString();
    this.email_message = this.settings['email_message'].toString();
    if (this.settings['email_file'] == 10) this.email_file = true;
  }

  updateSetting() {
    this.settings['email_appointment'] = parseInt(this.email_appointment);
    this.settings['email_message'] = parseInt(this.email_message);
    this.settings['email_file'] = this.email_file ? 10 : 30;
    this.settingsUpdated.emit();
  }

}
