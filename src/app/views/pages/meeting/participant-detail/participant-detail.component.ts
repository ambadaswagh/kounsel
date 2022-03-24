import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, NgZone, HostListener } from '@angular/core';
import { Participant, Access } from '../../../../core/model/meeting/meeting.model';
import { MeetingService } from '../../../../core/services/general/meeting/meeting.service';
import { ActionNotificationComponent } from '../../../partials/content/crud';
import moment from 'moment';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'kt-participant-detail',
  templateUrl: './participant-detail.component.html',
  styleUrls: ['./participant-detail.component.scss']
})
export class ParticipantDetailComponent implements OnInit {
  @Output() $back = new EventEmitter<any>();
  participant: Participant;
  access: Access;
  revokingAccess = false;
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    const elem = document.getElementById('participant-detail') as HTMLDivElement;
    elem.style.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)+'px';
  }
  
  constructor(
    public meeting: MeetingService,
    private _snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    public translateService: TranslateService
  ) { }

  ngOnInit() {
    const elem = document.getElementById('participant-detail') as HTMLDivElement;
    elem.style.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)+'px';

    switch (this.meeting.participantDetail.toDisplay) {
      case 'access':
        this.access = this.meeting.participantDetail.access;
        this.participant = undefined;
        break;
      case 'participant':
        this.participant = this.meeting.participantDetail.participant;
        this.access = undefined;
        break;
      default:
        break;
    }
  }

  ngOnViewInit(){
    const elem = document.getElementById('participant-detail') as HTMLDivElement;
    elem.style.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)+'px';
  }

  back() {
    this.$back.emit();
  }

  downloadDetails() {
    const data = `
    Room Id  :  ${this.access.room_id}
    Code  :  ${this.access.access_code}
    URL  :  ${this.translateService.instant('MEETING.participantDetails.meetingLink')} `;
    this.copyMessage(data);
  }

  copyMessage(val: string) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.openSnackBar(this.translateService.instant('MEETING.participantDetails.detailsCopied'), { success: true });
  }

  revokeData() {
    this.revokingAccess = true;
    const accessId = this.access ? this.access.access_id : this.participant.access_id;
    this.meeting.revokeMeetingAccess(accessId).subscribe(
      response => {
        if (response.code == 200 || response.code == 201) {
          this.openSnackBar(this.translateService.instant('MEETING.participantDetails.accessRevoked'), { success: true });
          this.revokingAccess = false;
          this.$back.emit(accessId);
        }
        else {
          this.revokingAccess = false;
          this.openSnackBar(this.translateService.instant('COMMON.error'), { error: true });
          this.cdr.detectChanges();
        }
      },
      err => {
        this.openSnackBar(this.translateService.instant('COMMON.error'), { error: true });
        console.error(err);
        this.revokingAccess = false;
      }
    )
  }

  openSnackBar(text, meta) {
    this.zone.run(() => {
      this._snackBar.openFromComponent(ActionNotificationComponent, {
        data: {
          message: text, ...meta
        },
        duration: 20000,
        horizontalPosition: 'right',
        panelClass: 'customSnackBarBackground'
      })
    })
  }

  formatAmount(num: any) {
    if (!num) return undefined
    return (Math.round(num * 100) / 100).toFixed(2);
  }

  toWords(duration) {
    return moment.utc(duration).format("HH [hrs]  mm [mins]")
  }
}
