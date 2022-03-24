import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'kt-terms-condition',
  templateUrl: './terms-condition.component.html',
  styleUrls: ['./terms-condition.component.scss']
})
export class TermsConditionComponent implements OnInit {
  @Output() close = new EventEmitter<boolean>();

  menu = {
    'termCondition': {
      selected: false,
      open: false
    },

    'privacyPolicy': {
      selected: false,
      open: false
    },

    'confidentialityPolicy': {
      selected: false,
      open: false
    },

    'feeAuthorizationAgreement': {
      selected: false,
      open: false
    },

    'escrowTerms': {
      selected: false,
      open: false
    }
  }
  constructor() { }

  ngOnInit() {
  }

  closeM() {
    this.close.emit(false);
    this.resetMenu();
  }

  closeY() {
    this.close.emit(true);
    this.resetMenu();
  }

  toggleSelection(key: string) {
    this.menu[key]['selected'] = !this.menu[key]['selected'];
  }

  toggleMenu(key: string) {
    if (this.menu[key]['open']) {
      this.menu[key]['open'] = false;
    }
    else {
      for (let _key in this.menu) this.menu[_key]['open'] = key == _key;
    }
  }

  isValid() {
    for (let _key in this.menu) {
      if (!this.menu[_key].selected) {
        return false;
      }
    }
    return true;
  }

  resetMenu() {
    for (let key in this.menu) {
      this.menu[key]['selected'] = false;
      this.menu[key]['open'] = false;
    }
  }

}
