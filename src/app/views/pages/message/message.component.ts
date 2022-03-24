import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { PushNotificationService } from '../../../core/services/pushNotification/push-notification.service';
import { ActionNotificationComponent } from '../../partials/content/crud';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'kt-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {
  activeChat = '';
  newMessageFromMessageBox;
  constructor(public cdr: ChangeDetectorRef, private pushNotifications: PushNotificationService, private _snackBar: MatSnackBar) { }

  ngOnInit() {
    this.checkBrowser();
  }

  checkBrowser() {
    if (!this.pushNotifications.browserSupport) {
      this.openSnackBar('Real-time messaging is not compatible with this browser. You can continue using this browser without it or use  Chrome, Firefox or Edge(17+) for push message', { error: true });
    }
    else {
      setTimeout(() => {
        if (!this.pushNotifications.notificationAccepted) {
          this.openSnackBar("Your message notification is disabled. Please enable notification to receive instant messages from your client", { success: true });
        }
      }, 10000)
    }
  }

  openSnackBar(text, meta) {
    this._snackBar.openFromComponent(ActionNotificationComponent, {
      data: {
        message: text, ...meta
      },
      duration: 120000,
      verticalPosition: 'top',
      panelClass: 'customSnackBarBackground'
    })
  }


}
