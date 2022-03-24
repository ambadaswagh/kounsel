// tslint:disable-next-line:indent
import { Injectable } from '@angular/core';
import { AuthInfo } from '../../auth/_models/auth-info.model';

import * as cloneDeep from 'lodash';

@Injectable({
	providedIn: 'root'
})
export class SessionStore {

	private sessionToken: string;
	private accountId: string;
	private userId: string;

	private authInfo: AuthInfo;

	public setSessionToken(token) {
		this.sessionToken = (' ' + token).slice(1);
	}
	public getSessionToken() {
		return this.sessionToken;
	}

	public setAccountId(accountId) {
		this.accountId = (' ' + accountId).slice(1);
	}
	public getAccountId() {
		return this.accountId;
	}

	public setUserId(userId) {
		this.userId = (' ' + userId).slice(1);
	}
	public getUserId() {
		return this.userId;
	}

	public setAuthInfo(authInfo: AuthInfo) {
		this.authInfo = authInfo;
		if (authInfo) {
			this.sessionToken = authInfo.user.stsTokenManager.accessToken;
			this.accountId = authInfo.user.uid;
			this.userId = authInfo.user.uid;
		}
	}

	public getAuthInfo() {
		return cloneDeep(this.authInfo);
	}
}
