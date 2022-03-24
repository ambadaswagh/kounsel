import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { FireBaseUserService } from '../services/user/fire-base-user.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthGuard implements CanActivate {

  constructor(private router: Router, private user: FireBaseUserService){}

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    try {
      const user = await this.user.isLoggedIn();
      if( user ){
        return true;
      }
      
      this.router.navigate(['auth', 'login'], { queryParams: { returnUrl: state.url } });
      return false;
    } catch (error) {
      this.router.navigate(['auth', 'login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
  }
  
}
