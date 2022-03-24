// tslint:disable-next-line:indent
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, throwError, from, zip, Subject } from 'rxjs';
import { map, catchError, flatMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { SessionStore } from './session-store.service';
import { FireBaseUserService } from '../user/fire-base-user.service';
import { Router } from '@angular/router';
import * as moment from 'moment';



@Injectable({
	providedIn: 'root'
})
export class BaseService {

	constructor(public httpClient: HttpClient, public sessionStore: SessionStore, protected user: FireBaseUserService, private router: Router) {
	}

	private tokenUserMissing() {
		this.user.logout();
		this.router.navigate(['auth', 'login']);
	}

	private getHeaders() {

		const tokenObs = from(this.user.getTokenAutoRefresh());
		const userId = from(this.user.getUserId());

		return zip(tokenObs, userId).pipe(
			map(_meta => {

				const [token, userId] = _meta;
				if (!userId || !token) {
					this.tokenUserMissing();
					return throwError(new Error('Token or UserId missing'));
				}

				const timeStamp = (new Date()).getTime().toString();
				const headers = new HttpHeaders({
					'Session-Token': token,
					'Account-Id': userId,
					'content-type': 'application/json',
					'Certificate-Hash': 'L0Ff3aXuI4BTX2qy6IeIvsxQKT1GLI/AwoDESoC6O4o=',
					'App-Platform': 'Android-Native',
					'App-Version': environment.version,
					Time: timeStamp
				});

				return headers;
			})
		)
	}

	public handleError(error: any) {
		const errMsg = (error.message) ? error.message :
			error.status ? '${error.status} - ${error.statusText}' : 'Server error';
		return throwError(errMsg);
	}

	protected httpGet(url: string): Observable<any> {
		url = environment.apiUrlIp + url;
		return this.httpClient.get(url).pipe(map(res => res as any), catchError(error => this.handleError(error)));
	}

	httpGetWithHeader(url: string): Observable<any> {

		url = environment.apiUrlIp + url;
		return this.getHeaders().pipe(
			flatMap((header: HttpHeaders) => {
				return this.httpClient.get(url, { headers: header })
					.pipe(
						map(res => res as any),
						catchError(error => this.handleError(error))
					);
			})
		)
	}

	httpPostWithHeader(url: string, body: any): Observable<any> {
		url = environment.apiUrlIp + url;
		return this.getHeaders().pipe(
			flatMap((header: HttpHeaders) => {
				return this.httpClient.post(url, body, { headers: header })
					.pipe(
						map(res => res as any),
						catchError(error => this.handleError(error))
					);
			})
		)
	}

	httpPostWithHeaderV2(url: string, body: any): Observable<any> {
		const tz = moment().utcOffset().toString();
		url = environment.apiUrlIpV2 + url;
		return this.getHeaders().pipe(
			flatMap((header: HttpHeaders) => {
				header = header.set('tz', tz);
				header = header.delete('App-Platform').set('App-Platform', 'Web');
				return this.httpClient.post(url, body, { headers: header })
					.pipe(
						map(res => res as any),
						catchError(error => this.handleError(error))
					);
			})
		)
	}

	httpPut(url: string, body: any): Observable<any> {
		url = environment.apiUrlIp + url;
		return this.httpClient.put(url, body);
	}

	httpPutWithHeader(url: string, body: any): Observable<any> {
		url = environment.apiUrlIp + url;
		return this.getHeaders().pipe(
			flatMap((header: HttpHeaders) => {
				return this.httpClient.put(url, body, { headers: header })
					.pipe(
						map(res => res as any),
						catchError(error => this.handleError(error))
					);
			})
		)
	}


	httpDeleteWithHeader(url: string): Observable<any> {
		url = environment.apiUrlIp + url;
		return this.getHeaders().pipe(
			flatMap((header: HttpHeaders) => {
				return this.httpClient.delete(url, { headers: header })
					.pipe(
						map(res => res as any),
						catchError(error => this.handleError(error))
					);
			})
		)
	}

	postAccount(name, uid, token) {

		const url = environment.apiUrlIp + 'account';
		const timeStamp = (new Date()).getTime().toString();
		const headers = new HttpHeaders({
			'Session-Token': token,
			'Account-Id': uid,
			'content-type': 'application/json',
			'Certificate-Hash': 'L0Ff3aXuI4BTX2qy6IeIvsxQKT1GLI/AwoDESoC6O4o=',
			'App-Platform': 'Android-Native',
			'App-Version': environment.version,
			Time: timeStamp
		});


		return this.httpClient.post(url, { account: { name: name } }, { headers: headers })
	}

	getAttachmentForProfile(time: string, count: string, profile = true) {
		const tz = moment().utcOffset();
		const url = environment.apiUrlIp + 'attachment';

		return this.getHeaders().pipe(
			flatMap((header: HttpHeaders) => {
				header = header.set('tz', tz.toString());
				const param = {
					time: time,
					count: count,
					profile: 'true'
				}
				if( !profile ) delete param['profile'];
				return this.httpClient.get(url, {
					headers: header, params: param
				})
					.pipe(
						map(res => res as any),
						catchError(error => this.handleError(error))
					);
			})
		)
	}


	signUpAcceptAgreement(uid, token, payload) {

		const url = environment.apiUrlIp + 'account';
		const timeStamp = (new Date()).getTime().toString();
		const headers = new HttpHeaders({
			'Session-Token': token,
			'Account-Id': uid,
			'content-type': 'application/json',
			'Certificate-Hash': 'L0Ff3aXuI4BTX2qy6IeIvsxQKT1GLI/AwoDESoC6O4o=',
			'App-Platform': 'Android-Native',
			'App-Version': environment.version,
			Time: timeStamp
		});


		return this.httpClient.put(url, payload, { headers: headers })
	}


	getSnapshot(time: number, count: string) {
		// @QueryParam("from") String from_with_tz, @QueryParam("count") Integer count,
		// @QueryParam("subscriber") Boolean subscriber, @QueryParam("topic") Boolean topic
		const tz = moment().utcOffset().toString();
		const url = environment.apiUrlIp + 'chat/snapshot';
		let _temp = moment(time);
		let _x = _temp.toISOString();
		_x = _x.split('.')[0] + '-0000';

		return this.getHeaders().pipe(
			flatMap((header: HttpHeaders) => {
				header = header.set('tz', tz.toString());
				return this.httpClient.get(url, {
					headers: header, params: {
						from: _x,
						count: count.toString(),
						subscriber: 'true',
						topic: 'true'
					}
				})
					.pipe(
						map(res => res as any),
						catchError(error => this.handleError(error))
					);
			})
		)
	}


	getConversation(time: number, count: string, topicId: string) {
		// @QueryParam("from") String from_with_tz, @QueryParam("count") Integer count,
		// @QueryParam("subscriber") Boolean subscriber, @QueryParam("topic") Boolean topic
		const tz = moment().utcOffset().toString();
		const url = environment.apiUrlIp + 'chat/conversation/' + topicId;
		let _temp = moment(time);
		let _x = _temp.toISOString();
		_x = _x.split('.')[0] + '-0000';

		return this.getHeaders().pipe(
			flatMap((header: HttpHeaders) => {
				// header = header.set('tz', tz.toString());
				return this.httpClient.get(url, {
					headers: header, params: {
						from: _x,
						count: count,
						subscriber: 'true',
						topic: 'true',
						availability: 'true'
					}
				})
					.pipe(
						map(res => res as any),
						catchError(error => this.handleError(error))
					);
			})
		)
	}

	getFiles(url: string, time: string, count: string, extraQueryParam: any = {}) {
		const tz = moment().utcOffset();
		url = environment.apiUrlIp + url;

		return this.getHeaders().pipe(
			flatMap((header: HttpHeaders) => {
				header = header.set('tz', tz.toString());

				const param = {
					...extraQueryParam,
					time: time,
					count: count
				}

				return this.httpClient.get(url, {
					headers: header, params: param
				}).pipe(
					map(res => res as any),
					catchError(error => this.handleError(error))
				);
			})
		)
	}

	getMeetingChatSnapShot(time: number, count: string, meeting_id: string) {

		const tz = moment().utcOffset().toString();
		const url = environment.apiUrlIp + 'chat/snapshot/meeting';
		let temp = moment(time);
		let serverFormatTime = temp.toISOString();
		serverFormatTime = serverFormatTime.split('.')[0] + '-0000';

		return this.getHeaders().pipe(
			flatMap((header: HttpHeaders) => {
				header = header.set('tz', tz.toString());
				return this.httpClient.get(url, {
					headers: header, params: {
						from: serverFormatTime,
						count: count.toString(),
						subscriber: 'true',
						topic: 'true',
						meeting_id: meeting_id
					}
				})
					.pipe(
						map(res => res as any),
						catchError(error => this.handleError(error))
					);
			})
		)
	}

}