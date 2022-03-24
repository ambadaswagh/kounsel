import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseService } from '../../base/base.service';
import * as moment from 'moment';
import * as Fingerprint2 from 'fingerprintjs2';
import { Account } from '../../../model/general/account/account.model'

@Injectable({
  providedIn: 'root'
})

export class AccountService extends BaseService {
  _time = moment('2018-04-02', 'YYYY-MM-DD').valueOf();
  contactStartTime = {
    legal_ach_fees_agreement: this._time,
    legal_confidentiality_agreement: this._time,
    legal_escrow_agreement: this._time,
    legal_privacy_policy: this._time,
    legal_user_agreement: this._time,
  }

  // private accountId = localStorage.getItem('mirach_accountId');

  public getAccount(): Observable<any> {
    return this.httpGetWithHeader('account/' + this.user.userId);
  }

  termAndConditionValidation(account: Account) {
    // all should exist
    if (
      !account.legal_ach_fees_agreement ||
      !account.legal_confidentiality_agreement ||
      !account.legal_escrow_agreement ||
      !account.legal_privacy_policy ||
      !account.legal_user_agreement
    ) {
      return false;
    }

    // restBoolean check
    if (
      account.legal_ach_fees_agreement == 30 ||
      account.legal_confidentiality_agreement == 30 ||
      account.legal_escrow_agreement == 30 ||
      account.legal_privacy_policy == 30 ||
      account.legal_user_agreement == 30
    ) {
      return false;
    }

    // all valid date
    if (
      !moment(account.legal_ach_fees_agreement).isValid() ||
      !moment(account.legal_confidentiality_agreement).isValid() ||
      !moment(account.legal_escrow_agreement).isValid() ||
      !moment(account.legal_privacy_policy).isValid() ||
      !moment(account.legal_user_agreement).isValid()
    ) {
      return false;
    }

    // all date consistent with terms init date
    if (
      !this.validTime(account.legal_ach_fees_agreement, this.contactStartTime.legal_ach_fees_agreement) ||
      !this.validTime(account.legal_confidentiality_agreement, this.contactStartTime.legal_confidentiality_agreement) ||
      !this.validTime(account.legal_escrow_agreement, this.contactStartTime.legal_escrow_agreement) ||
      !this.validTime(account.legal_privacy_policy, this.contactStartTime.legal_privacy_policy) ||
      !this.validTime(account.legal_user_agreement, this.contactStartTime.legal_user_agreement)
    ) {
      return false;
    }

    return true;
  }

  validTime(userAcceptanceTime: string, termsLastUpdateTime: number) {
    if (moment(userAcceptanceTime, 'YYYY-MM-DDTHH:mm:ssZ').valueOf() > termsLastUpdateTime) return true;
    return false;
  }

  async setTokenForPushNotification(TOKEN: string): Promise<Observable<any>> {
    try {
      const components = await Fingerprint2.getPromise({});
      var values = components.map(function (component) { return component.value })
      var hashVal = Fingerprint2.x64hash128(values.join(''), 31);
      const payload = {
        firebase:{
          instance_id: TOKEN,
          user_agent: navigator.userAgent,
          platform:'web', // navigator.platform
          android_id: hashVal,
          device: navigator.platform,
          user_id: this.user.userId
        }
      }
      console.log(payload)
      return this.httpPostWithHeader('account/firebase', payload);
    } catch (error) {
      throw error;
    }
  }

  deleteTokenForPushNotification(token){
    return this.httpDeleteWithHeader('account/firebase/'+token);
  }

}


