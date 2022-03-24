import { Component, OnInit, Output, EventEmitter, Input, ChangeDetectorRef } from '@angular/core';
import { DefaultMeetingSession } from 'amazon-chime-sdk-js';
import { ConferenceService } from '../../../../../core/services/general/meeting/conference.service';
import { FirebaseUtility } from '../../../../../core/services/firebase/firebase.service';
import { EquipmentStatus } from '../../../../../core/model/meeting/equipmentStatus.model';
import { firebaseMeetingWaitingMetaData, fStoreParticipant, JoinStatus } from '../../../../../core/model/meeting/meeting.model';
import { Subscription } from 'rxjs';
import { participation } from '../../../../../core/model/meeting/participation.model';
import { AwsAttendeeDetails } from '../../../../../core/model/meeting/conference.model';
import { TranslateService } from '@ngx-translate/core';

declare var ActiveXObject: any;

@Component({
  selector: 'kt-conference-control-panel',
  templateUrl: './conference-control-panel.component.html',
  styleUrls: ['./conference-control-panel.component.scss']
})
export class ConferenceControlPanelComponent implements OnInit {
  @Input() amIWaiting = true;
  @Input() set _meetingSession(session: DefaultMeetingSession) {
    if (session) {
      this.meetingSession = session;
    }
  }
  @Input() screenSharing = false;

  @Output() $leaveSession = new EventEmitter<any>();
  @Output() $openChat = new EventEmitter<any>();
  @Output() $closeChat = new EventEmitter<any>();
  @Output() $deviceError = new EventEmitter<string>();

  meetingSession: DefaultMeetingSession;

  // audio video devices
  audioInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  videoInputDevices: MediaDeviceInfo[];

  // audio controls
  muted = true;
  audioElem = new Audio();

  // video controls
  noLocalVideo = true;

  // content sharing controls
  localUserSharingContent = false;
  screenBeingShared = false;

  // chat controls
  chatOpen = false;


  fStoreSubscription: Subscription;

  participantsListOpened = false;

  myFstoreStatus: fStoreParticipant = {
    AttendeeId: undefined,
    audio_in_counselor: EquipmentStatus.ON,
    audio_in_participant: EquipmentStatus.ON,
    audio_out_counselor: EquipmentStatus.ON,
    audio_out_participant: this.conference.audio ? EquipmentStatus.ON : EquipmentStatus.OFF,
    client: 20,
    image_url: '',
    name: '',
    participation: participation.UNDEFINED,
    room_status: JoinStatus.WAITING,
    screen_counselor: EquipmentStatus.ON,
    screen_participant: EquipmentStatus.ON,
    user_id: '',
    video_in_counselor: EquipmentStatus.ON,
    video_in_participant: EquipmentStatus.ON,
    video_out_counselor: EquipmentStatus.ON,
    video_out_participant: this.conference.video ? EquipmentStatus.ON : EquipmentStatus.OFF
  }
  EquipmentStatus = EquipmentStatus;
  fullScreen = false;

  guest = false;
  audioPermission = true;
  videoPermission = true;

  constructor(
    private conference: ConferenceService,
    private cdr: ChangeDetectorRef,
    private firebaseUtility: FirebaseUtility,
    public translateService: TranslateService
  ) { }

  ngOnInit() {
    this.guest = this.conference.guest;
    this.myFstoreStatus.AttendeeId = (this.conference.metaData.meeting.participant.access.aws_attendee_details as AwsAttendeeDetails).AttendeeId;
    this.myFstoreStatus.name = this.conference.metaData.meeting.participant.access.name || this.conference.metaData.meeting.participant.name;
    this.myFstoreStatus.image_url = this.conference.metaData.meeting.participant.image_url || '';
  }

  // async getAVDevices() {
  //   try {
  //     /**
  //      * get a list of
  //      * microphones
  //      * speakers
  //      * cameras
  //      */
  //     this.audioInputDevices = await this.meetingSession.audioVideo.listAudioInputDevices();
  //     this.audioOutputDevices = await this.meetingSession.audioVideo.listAudioOutputDevices();
  //     this.videoInputDevices = await this.meetingSession.audioVideo.listVideoInputDevices();
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  async initializeAudio() {
    try {
      /**
       * bind audio element
       */
      this.meetingSession.audioVideo.bindAudioElement(this.audioElem);
      let mics = (await this.meetingSession.audioVideo.listAudioInputDevices());
      if( !mics.length ){
        this.$deviceError.emit(this.translateService.instant('MEETING.conference.controlPanel.noMicrophone'));
        return;
      }

      let microphone = mics[0];
      await this.meetingSession.audioVideo.chooseAudioInputDevice(microphone.deviceId);

      // if( this.audioPermission == -1 ){
      //   this.audioPermission = audioPermission
      // }

      // if( this.audioPermission == DevicePermission.PermissionDeniedByBrowser ){
      //   this.$deviceError.emit(this.translateService.instant('MEETING.conference.controlPanel.browserAudioPermission'));
      //   return;
      // }

      // if( this.audioPermission ==  DevicePermission.PermissionDeniedByUser ){
      //   this.$deviceError.emit(this.translateService.instant('MEETING.conference.controlPanel.audioPermission'));
      //   return;
      // }

      this.meetingSession.audioVideo.realtimeMuteLocalAudio();
      if( this.conference.audio ){
        this.startAudio();
      }
    } catch (error) {
      this.audioPermission = false;
      this.$deviceError.emit(this.translateService.instant('MEETING.conference.controlPanel.audioPermission'));
      this.cdr.detectChanges();
      console.log(error);
    }
  }

  async startAudio() {
    try {
      if (this.myFstoreStatus.audio_out_counselor == EquipmentStatus.OFF) {
        alert(this.translateService.instant('MEETING.conference.controlPanel.counselorMicPermission'));
        return;
      }

      if( this.audioPermission == false ){
        this.$deviceError.emit(this.translateService.instant('MEETING.conference.controlPanel.audioPermission'));
        return;
      }
      this.muted = false;

      let mics = (await this.meetingSession.audioVideo.listAudioInputDevices());
      if( !mics.length ){
        this.$deviceError.emit(this.translateService.instant('MEETING.conference.controlPanel.noMicrophone'));
        this.muted = true;
        this.cdr.detectChanges();
        return;
      }

      let microphone = mics[0];
      await this.meetingSession.audioVideo.chooseAudioInputDevice(microphone.deviceId);

      // if( this.audioPermission == -1 ){
      //   this.audioPermission = audioPermission;
      // }

      // if( this.audioPermission == DevicePermission.PermissionDeniedByBrowser ){
      //   this.$deviceError.emit(this.translateService.instant('MEETING.conference.controlPanel.browserAudioPermission'));
      //   this.muted = true;
      //   this.cdr.detectChanges();
      //   return;
      // }

      // if( this.audioPermission ==  DevicePermission.PermissionDeniedByUser ){
      //   this.$deviceError.emit(this.translateService.instant('MEETING.conference.controlPanel.audioPermission'));
      //   this.muted = true;
      //   this.cdr.detectChanges();
      //   return;
      // }

      this.meetingSession.audioVideo.realtimeUnmuteLocalAudio();
      this.cdr.detectChanges();
      await this.fStoreUpdateAudio(EquipmentStatus.ON);
    } catch (error) {
      this.audioPermission = false;
      this.$deviceError.emit(this.translateService.instant('MEETING.conference.controlPanel.audioPermission'));
      this.muted = true;
      this.cdr.detectChanges();
      console.log(error);
    }
  }

  async stopAudio() {
    try {
      this.muted = true;
      this.meetingSession.audioVideo.realtimeMuteLocalAudio();
      this.cdr.detectChanges();
      await this.fStoreUpdateAudio(EquipmentStatus.OFF);
    } catch (error) {
      this.muted = false;
      throw error;
    }
  }

  async initializeVideo() {
    try {
      /**
       * start local video if user has selected video while joining
       */
      if (this.conference.video) {
        this.startLocalVideo();
      }

    } catch (error) {
      throw error;
    }
  }

  async startLocalVideo() {
    try {
      if (this.myFstoreStatus.video_out_counselor == EquipmentStatus.OFF) {
        alert(this.translateService.instant('MEETING.conference.controlPanel.counselorCameraPermission'));
        return;
      }

      this.noLocalVideo = false;
      
      const cameras = await this.meetingSession.audioVideo.listVideoInputDevices();

      if( !cameras.length ){
        this.$deviceError.emit(this.translateService.instant('MEETING.conference.controlPanel.noWebCam'));
        this.noLocalVideo = true;
        this.cdr.detectChanges();
        return;
      }

      const camera = cameras[0];
      await this.meetingSession.audioVideo.chooseVideoInputDevice(camera.deviceId);

      // if( this.videoPermission == -1 ){
      //   this.videoPermission = videoPermission;
      // }

      // if( this.videoPermission == DevicePermission.PermissionDeniedByBrowser ){
      //   this.$deviceError.emit(this.translateService.instant('MEETING.conference.controlPanel.browserCamPermission'));
      //   this.noLocalVideo = true;
      //   this.cdr.detectChanges();
      //   return;
      // }

      // if( this.videoPermission ==  DevicePermission.PermissionDeniedByUser ){
      //   this.$deviceError.emit(this.translateService.instant('MEETING.conference.controlPanel.camPermission'));
      //   this.noLocalVideo = true;
      //   this.cdr.detectChanges();
      //   return;
      // }
      this.meetingSession.audioVideo.startLocalVideoTile();
      this.cdr.detectChanges();
      await this.fStoreUpdateVideo(EquipmentStatus.ON);
    } catch (error) {
      this.$deviceError.emit(this.translateService.instant('MEETING.conference.controlPanel.camPermission'));
      this.noLocalVideo = true;
      this.cdr.detectChanges();
      throw error;
    }

  }

  async stopLocalVideo() {
    try {
      /**
       * remove camera
       */
      this.noLocalVideo = true;
      await this.meetingSession.audioVideo.chooseVideoInputDevice(null);
      this.meetingSession.audioVideo.stopLocalVideoTile();
      this.cdr.detectChanges();
      await this.fStoreUpdateVideo(EquipmentStatus.OFF);
    } catch (error) {
      this.noLocalVideo = false;
      throw error;
    }
  }

  async startScreenShare() {
    try {
      if (this.myFstoreStatus.screen_counselor == EquipmentStatus.OFF) {
        alert(this.translateService.instant('MEETING.conference.controlPanel.screenShareCounselor'));
        return;
      }
      if( this.fullScreen ){
        this.toggleFullScreen();
      }
      this.localUserSharingContent = true;
      await this.meetingSession.audioVideo.startContentShareFromScreenCapture();
      await this.fStoreUpdateScreen(EquipmentStatus.ON);
    } catch (error) {
      this.localUserSharingContent = false;
      console.error(error);
    }
    finally {
      this.cdr.detectChanges();
    }
  }

  async stopScreenShare() {
    try {
      this.localUserSharingContent = false;
      await this.meetingSession.audioVideo.stopContentShare();
      await this.fStoreUpdateScreen(EquipmentStatus.OFF);
    } catch (error) {
      console.error(error);
    }
  }

  async fStoreUpdateVideo(video: EquipmentStatus) {
    try {
      const meetingId = this.conference.metaData.meeting.meeting_id;
      const access_id = this.conference.metaData.meeting.participant.access.access_id;
      const toUpdate = {};
      toUpdate[`participants.${access_id}.video_out_participant`] = video;
      await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meetingId).update(toUpdate);
    } catch (error) {
      throw error;
    }
  }

  async fStoreUpdateAudio(status: EquipmentStatus) {
    try {
      const meetingId = this.conference.metaData.meeting.meeting_id;
      const access_id = this.conference.metaData.meeting.participant.access.access_id;
      const toUpdate = {};

      toUpdate[`participants.${access_id}.audio_out_participant`] = status;
      await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meetingId).update(toUpdate);
    } catch (error) {
      throw error;
    }
  }

  async fStoreUpdateScreen(screen: EquipmentStatus) {
    try {
      const meetingId = this.conference.metaData.meeting.meeting_id;
      const access_id = this.conference.metaData.meeting.participant.access.access_id;
      const toUpdate = {};
      toUpdate[`participants.${access_id}.screen_participant`] = screen;
      await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meetingId).update(toUpdate);
    } catch (error) {
      throw error;
    }
  }

  addFireStoreObservers(access_id) {
    if( this.fStoreSubscription ){
      this.fStoreSubscription.unsubscribe();
      this.fStoreSubscription = undefined;
    }
    this.fStoreSubscription = this.conference.$meetingObserver.subscribe(
      newInstance => {
        this.handelFireStoreUpdates(newInstance, access_id);
      },
      console.error
    )
  }

  async handelFireStoreUpdates(newInstance: firebaseMeetingWaitingMetaData, access_id: string) {
    try {
      if (!newInstance) {
        return;
      }

      if (newInstance.participants[access_id]) {
        this.myFstoreStatus = newInstance.participants[access_id];

        await this.checkAudioOut(newInstance, access_id);
        await this.checkVideoOut(newInstance, access_id);
        await this.checkScreen(newInstance, access_id);
        this.checkAudioInStatus(newInstance, access_id);
      }

      const participants = Object.keys(newInstance.participants);
      let screenFlag = true;
      for (const access_id of participants) {
        if (newInstance.participants[access_id].screen_participant == EquipmentStatus.ON) {
          this.screenBeingShared = true;
          screenFlag = false;
          this.cdr.detectChanges();
          break;
        }
      }

      if (screenFlag) {
        this.screenBeingShared = false;
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error(error);
    }
  }

  async checkScreen(newInstance: firebaseMeetingWaitingMetaData, access_id) {
    try {
      if (newInstance.participants[access_id].screen_counselor == EquipmentStatus.OFF) {
        await this.stopScreenShare();
      }
    } catch (error) {
      console.error(error);
    }
  }

  async checkVideoOut(newInstance: firebaseMeetingWaitingMetaData, access_id: string) {
    try {
      if (newInstance.participants[access_id].video_out_counselor == EquipmentStatus.OFF) {
        await this.stopLocalVideo();
      }
    } catch (error) {
      console.error(error);
    }
  }

  async checkAudioOut(newInstance: firebaseMeetingWaitingMetaData, access_id: string) {
    try {
      /**
      * if audio is set to COUNSELOR_OFF or
      * PARTICIPANT_OFF then stop audio
      */
      if (newInstance.participants[access_id].audio_out_counselor == EquipmentStatus.OFF) {
        if (this.meetingSession) {
          await this.stopAudio();
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  checkAudioInStatus(newInstance: firebaseMeetingWaitingMetaData, access_id: string) {
    /**
     * check if audio in in stopped by counselor
     */
    if (newInstance.participants[access_id].audio_in_counselor == EquipmentStatus.OFF) {
      if (this.meetingSession) {
        this.meetingSession.audioVideo.unbindAudioElement();
      }
    }
    else if (newInstance.participants[access_id].audio_in_counselor != EquipmentStatus.OFF && newInstance.participants[access_id].audio_in_participant != EquipmentStatus.OFF) {
      if (this.meetingSession) {
        this.meetingSession.audioVideo.bindAudioElement(this.audioElem);
      }
    }
  }


  leaveSession() {
    this.$leaveSession.emit();
  }

  openChat() {
    this.chatOpen = true;
    this.$openChat.emit();

    // close others
    this.participantsListOpened = false;
  }

  closeChat() {
    this.chatOpen = false;
    this.$closeChat.emit();
  }

  async startAudioIn() {
    try {
      if (this.myFstoreStatus.audio_in_counselor == EquipmentStatus.OFF) {
        alert(this.translateService.instant('MEETING.conference.controlPanel.audioInCounselor'));
        return;
      }
      this.meetingSession.audioVideo.bindAudioElement(this.audioElem);
      const meeting_id = this.conference.metaData.meeting.meeting_id;
      const toUpdate = {};
      toUpdate[`participants.${this.conference.metaData.meeting.participant.access.access_id}.audio_in_participant`] = EquipmentStatus.ON;
      await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meeting_id).update(toUpdate);
    } catch (error) {
      console.error(error);
    }
  }

  async stopAudioIn() {
    try {
      this.meetingSession.audioVideo.unbindAudioElement();
      const meeting_id = this.conference.metaData.meeting.meeting_id;
      const toUpdate = {};
      toUpdate[`participants.${this.conference.metaData.meeting.participant.access.access_id}.audio_in_participant`] = EquipmentStatus.OFF;
      await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meeting_id).update(toUpdate);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * request full screen
   */
  async requestFullScreen() {
    try {
      const element = document.body as any;
      var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

      if (requestMethod) {
        await requestMethod.call(element)
      } else if (typeof window['ActiveXObject'] !== "undefined") {
        var wScript = new ActiveXObject("WScript.Shell");
        if (wScript !== null) {
          wScript.SendKeys("{F11}");
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * cancel full screen
   */
  async cancelFullScreen() {
    try {
      const element = document as any;
      var requestMethod = element.exitFullscreen || element.cancelFullScreen || element.webkitCancelFullScreen || element.mozCancelFullScreen;
      if (requestMethod) {
        await requestMethod.call(element);
      } else if (typeof window[ActiveXObject] !== "undefined") {
        var wScript = new ActiveXObject("WScript.Shell");
        if (wScript !== null) {
          wScript.SendKeys("{F11}");
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  toggleFullScreen() {
    if (!this.fullScreen) {
      this.requestFullScreen();
    }
    else {
      this.cancelFullScreen();
    }
    this.fullScreen = !this.fullScreen;
  }

  isFullScreen() {
    return ((screen.availHeight || screen.height - 30) <= window.innerHeight);
  }

  async connectionLost(){
    try {
      const promises = [
        this.stopScreenShare(),
        this.stopAudio(),
        this.stopLocalVideo()
      ]
      await Promise.all(promises);
    } catch (error) {
      console.error(error);
    }
  }

  ngOnDestroy() {
    if (this.fStoreSubscription) {
      this.fStoreSubscription.unsubscribe();
    }

    if (this.fullScreen || this.isFullScreen()) {
      this.cancelFullScreen();
    }
  }
}
