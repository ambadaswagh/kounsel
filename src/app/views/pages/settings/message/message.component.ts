import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'kt-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {

  @Input() settings;
  @Output() settingsUpdated = new EventEmitter<any>();

  newInquiry = {
    message_with_payment_method: false,
    message_licensed_state: false,
    message_new_inquiry_availability: false
  }

  constructor() { }

  ngOnInit() {
    this.initalize(this.settings);
  }

  toggleNewInquiry(item: string) {
    this.newInquiry[item] = !this.newInquiry[item];
    this.updateSetting(item, this.newInquiry[item]);
  }

  initalize(settings) {

    // new Inquiry setting
    if (settings['message_with_payment_method'] == 10) {
      this.newInquiry.message_with_payment_method = true;
    }

    if (settings['message_licensed_state'] == 10) {
      this.newInquiry.message_licensed_state = true;
    }

    if (settings['message_new_inquiry_availability'] == 10) {
      this.newInquiry.message_new_inquiry_availability = true;
    }

  }

  updateSetting(key, value) {
    this.settings[key] = value ? 10 : 30;
    this.settingsUpdated.emit();
  }

}
