import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/messaging';
import 'firebase/auth';
import { environment } from '../../../../environments/environment';
import { ReplaySubject } from 'rxjs';
import { AccountService } from '../general/account/account.service';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private messaging: firebase.messaging.Messaging;
  private onMessage = new ReplaySubject();
  TOKEN;
  browserSupport = true;
  notificationAccepted = false;
  initAtLogin = false;

  chatSet = new Set();
  aPlayed = false;
  aPlayer;
  audio = new Audio();
  constructor(private accountService: AccountService) {

    this.audio.src = "../../../../assets/media/notification/notification.mp3";
    this.audio.load();
  }

  async initialize() {
    try {
      /**
     * check if browser is supported
     */
      if (firebase.messaging.isSupported()) {
        if (!this.messaging) {
          this.messaging = firebase.messaging();
          /**
          * setup public vapid key
          */
          this.messaging.usePublicVapidKey(environment.firebase.publicMessagingKey);
        }
      }
      else {
        this.browserSupport = false;
        return;
      }

      /**
       * bind new message handler
       */
      this.messaging.onMessage((payload) => {
        if (payload.data) {
          if (payload.data.data) {
            const data = JSON.parse(payload.data.data);
            /**
             * publish only chat related notifications
             */
            if (data.hasOwnProperty('chat')) {
              this.onMessage.next(data);
            }

          }
        } else {
          console.log(payload)
        }
      })

      navigator.serviceWorker.addEventListener('message', event => {
        if (document.hidden) {
          if (event && event.data && event.data.firebaseMessagingData && event.data.firebaseMessagingData.data && event.data.firebaseMessagingData.data.data) {
            const data = JSON.parse(event.data.firebaseMessagingData.data.data);
            if (data.hasOwnProperty('chat')) {
              this.onMessage.next(data);
            }
          }
        }
      });

      /**
       * update token on refresh
       */
      this.messaging.onTokenRefresh(() => {
        this.getToken();
      })

      /**
       * check for user permission
       */
      await this.checkPermissions();

      /**
       * fetch token for receiving messages
       */
      await this.getToken();
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * check for user permissions
   */
  private async checkPermissions() {
    try {
      await this.messaging.requestPermission();
      this.notificationAccepted = true;
    } catch (error) {
      this.notificationAccepted = false;
      throw error;
    }
  }

  private async getToken() {
    try {
      const TOKEN = await this.messaging.getToken();
      if (TOKEN) {
        this.TOKEN = TOKEN;
        if (this.TOKEN != localStorage.getItem('pushNotificationToken')) {
          if (localStorage.getItem('pushNotificationToken')) {
            console.log('Different push notification token or o, deleting old setting new');
          }
          else {
            console.log('Login setting up new Token');
          }

          console.log(localStorage.getItem('pushNotificationToken'));
          await this.checkLocalToken();
          await this.sendTokenToServer(TOKEN);
        }
        else if (firebase.auth().currentUser.email != localStorage.getItem('email')) {
          console.log('Different email, deleting token for old user and setting for new')
          await this.checkLocalToken();
          await this.sendTokenToServer(TOKEN);
        }
        localStorage.setItem('email', firebase.auth().currentUser.email);
        localStorage.setItem('pushNotificationToken', this.TOKEN);
      }
      else {
        throw new Error('No Instance ID token available. Request permission to generate one.');
      }
    } catch (error) {
      throw error;
    }
  }

  private async sendTokenToServer(TOKEN) {
    try {
      console.log('TOken To serve for push : ' + TOKEN);
      const request = await this.accountService.setTokenForPushNotification(TOKEN);
      await request.toPromise();
    } catch (error) {
      throw error;
    }
  }

  get Message() {
    return this.onMessage.asObservable();
  }

  playSound() {
    if (!document.hidden) {
      if (this.aPlayed) {
        clearTimeout(this.aPlayer);
      }
      this.aPlayer = setTimeout(_ => this.audio.play(), 300);
    }
  }

  async checkLocalToken() {
    if (localStorage.getItem('pushNotificationToken')) {
      await this.deleteToken();
    }
  }

  async deleteToken() {
    try {
      console.log('Deleting Old TOKEN : ' + localStorage.getItem('pushNotificationToken'));
      this.reInitializeMessageObs();
      const response = await this.accountService.deleteTokenForPushNotification(localStorage.getItem('pushNotificationToken')).toPromise();
      localStorage.removeItem('pushNotificationToken');
    } catch (error) {
      console.log(error);
    }
  }

  loginInit() {
    this.initialize();
    this.initAtLogin = true;
    console.log('Initialized push Notification via login')
  }

  reInitializeMessageObs() {
    this.onMessage = new ReplaySubject();
  }
}
