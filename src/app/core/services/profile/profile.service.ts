import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {BaseService} from '../base/base.service';
import { take } from 'rxjs/operators';


@Injectable({
	providedIn: 'root'
})
export class ProfileService extends BaseService {

	public getProfile(): Observable<any> {
		return this.httpGetWithHeader('profile/edit');
	}

	public getPublicProfile(id): Observable<any> {
		return this.httpGet(`public/profile/${id}`);
	}

	public postProfile(payLoad): Observable<any> {
		return this.httpPostWithHeader('profile', payLoad);
	}

	public putProfile(payLoad): Observable<any> {
		return this.httpPutWithHeader('profile', payLoad);
	}

	public putSkill(payLoad): Observable<any> {
		return this.httpPutWithHeader('profile/skill', payLoad);
	}

	public postSkill(payLoad): Observable<any> {
		return this.httpPostWithHeader('profile/skill', payLoad);
	}

	public putLicense(payLoad): Observable<any> {
		return this.httpPutWithHeader('profile/license', payLoad);
	}

	public postLicense(payLoad): Observable<any> {
		return this.httpPostWithHeader('profile/license', payLoad);
	}

	public deleteLisense(id): Observable<any>{
		return this.httpDeleteWithHeader(`profile/license/${id}`);
	}

	public getAvailability(): Observable<any> {
		return this.httpGetWithHeader('availability');
	}

	public putAvalibility(payload){
		return this.httpPutWithHeader('availability', payload);
	}

	public postAvalibility(payload){
		return this.httpPostWithHeader('availability', payload);
	}

	public putAttachment(payload){
		return this.httpPutWithHeader('attachment', payload);
	}
}
