import { Injectable } from '@angular/core';
import { auth } from 'firebase/app';
import { ReplaySubject, Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FireBaseUserService {
  logInMethod: string = '';
  userId: string = '';
  userName: string = '';
  userNameProm = new ReplaySubject();
  location = new ReplaySubject();
  userImageObs = new ReplaySubject();


  constructor() { }

  async getTokenAutoRefresh() {
    return auth().currentUser.getIdToken();
  }

  /**
   * if user logged in returns user metadata
   * else returns undefined
   */
  async isLoggedIn() {
    try {
      const user = await new Promise((resolve, reject) => {
        auth().onAuthStateChanged(user => {
          if (user) {

            this.userId = user.uid;
            this.userName = user.displayName;
            // Set logged in method
            if (this.logInMethod == '') {
              for (let method of user.providerData) {
                if (method.providerId == 'google.com') {
                  this.logInMethod = 'google';
                }
                else if (method.providerId == 'facebook.com') {
                  this.logInMethod = 'facebook';
                }
              }
            }


            resolve(user);
          }
          else {
            reject();
          }
        })
      })

      return user;
    } catch (error) {
      return undefined;
    }
  }

  async getUserId() {
    try {
      const user = await this.isLoggedIn();

      if (user) {
        return user['uid'];
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }



  logout() {
    this.reset();
    auth().signOut();
  }

  getLoggedInMethod() {
    return this.logInMethod;
  }

  setLocation(location) {
    this.location.next(location);
  }

  getLocation(): Observable<any> {
    return this.location.asObservable();
  }

  get UserNamePromise() {
    return new Promise((resolve, reject) => {
      this.userNameProm.subscribe(
        name => resolve(name)
      )
    })
  }

  set UserNamePromise(userName) {
    this.userNameProm.next(userName);
  }

  get USER_IMAGE(): any {
    return this.userImageObs.asObservable();
  }

  set USER_IMAGE(imageUrl: any) {
    this.userImageObs.next(imageUrl);
  }

  reset() {
    this.logInMethod = '';
    this.userId = '';
    this.userName = '';
    this.userNameProm = new ReplaySubject();
    this.location = new ReplaySubject();
    this.userImageObs = new ReplaySubject();
  }
}
