import { Injectable } from '@angular/core';
import { BaseService } from '../../base/base.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService extends BaseService {

  getSettings() {
    return this.httpGetWithHeader('account/preference');
  }

  putSettings(payload) {
    return this.httpPutWithHeader('account/preference', payload);
  }
}
