import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'kt-search-visibility',
  templateUrl: './search-visibility.component.html',
  styleUrls: ['./search-visibility.component.scss']
})
export class SearchVisibilityComponent implements OnInit {

  @Input() settings;
  @Output() settingsUpdated = new EventEmitter<any>();

  info = {
    profile_visibility: false,
    search_visibility_licensed_state: false
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
    if (this.settings['profile_visibility'] == 3) {
      this.info['profile_visibility'] = true;
    }

    if (this.settings['search_visibility_licensed_state'] == 10) {
      this.info['search_visibility_licensed_state'] = true;
    }
  }

  updateSetting(key, value) {
    if (key == 'profile_visibility') {
      this.settings[key] = value ? 3 : 2;
    }
    else if (key == 'search_visibility_licensed_state') {
      this.settings[key] = value ? 10 : 30;
    }

    this.settingsUpdated.emit();
  }

}
