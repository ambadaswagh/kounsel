import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {Observable, Subject} from 'rxjs';
import {parallel} from 'async';
import {AccountService} from '../../../services/general/account/account.service';
import { AccountModel } from '../../../model/general/account/account.model'

@Injectable({
	providedIn: 'root'
})
export class AccountResolverService implements Resolve<AccountModel> {

	constructor(
		private router: Router,
		private accountService: AccountService
	) {
	}

	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<AccountModel> | Promise<AccountModel> | AccountModel {
		const observer = new Subject<any>();
		parallel(
			{
				accountInfo: (AccountInfo) => {
					this.accountService.getAccount().subscribe((data) => {
						AccountInfo(null, data.data);
					}, (error) => {
						AccountInfo(error, null);
					});
				},
			},
			(err: string, results: any) => {
				if (err && err.indexOf('401 OK') !== -1) {
					this.router.navigate(['pages/login']).then();
					observer.next(results);
					observer.complete();
				}
				observer.next(results);
				observer.complete();
			});
		return observer.asObservable();
	}
}
