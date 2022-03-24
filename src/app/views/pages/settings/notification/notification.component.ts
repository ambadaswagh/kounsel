import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'kt-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {

  @Input() settings;
  @Output() settingsUpdated = new EventEmitter<any>();

  info = {
    notification_new_event: false,
    notification_event_status: false,
    notification_payment: false,
    notification_message: false,
    notification_file: false
  }
  constructor() { }

  ngOnInit() {
    this.init();
  }

  toggleInfo(item: string) {
    this.info[item] = !this.info[item];
    this.updateSetting(item, this.info[item]);
  }

  init() {
    if (this.settings['notification_new_event'] == 10) this.info.notification_new_event = true;
    if (this.settings['notification_event_status'] == 10) this.info.notification_event_status = true;
    if (this.settings['notification_payment'] == 10) this.info.notification_payment = true;
    if (this.settings['notification_message'] == 10) this.info.notification_message = true;
    if (this.settings['notification_file'] == 10) this.info.notification_file = true;
  }

  updateSetting(key, value) {
    this.settings[key] = value ? 10 : 30;
    this.settingsUpdated.emit();
  }

}
