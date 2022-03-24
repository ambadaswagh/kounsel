import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { fromEvent } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { MeetingService } from '../../../../core/services/general/meeting/meeting.service';
import { Router } from '@angular/router';
import { ConferenceMetaData } from '../../../../core/model/meeting/conference.model';
import { ConferenceService } from '../../../../core/services/general/meeting/conference.service';
import { MatSnackBar, MatTooltip } from '@angular/material';
import { ActionNotificationComponent } from '../../../partials/content/crud';
import { RestBoolean } from '../../../../core/model/restBoolean.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'kt-join-meeting',
  templateUrl: './join-meeting.component.html',
  styleUrls: ['./join-meeting.component.scss']
})
export class JoinMeetingComponent implements OnInit {
  @ViewChild('audioTp') audioTp: MatTooltip;
  @ViewChild('videoTp') videoTp: MatTooltip;
  innerWidth = window.innerWidth;
  widthChange;
  sidebarOpened = false;
  joining = false;

  joinMeetingForm: FormGroup = new FormGroup({
    meetingId: new FormControl('', [Validators.required, Validators.pattern(/^.*\S+.*$/)]),
    code1: new FormControl('', [Validators.required]),
    code2: new FormControl('', [Validators.required]),
    code3: new FormControl('', [Validators.required]),
    code4: new FormControl('', [Validators.required]),
    code5: new FormControl('', [Validators.required]),
    code6: new FormControl('', [Validators.required]),
    audio: new FormControl(false, [Validators.required]),
    video: new FormControl(false, [Validators.required])
  })

  myRoom;
  RestBoolean = RestBoolean;
  audioDenied = false;
  videoDenied = false;

  constructor(
    private cdr: ChangeDetectorRef,
    public meeting: MeetingService,
    private router: Router,
    private conference: ConferenceService,
    private _snackBar: MatSnackBar,
    public translateService: TranslateService
  ) { }

  ngOnInit() {

    /**
     * capture resize event
     * throttle it for 300ms
     */
    this.widthChange = fromEvent(window, 'resize').pipe(throttleTime(300)).subscribe(
      ev => {
        this.innerWidth = window.innerWidth;
        this.cdr.detectChanges();
      }
    )

    /**
     * get personal room
     * details
     */
    this.fetchMyRoomDetails();

  }

  fetchMyRoomDetails() {

    /**
     * get personal room details
     */
    this.meeting.getMeeting().subscribe(
      response => {

        /**
         * if request is a success
         */
        if (response.code == 200 || response.code == 201) {

          /**
           * set meeting services data
           */
          this.meeting.counselor = response.data.counselor;
          this.meeting.personalRoomDetails = response.data.meeting;
          this.cdr.detectChanges();
        }
      },
      console.error
    )
  }

  handelEnter(event) {
    if (this.joinMeetingForm.valid) {
      this.submit();
    }
    event.preventDefault();
  }

  get Code() {

    /**
     * join individual inputs and get CODE
     */
    const code = this.joinMeetingForm.get('code1').value +
      this.joinMeetingForm.get('code2').value +
      this.joinMeetingForm.get('code3').value +
      this.joinMeetingForm.get('code4').value +
      this.joinMeetingForm.get('code5').value +
      this.joinMeetingForm.get('code6').value;
    return code;
  }

  async submit() {
    try {
      this.joining = true;
      this.cdr.detectChanges();

      /**
       * create query parameters for join
       */
      const queryParams = { room_id: this.joinMeetingForm.get('meetingId').value, access_code: this.Code };

      /**
       * join request
       */
      const response = await this.meeting.join({ meeting: queryParams }).toPromise();

      /**
       * if request successful
       */
      if (response.code == 200 || response.code == 201) {
        this.join(response);
      }
      else {
        if( response.error && response.error.code == 40117 ){
          this.openSnackBar(this.translateService.instant('MEETING.joinMeeting.accessRevoked'), { error: true });
        }
        else{
          throw new Error(this.translateService.instant('MEETING.joinMeeting.wrongCredentials'));
        }
      }

    } catch (error) {
      console.error(error);
      this.openSnackBar(this.translateService.instant('MEETING.joinMeeting.wrongCredentials'), { error: true });
    } finally {
      this.joining = false;
      this.cdr.detectChanges();
    }
  }

  join(response) {
    this.conference.cleanConference();
    const confMetaData: ConferenceMetaData = response.data;

    if (confMetaData.join != RestBoolean.TRUE) {
      this.openSnackBar(this.translateService.instant('MEETING.joinMeeting.noAccess'), { error: true });
      return;
    }

    /**
     * parse aws_meeting_details json strings
     */
    if (confMetaData.meeting.aws_meeting_details && typeof confMetaData.meeting.aws_meeting_details == 'string') {
      confMetaData.meeting.aws_meeting_details = JSON.parse(confMetaData.meeting.aws_meeting_details);
    }

    /**
     * parse aws_attendee_details json string
     */
    if (confMetaData.meeting.participant.access.aws_attendee_details && typeof confMetaData.meeting.participant.access.aws_attendee_details == 'string') {
      confMetaData.meeting.participant.access.aws_attendee_details = JSON.parse(confMetaData.meeting.participant.access.aws_attendee_details);
    }

    /**
     * set conference metadata in
     * conference service
     */
    this.conference.metaData = confMetaData;
    this.conference.audio = this.joinMeetingForm.get('audio').value;
    this.conference.video = this.joinMeetingForm.get('video').value;

    /**
     * navigate to conference
     */
    this.router.navigate(['meeting', 'conference']);
  }

  async enterMyRoom() {
    try {
      this.joining = true;
      this.cdr.detectChanges();

      /**
       * create query parameters for join
       */
      const queryParams = { room_id: this.meeting.personalRoomDetails.room_id };

      /**
       * join request
       */
      const response = await this.meeting.join({ meeting: queryParams }).toPromise();

      /**
       * if request successful
       */
      if (response.code == 200 || response.code == 201) {
        this.join(response);
      }
      else {
        throw new Error(this.translateService.instant('COMMON.error'))
      }

    } catch (error) {
      console.error(error);
      this.openSnackBar(this.translateService.instant('COMMON.error'), { error: true });
    } finally {
      this.joining = false;
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    /**
     * unsubscribe observables
     */
    if (this.widthChange) {
      this.widthChange.unsubscribe();
    }

    /**
     * clear all meeting service data
     */
    this.meeting.initParticipants();
  }

  closeSideBar() {
    this.sidebarOpened = false;
  }

  clearForm() {
    this.joinMeetingForm.patchValue({
      meetingId: '',
      code1: '',
      code2: '',
      code3: '',
      code4: '',
      code5: '',
      code6: '',
      audio: false,
      video: false
    })
  }

  audioChange() {
    if (this.joinMeetingForm.get('audio').value) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream)=>{
          stream.getTracks().forEach((track) => {
            track.stop();
          })
          this.audioDenied = false;
          this.cdr.detectChanges();
        })
        .catch((err)=>{
          setTimeout(()=>{
            this.joinMeetingForm.patchValue({ audio: false });
            this.audioTp.show();
            setTimeout(()=>{
              this.audioTp.hide();
            },5000)
            this.cdr.detectChanges();
          }, 200)
          this.audioDenied = true;
          this.cdr.detectChanges();
          console.log(err);
        });
    }
  }

  videoChange() {
    if (this.joinMeetingForm.get('video').value) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream)=>{
          stream.getTracks().forEach((track) => {
            track.stop();
          })
          this.videoDenied = false;
          this.cdr.detectChanges();
        })
        .catch((err)=>{
          setTimeout(()=>{
            this.joinMeetingForm.patchValue({ video: false });
            this.videoTp.show();
            setTimeout(()=>{
              this.videoTp.hide();
            },5000)
            this.cdr.detectChanges();
          }, 200)
          this.videoDenied = true;
          this.cdr.detectChanges();
          console.log(err);
        });
    }
  }

  check(_event, curr, next, prev) {
    const val = _event.target.value;
    if( !val ){
      if( prev ){
        prev.focus();
      }
    }

    if (/[0-9a-zA-Z]/.test(val[val.length - 1]) && typeof val[val.length - 1] == 'string') {
      let pVal = {};
      pVal[curr] = val[val.length - 1];
      this.joinMeetingForm.patchValue(pVal)
      if (next) {
        next.focus();
      }
    }
    else if (val && val.length == 2 && /[0-9a-zA-Z]/.test(val[val.length - 2])) {
      let pVal = {};
      pVal[curr] = val[val.length - 2];
      this.joinMeetingForm.patchValue(pVal);
    }
    else {
      let pVal = {};
      pVal[curr] = '';
      this.joinMeetingForm.patchValue(pVal)
    }
    this.cdr.detectChanges();
  }

  moveToEnd(inp) {
    setImmediate(() => {
      const len = inp.target.value.length;
      inp.target.setSelectionRange(len, len);
    })
  }

  openSnackBar(text, meta) {
    this._snackBar.openFromComponent(ActionNotificationComponent, {
      data: {
        message: text, ...meta
      },
      duration: 8000,
      horizontalPosition: 'right',
      panelClass: 'customSnackBarBackground'
    })
  }
}
