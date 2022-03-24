import { Component, OnInit, ChangeDetectorRef, ViewChild, NgZone } from '@angular/core';
import { Location } from '@angular/common';
import { ConferenceService } from '../../../../../core/services/general/meeting/conference.service';
import { AwsMeetingDetails, AwsAttendeeDetails, ConferenceMetaData } from '../../../../../core/model/meeting/conference.model';
import {
  ConsoleLogger,
  DefaultDeviceController,
  DefaultMeetingSession,
  LogLevel,
  MeetingSessionConfiguration,
  AudioVideoObserver,
  MeetingSessionStatus,
  MeetingSessionStatusCode
} from 'amazon-chime-sdk-js';
import { Router } from '@angular/router';
import { GridComponent } from '../grid/grid.component';
import { ConferenceControlPanelComponent } from '../conference-control-panel/conference-control-panel.component';
import { MatSnackBar } from '@angular/material';
import { ActionNotificationComponent } from '../../../../partials/content/crud';
import { FirebaseUtility } from '../../../../../core/services/firebase/firebase.service';
import { firebaseMeetingWaitingMetaData, JoinStatus, fStoreParticipant } from '../../../../../core/model/meeting/meeting.model';
import { RestBoolean } from '../../../../../core/model/restBoolean.model';
import { has, pick } from 'lodash';
import { Subscription } from 'rxjs';
import { WaitingListComponent } from '../waiting-list/waiting-list.component';
import { participation } from '../../../../../core/model/meeting/participation.model'
import { EquipmentStatus } from '../../../../../core/model/meeting/equipmentStatus.model'
import { ParticipantType } from '../../../../../core/model/meeting/Participant.model';
import { BillingType } from '../../../../../core/model/meeting/billing.model';
import { PaymentStatus } from '../../../../../core/model/paymentStatus.model';
import { MeetingService } from '../../../../../core/services/general/meeting/meeting.service';
import { ConnectionService } from 'ng-connection-service'
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

declare var $: any;

enum SideBarType {
  overlay,
  embed
}
@Component({
  selector: 'kt-conference-home',
  templateUrl: './conference-home.component.html',
  styleUrls: ['./conference-home.component.scss']
})
export class ConferenceHomeComponent implements OnInit {
  @ViewChild('gridElem') gridComp: GridComponent;
  @ViewChild('controlPanel') controlPanel: ConferenceControlPanelComponent;
  @ViewChild('waitingList') waitingList: WaitingListComponent;

  // chime vars
  logger: ConsoleLogger;
  deviceController: DefaultDeviceController;
  meetingMeta: AwsMeetingDetails;
  attendeeMeta: AwsAttendeeDetails;
  configuration: MeetingSessionConfiguration;
  meetingSession: DefaultMeetingSession;

  // waiting list
  showWaitingList = false;

  // my waiting status
  amIWaiting = true;
  sessionStarted = false;

  // fStore subscription
  fStoreSubscription: Subscription;

  // sideBar controls
  SideBarType = SideBarType;
  sideBarDisplayType = SideBarType.overlay;
  sideBarOpened = false;
  sideBarMenu = {
    chat: false,
    participant: false
  }

  guest = false;
  isClient = false;
  isPaymentValidating = false;
  paymentForClient: any;
  paymentVerifiedForClient: number = 20;
  // isNameUpdate = false;
  currName = '';
  activeParticipantCount = 1;
  participantBalanceWhileAwsStart = 0;

  /**
   * counselor was in meeting
   */
  counselorJoined = false;
  isConnected = true;
  retry = false;

  // name and payment
  nameOpen = false;
  paymentOpen = false;
  sessionStartTime = 0;

  // max participants
  maxParticipants = 1;
  // screen share
  screenSharing = false;

  // os info
  osInfo = {
    os: '-',
    osVersion: '-',
  };

  constructor(
    private conference: ConferenceService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private _snackBar: MatSnackBar,
    private firebaseUtility: FirebaseUtility,
    private location: Location,
    private meetingService: MeetingService,
    private zone: NgZone,
    private connectionService: ConnectionService,
    public translateService: TranslateService
  ) { }

  ngOnInit() {

    this.getOS();

    this.connectionService.monitor().subscribe(isConnected => {
      this.isConnected = isConnected;
    })

    if (!this.conference.metaData) {
      this.router.navigate(['meeting']);
    }
    this.guest = this.conference.guest;
    this.location.go('/meeting/conference');
  }

  ngAfterViewInit() {
    this.init();
  }

  init() {
    if (!this.conference.metaData) {
      return;
    }

    if (this.retry) {
      this.meetingSession.audioVideo.chooseAudioInputDevice(null);
      this.meetingSession.audioVideo.chooseVideoInputDevice(null);
      this.meetingSession.audioVideo.stopContentShare();
      this.meetingSession.audioVideo.removeObserver(this.closeObserver);
      this.meetingSession = undefined;
      this.initFirebase();
      return;
    }

    const userType = this.conference.metaData.meeting.participant.access.client;
    if (userType == ParticipantType.CLIENT) {
      this.openAddNameModal();
    }
    else if (userType == ParticipantType.GUEST) {
      this.openAddNameModal();
    }
    else {
      this.initFirebase();
    }
  }

  openAddNameModal() {
    if (this.conference.metaData.meeting.participant.access.name) {
      this.onAddNameClose(this.conference.metaData.meeting.participant.access.name);
      return;
    }

    this.nameOpen = true;

    this.currName = this.conference.metaData.meeting.participant.name || '';
    this.cdr.detectChanges();
    $('#addNameModal').modal({
      backdrop: 'static',
      keyboard: false
    })
    $("#addNameModal").modal('show');
  }

  closeAddNameModal() {
    this.nameOpen = false;
    $("#addNameModal").modal('hide');
  }

  onAddNameClose(name) {
    this.conference.metaData.meeting.participant.name = name;
    this.closeAddNameModal();
    const userType = this.conference.metaData.meeting.participant.access.client;
    if (userType == ParticipantType.CLIENT) {
      this.initiatePaymentValidation();
    }
    else {
      this.initFirebase();
    }
  }


  initiatePaymentValidation() {
    this.paymentForClient = this.conference.metaData.payment;
    this.paymentVerifiedForClient = this.conference.metaData.meeting.participant.payment_method_verified;
    this.isClient = true;
    if (
      has(this.conference.metaData, 'payment') &&
      has(this.conference.metaData.payment, 'billing_type') &&
      this.conference.metaData.payment.billing_type == BillingType.FIXED &&
      has(this.conference.metaData.payment, 'payment_status') &&
      this.conference.metaData.payment.payment_status == PaymentStatus.POSTED
    ) {
      this.initFirebase();
    }
    else {
      this.isPaymentValidating = true;
      this.openPaymentValidation();
    }
  }

  openPaymentValidation() {
    this.paymentOpen = true;
    $('#paymentModal').modal({
      backdrop: 'static',
      keyboard: false
    })
    $("#paymentModal").modal('show');
  }

  closePaymentValidation() {
    this.paymentOpen = false;
    this.isPaymentValidating = false;
    $("#paymentModal").modal('hide');
  }

  onPaymentValidationClose(ev: boolean) {
    if (ev) {
      this.paymentValidationSuccess();
    }
    else {
      this.paymentValidationFailed();
    }
  }

  paymentValidationSuccess() {
    this.closePaymentValidation();
    this.initFirebase();
  }

  paymentValidationFailed() {
    this.leaveSession();
    this.openSnackBar(this.translateService.instant('MEETING.conference.conferenceHome.meetingCanceled'), { error: true });
  }

  async initConference() {
    try {
      /**
       * setup logger
       */
      this.logger = new ConsoleLogger('Kounsel Conference', LogLevel.ERROR);
      this.deviceController = new DefaultDeviceController(this.logger);

      /**
       * get meeting and attendee object from service
       */
      this.meetingMeta = this.conference.metaData.meeting.aws_meeting_details as AwsMeetingDetails;
      this.attendeeMeta = this.conference.metaData.meeting.participant.access.aws_attendee_details as AwsAttendeeDetails;

      /**
       * create meeting config
       */
      this.configuration = new MeetingSessionConfiguration(this.meetingMeta, this.attendeeMeta);
      this.configuration.enableUnifiedPlanForChromiumBasedBrowsers = true;
      this.configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers = true;

      /**
       * create meeting session
       */
      this.createMeetingSession();
      this.cdr.detectChanges();

      /**
       * fetch media devices list
       */
      // await this.controlPanel.getAVDevices();

      /**
       * initialize av
       */
      await this.controlPanel.initializeAudio();
      await this.controlPanel.initializeVideo();

      /**
       * bind event listener to meeting
       */
      this.gridComp.setAudioVideoObserver();
      this.gridComp.setAttendeeObserver();
      this.gridComp.setContentShareObserver();
      this.meetingSession.audioVideo.addObserver(this.closeObserver);

      this.meetingSession.audioVideo.start();

      this.subscribeToRealTimeMessage();
      this.conference.chatSession = this.meetingSession;

    } catch (error) {
      console.error(error);
      this.router.navigate(['meeting']);
    }
  }

  sendMeetingInitMessage(){
    if (this.conference.metaData.meeting.participant.counselor == RestBoolean.TRUE) {
      this.conference.addGroupChatMessage('meeting started');
    }
  }

  subscribeToRealTimeMessage(){
    this.meetingSession.audioVideo.realtimeSubscribeToReceiveDataMessage('chat', (data)=>{
      this.conference.newChatReceived(data);
    })
  }

  closeObserver: AudioVideoObserver = {
    audioVideoDidStop: (sessionStatus: MeetingSessionStatus) => {
      const code = sessionStatus.statusCode();
      switch (code) {
        case MeetingSessionStatusCode.Left:
          return;
        case MeetingSessionStatusCode.ConnectionHealthReconnect:
          this.reconnecting();
          return;
        case MeetingSessionStatusCode.TURNCredentialsForbidden:
          this.openSnackBar(this.translateService.instant('MEETING.conference.conferenceHome.accessExpired'), { error: true });
          break;
        case MeetingSessionStatusCode.AudioCallAtCapacity:
          this.openSnackBar(this.translateService.instant('MEETING.conference.conferenceHome.meetingFull'), { error: true });
          break;
        case MeetingSessionStatusCode.AudioDeviceSwitched:
          this.openSnackBar(this.formatDuration(this.translateService.instant('MEETING.conference.conferenceHome.audioDeviceSwitched')), { error: true });
          break;
        case MeetingSessionStatusCode.TURNMeetingEnded:
        case MeetingSessionStatusCode.AudioCallEnded:
        case MeetingSessionStatusCode.MeetingEnded: {
          if (!this.sessionStarted) {
            this.retryForWaiting();
            return;
          }
          else {
            this.openSnackBar(this.formatDuration(this.translateService.instant('MEETING.conference.conferenceHome.meetingEnded')), { error: true });
          }
        }
        case MeetingSessionStatusCode.AudioJoinedFromAnotherDevice:
          this.openSnackBar(this.formatDuration(this.translateService.instant('MEETING.conference.conferenceHome.audioDeviceSwitched')), { error: true });
          break;
        default:
          this.openSnackBar(this.formatDuration(this.translateService.instant('COMMON.error')), { error: true });
          break;
      }
      this.leaveSession();
    }
  }

  setMeta(response) {
    const confMetaData: ConferenceMetaData = response.data;

    if (confMetaData.join != RestBoolean.TRUE) {
      this.openSnackBar(this.translateService.instant('MEETING.conference.conferenceHome.noAccess'), { error: true });
      this.leaveSession();
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

    this.init();
  }

  retryForWaiting() {
    if (!this.retry) {
      this.retry = true;
      let url = 'meeting/join';
      if (this.conference.metaData.meeting.participant.access.client == ParticipantType.GUEST) {
        url = 'public/meeting/join';
      }
      this.meetingService.fetchMetaDataSecure(url, {
        meeting: {
          access_id: this.conference.metaData.meeting.participant.access.access_id
        }
      }).subscribe(
        (response) => {
          if (response.code == 200) {
            this.setMeta(response);
          }
          else {
            this.openSnackBar(this.formatDuration(this.translateService.instant('MEETING.conference.conferenceHome.meetingEnded')), { error: true });
            this.leaveSession();
          }

        },
        err => {
          this.openSnackBar(this.formatDuration(this.translateService.instant('MEETING.conference.conferenceHome.meetingEnded')), { error: true });
          this.leaveSession();
        }
      )
    }
    else {
      this.openSnackBar(this.formatDuration(this.translateService.instant('MEETING.conference.conferenceHome.meetingEnded')), { error: true });
      this.leaveSession();
    }

  }

  createMeetingSession() {
    this.meetingSession = new DefaultMeetingSession(this.configuration, this.logger, this.deviceController);
  }

  async leaveSession() {
    try {
      await this.closeFlow();
    } catch (error) {
      console.error(error);
    }
    finally {
      this.router.navigate(['meeting']);
    }
  }

  reconnecting() {
    // TODO: logic to handel network related reconnect
    console.log('reconnecting from home');
  }

  openSnackBarTop(text, meta, duration = undefined) {
    this.zone.run(() => {
      this._snackBar.openFromComponent(ActionNotificationComponent, {
        data: {
          message: text, ...meta
        },
        duration: duration || 20000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: 'customSnackBarBackground'
      })
    })
  }

  openSnackBar(text, meta, duration = undefined) {
    this.zone.run(() => {
      this._snackBar.openFromComponent(ActionNotificationComponent, {
        data: {
          message: text, ...meta
        },
        duration: duration || 20000,
        horizontalPosition: 'right',
        verticalPosition: 'bottom',
        panelClass: 'customSnackBarBackground'
      })
    })
  }

  async createFireBaseMeetingObj() {
    try {
      /**
       * create local participant instance
       */
      const participants = {};

      /**
       * initialize firebase meeting participant object
       */
      const temp: fStoreParticipant = {
        image_url: this.conference.metaData.meeting.participant.image_url || '',
        name: this.conference.metaData.meeting.participant.name,
        client: this.conference.metaData.meeting.participant.access.client,
        room_status: JoinStatus.WAITING,
        participation: participation.UNDEFINED,
        user_id: this.conference.userId,
        audio_out_participant: this.conference.audio ? EquipmentStatus.ON : EquipmentStatus.OFF,
        audio_out_counselor: EquipmentStatus.ON,
        video_out_participant: this.conference.video ? EquipmentStatus.ON : EquipmentStatus.OFF,
        video_out_counselor: EquipmentStatus.ON,
        audio_in_participant: EquipmentStatus.ON,
        audio_in_counselor: EquipmentStatus.ON,
        video_in_participant: EquipmentStatus.ON,
        video_in_counselor: EquipmentStatus.ON,
        screen_participant: EquipmentStatus.UNDEFINED,
        screen_counselor: EquipmentStatus.ON,
        AttendeeId: (this.conference.metaData.meeting.participant.access.aws_attendee_details as AwsAttendeeDetails).AttendeeId,
        device: this.osInfo.os + " " + this.osInfo.osVersion
      }

      if (this.retry) {
        temp.room_status = JoinStatus.ACTIVE;
      }

      participants[this.conference.metaData.meeting.participant.access.access_id] = temp;

      /**
       * if current user is a consoler set room_status active
       */
      if (this.conference.metaData.meeting.participant.counselor == RestBoolean.TRUE) {
        participants[this.conference.metaData.meeting.participant.access.access_id].room_status = JoinStatus.ACTIVE;
        participants[this.conference.metaData.meeting.participant.access.access_id].participation = participation.ACTIVE;
      }

      /**
       * meeting instance for fireStore
       */
      const fireBaseMeetingObject: firebaseMeetingWaitingMetaData = {
        waiting_room_id: this.conference.metaData.meeting.waiting_room_id || '',
        topic_id: this.conference.metaData.meeting.topic_id || '',
        participants: participants
      }

      return fireBaseMeetingObject;
    } catch (error) {
      throw error;
    }
  }

  async initFirebase() {
    try {

      /**
       * get access id and meeting id
       */
      const access_id = this.conference.metaData.meeting.participant.access.access_id;
      const meetingId = this.conference.metaData.meeting.meeting_id;

      this.conference.startListeningToMeetingChanges();

      /**
       * if user is counselor
       */
      if (this.conference.metaData.meeting.participant.counselor == RestBoolean.TRUE) {
        this.showWaitingList = true;
        this.amIWaiting = false;
        this.initConference();
      }

      /**
       * create fireStore meeting instance data
       */
      const fireBaseMeetingObject = await this.createFireBaseMeetingObj();

      /**
       * try to get meeting instance from fireStore
       */
      const exists = await this.firebaseUtility.getDocument('/counseling/sessions/meeting/' + meetingId).toPromise();


      if (!exists) {
        /**
         * if meeting instance do not exist in fireStore create new instance
         */
        await this.addNewMeetingObjectToFirebase(meetingId, fireBaseMeetingObject);
      }
      else {
        /**
         * if meeting instance exists only this user to participants map
         */
        await this.updateFireBaseMeetingObject(meetingId, fireBaseMeetingObject.participants[access_id]);
      }

      const access = this.conference.metaData.meeting.participant.access.access_id;
      const participantType = this.conference.metaData.meeting.participant.access.client;
      const name = this.conference.metaData.meeting.participant.name;

      this.gridComp.addFireStoreObservers(access_id);
      this.controlPanel.addFireStoreObservers(access_id);
      this.addFireStoreObservers(access_id);

      if (this.conference.metaData.meeting.participant.counselor == RestBoolean.TRUE) {
        this.waitingList.addFireStoreObservers();
      }



      await this.meetingService.setName(name, access, participantType).toPromise();
    } catch (error) {
      console.error(error);
    }
  }

  async addNewMeetingObjectToFirebase(meetingId, fireBaseMeetingObject) {
    try {
      /**
       * push new meeting object to fireStore
       */
      await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meetingId).set(fireBaseMeetingObject);
    } catch (error) {
      throw error;
    }
  }

  async updateFireBaseMeetingObject(meetingId, participant) {
    try {
      /**
       * get access id
       */
      const access_id = this.conference.metaData.meeting.participant.access.access_id;

      /**
       * get document reference
       */
      const docRef = this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meetingId);

      /**
       * fetch current meeting instance
       */
      const currObj = await docRef.get().toPromise();
      const toRemove = currObj.data().participants[access_id];

      /**
       * current user is already present in fireStore meeting instance
       * preserve ['room_status', 'participation', 'audio', 'video', 'screen']
       */
      if (toRemove) {
        participant = { ...participant, ...pick(toRemove, ['room_status']) }
      }

      /**
       * overwrite room_status if user left and room_status became undefined
       */
      if (participant.room_status == JoinStatus.UNDEFINED) {
        if (this.conference.metaData.meeting.participant.counselor != RestBoolean.TRUE) {
          participant.room_status = JoinStatus.WAITING;
        }
        else {
          participant.room_status = JoinStatus.ACTIVE;
        }
      }

      /**
       * create update object with respective path according to access_id
       */
      const update = {};
      update[`participants.${access_id}`] = participant;

      /**
       * update 
       */
      await docRef.update(update);
    } catch (error) {
      throw error;
    }
  }



  async onSessionClose(meetingId, access_id) {
    try {

      // const exists = await this.firebaseUtility.getDocument('/counseling/sessions/meeting/' + meetingId).toPromise();

      // if (exists && has(exists.participants, access_id)) {
      const ref = this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meetingId);
      const toUpdate = {};
      toUpdate[`participants.${access_id}.room_status`] = JoinStatus.UNDEFINED;
      toUpdate[`participants.${access_id}.audio_out_participant`] = EquipmentStatus.UNDEFINED;
      toUpdate[`participants.${access_id}.audio_out_counselor`] = EquipmentStatus.UNDEFINED;

      toUpdate[`participants.${access_id}.video_out_participant`] = EquipmentStatus.UNDEFINED;
      toUpdate[`participants.${access_id}.video_out_counselor`] = EquipmentStatus.UNDEFINED;

      toUpdate[`participants.${access_id}.screen_participant`] = EquipmentStatus.UNDEFINED;
      toUpdate[`participants.${access_id}.screen_counselor`] = EquipmentStatus.UNDEFINED;

      toUpdate[`participants.${access_id}.audio_in_participant`] = EquipmentStatus.UNDEFINED;
      toUpdate[`participants.${access_id}.audio_in_counselor`] = EquipmentStatus.UNDEFINED;

      toUpdate[`participants.${access_id}.video_in_participant`] = EquipmentStatus.UNDEFINED;
      toUpdate[`participants.${access_id}.video_in_counselor`] = EquipmentStatus.UNDEFINED;
      // console.log(meetingId);
      // console.log(toUpdate)
      await ref.update(toUpdate);
      // }



      // /**
      //  * get current fireStore meeting instance
      //  */
      // const fireBaseMeetingObject = await this.firebaseUtility.getDocument('/counseling/sessions/meeting/' + meetingId).toPromise();

      // /**
      //  * if meeting instance exist
      //  */
      // if (fireBaseMeetingObject) {
      //   /**
      //    * get existing participants keys
      //    */
      //   const participantsKey = Object.keys(fireBaseMeetingObject.participants);

      //   /**
      //    * if this user is the only user remaining in meeting delete the meeting instance
      //    */
      //   if (participantsKey.length == 1) {
      //     await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meetingId).delete();
      //   }
      //   else if (participantsKey.length > 1) {
      //     /**
      //      * if there are more than 1 users in meeting only use this user from meeting instance
      //      */
      //     const toDelete = {};
      //     toDelete[`participants.${access_id}`] = fStore.FieldValue.delete();
      //     await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meetingId).update(toDelete);
      //   }
      // }
    } catch (error) {
      console.error(error);
    }
  }

  addFireStoreObservers(access_id) {
    /**
     * start listening to firebase meeting object changes
     */
    if (this.fStoreSubscription) {
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

  handelFireStoreUpdates(newInstance: firebaseMeetingWaitingMetaData, access_id) {
    try {
      if (!newInstance) return;
      if (newInstance.participants[access_id]) {

        switch (newInstance.participants[access_id].room_status) {
          case JoinStatus.ACTIVE:
            /**
             * if meeting status is set to active na user is in waiting room
             * close the chat and start aws meeting session
             */
            if (this.amIWaiting || this.retry) {

              if (this.sideBarMenu.chat) {
                this.controlPanel.closeChat();
              }

              this.amIWaiting = false;
              if (!this.meetingSession) {
                this.initConference();
              }
            }
            break;
          case JoinStatus.REJECTED:
            /**
             * is counselor removes or rejects user close the meeting session
             */
            this.openSnackBar(this.formatDuration(this.translateService.instant('MEETING.conference.conferenceHome.counselorRemoved')), { error: true });
            this.leaveSession();
        }

      }

      /**
       * only check this for a client and guest
       * check if counselor left the meeting
       */
      if (this.conference.metaData.meeting.participant.counselor != RestBoolean.TRUE) {
        for (let key in newInstance.participants) {
          if (key != 'undefined' && newInstance.participants[key] && newInstance.participants[key].client == ParticipantType.COUNSELOR) {
            if (newInstance.participants[key].room_status == JoinStatus.UNDEFINED && this.counselorJoined) {
              this.meetingEnded();
            }

            if (newInstance.participants[key].room_status == JoinStatus.ACTIVE) {
              this.counselorJoined = true;
            }
          }
        }
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error(error);
    }
  }

  triggerLocalMute() {
    this.controlPanel.stopAudio();
  }

  triggerTileResize() {
    this.cdr.detectChanges();
    this.gridComp.handelResize();
  }

  openSideBarFor(openFor: string) {
    /**
     * open sidebar menu
     */
    for (const key in this.sideBarMenu) {
      this.sideBarMenu[key] = key == openFor;
    }
    this.sideBarOpened = true;
    this.triggerTileResize();
  }

  closeSideBar(closeFor: string) {
    this.sideBarMenu[closeFor] = false;
    this.sideBarOpened = false;
    this.triggerTileResize();
  }

  contentSharingStopped() {
    this.controlPanel.stopScreenShare();
  }

  async triggerLocalUnmute() {
    try {
      this.controlPanel.startAudio();
    } catch (error) {
      console.error(error);
    }
  }

  async audioInStart() {
    try {
      await this.controlPanel.startAudioIn();
    } catch (error) {
      console.error(error);
    }
  }

  async audioInStop() {
    try {
      await this.controlPanel.stopAudioIn();
    } catch (error) {
      console.error(error);
    }
  }

  async videoOutStart() {
    try {
      await this.controlPanel.startLocalVideo();
    } catch (error) {
      console.error(error);
    }
  }

  async videoOutStop() {
    try {
      await this.controlPanel.stopLocalVideo();
    } catch (error) {
      console.error(error);
    }
  }

  async screenStart() {
    try {
      await this.controlPanel.startScreenShare();
    } catch (error) {
      console.error(error);
    }
  }

  async screenStop() {
    try {
      await this.controlPanel.stopScreenShare();
    } catch (error) {
      console.error(error);
    }
  }

  openExitWarningModal() {
    if (this.conference.metaData.meeting.participant.counselor != RestBoolean.TRUE) {
      this.openSnackBar(this.formatDuration(this.translateService.instant('MEETING.conference.conferenceHome.meetingEndSmall')), { success: true });
      this.leaveSession();
      return;
    }

    if (!(this.activeParticipantCount - 1) && !this.waitingList.waitingList.length && !this.participantBalanceWhileAwsStart) {
      if (this.maxParticipants > 1) {
        this.openSnackBar(this.formatDuration(this.translateService.instant('MEETING.conference.conferenceHome.meetingEndSmall')), { success: true });
      }
      else {
        this.openSnackBar(this.translateService.instant('MEETING.conference.conferenceHome.meetingEndSmall'), { success: true });
      }

      this.leaveSession();
      return;
    }

    $('#exitWarning').modal({
      backdrop: 'static',
      keyboard: false
    })
    $("#exitWarning").modal('show');
  }

  closeExitWarningModal() {
    $("#exitWarning").modal('hide');
  }

  meetingEnded() {
    this.leaveSession();
    this.openSnackBar(this.formatDuration(this.translateService.instant('MEETING.conference.conferenceHome.counselorLeft')), { error: true });
  }

  participantLeft(name: string) {
    if (this.conference.metaData.meeting.participant.counselor == RestBoolean.TRUE) {
      this.openSnackBar(name.substr(0, 25) + this.translateService.instant('MEETING.conference.conferenceHome.leftMeeting'), { success: true }, 2000);
    }
  }

  connectionLost() {
    this.controlPanel.connectionLost();
  }

  suggestVideoStop() {
    this.openSnackBar(this.translateService.instant('MEETING.conference.conferenceHome.weakConnection'), { info: true }, 5000);
  }

  connected() {
    this.sessionStarted = true;
    this.sessionStartTime = (new Date()).getTime();
    this.sendMeetingInitMessage();
    this.cdr.detectChanges();
  }

  deviceError(err) {
    this.openSnackBarTop(err, { error: true });
  }

  counselorDisconnected() {
    this.leaveSession();
    this.openSnackBar(this.formatDuration(this.translateService.instant('MEETING.conference.conferenceHome.meetingEndedConnectivityIssue')), { error: true });
  }

  formatDuration(message) {
    if (this.sessionStartTime > 0) {
      let start = moment(this.sessionStartTime);
      let end = moment((new Date()).getTime());
      let diff = end.diff(start);
      message += " (Duration: " + moment.utc(diff).format("HH:mm:ss") + ")";
    }
    return message;
  }

  setMaxParticipants(count) {
    this.maxParticipants = Math.max(count, this.maxParticipants);
  }

  getOS() {
    // https://stackoverflow.com/questions/9514179/how-to-find-the-operating-system-version-using-javascript
    /**
     * JavaScript Client Detection
     * viazenetti GmbH (Christian Ludwig)
     */
    const self = this;
    var unknown = '-';

    // browser
    var nVer = navigator.appVersion;
    var nAgt = navigator.userAgent;



    // mobile version
    var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

    // system
    var os = unknown;
    var clientStrings = [
      { s: 'Windows 10', r: /(Windows 10.0|Windows NT 10.0)/ },
      { s: 'Windows 8.1', r: /(Windows 8.1|Windows NT 6.3)/ },
      { s: 'Windows 8', r: /(Windows 8|Windows NT 6.2)/ },
      { s: 'Windows 7', r: /(Windows 7|Windows NT 6.1)/ },
      { s: 'Windows Vista', r: /Windows NT 6.0/ },
      { s: 'Windows Server 2003', r: /Windows NT 5.2/ },
      { s: 'Windows XP', r: /(Windows NT 5.1|Windows XP)/ },
      { s: 'Windows 2000', r: /(Windows NT 5.0|Windows 2000)/ },
      { s: 'Windows ME', r: /(Win 9x 4.90|Windows ME)/ },
      { s: 'Windows 98', r: /(Windows 98|Win98)/ },
      { s: 'Windows 95', r: /(Windows 95|Win95|Windows_95)/ },
      { s: 'Windows NT 4.0', r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/ },
      { s: 'Windows CE', r: /Windows CE/ },
      { s: 'Windows 3.11', r: /Win16/ },
      { s: 'Android', r: /Android/ },
      { s: 'Open BSD', r: /OpenBSD/ },
      { s: 'Sun OS', r: /SunOS/ },
      { s: 'Chrome OS', r: /CrOS/ },
      { s: 'Linux', r: /(Linux|X11(?!.*CrOS))/ },
      { s: 'iOS', r: /(iPhone|iPad|iPod)/ },
      { s: 'Mac OS X', r: /Mac OS X/ },
      { s: 'Mac OS', r: /(Mac OS|MacPPC|MacIntel|Mac_PowerPC|Macintosh)/ },
      { s: 'QNX', r: /QNX/ },
      { s: 'UNIX', r: /UNIX/ },
      { s: 'BeOS', r: /BeOS/ },
      { s: 'OS/2', r: /OS\/2/ },
      { s: 'Search Bot', r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/ }
    ];
    for (var id in clientStrings) {
      var cs = clientStrings[id];
      if (cs.r.test(nAgt)) {
        os = cs.s;
        break;
      }
    }

    var osVersion: any = unknown;

    if (/Windows/.test(os)) {
      osVersion = /Windows (.*)/.exec(os)[1];
      os = 'Windows';
    }

    switch (os) {
      case 'Mac OS':
      case 'Mac OS X':
      case 'Android':
        osVersion = /(?:Android|Mac OS|Mac OS X|MacPPC|MacIntel|Mac_PowerPC|Macintosh) ([\.\_\d]+)/.exec(nAgt)[1];
        break;

      case 'iOS':
        osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
        osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
        break;
    }

    self.osInfo = {
      os: os,
      osVersion: osVersion,
    };
    ;
  }

  async closeFlow() {
    try {
      if (this.isPaymentValidating) {
        this.closePaymentValidation();
      }
      this.closeAddNameModal();
      this.closeExitWarningModal();

      if (this.fStoreSubscription) {
        this.fStoreSubscription.unsubscribe();
      }

      if (this.conference.metaData && this.isConnected) {
        await this.onSessionClose(this.conference.metaData.meeting.meeting_id, this.conference.metaData.meeting.participant.access.access_id);
      }

      if (this.meetingSession) {
        this.meetingSession.audioVideo.chooseAudioInputDevice(null);
        this.meetingSession.audioVideo.chooseVideoInputDevice(null);
        this.meetingSession.audioVideo.stopContentShare();
        this.meetingSession.audioVideo.removeObserver(this.closeObserver);
        this.meetingSession.audioVideo.stop();
      }


      this.conference.cleanConference();
    } catch (error) {
      console.error(error)
    }
  }

  ngOnDestroy(){
    console.log("Tsting : here")
    this.conference.clearChatOnDestroy();
  }

}
