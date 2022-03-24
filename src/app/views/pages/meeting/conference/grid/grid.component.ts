import { Component, OnInit, ChangeDetectorRef, Input, HostListener, Output, EventEmitter, NgZone } from '@angular/core';
import { DefaultMeetingSession, AudioVideoObserver, ContentShareObserver, VideoTileState, DefaultModality } from 'amazon-chime-sdk-js';
import { queueScheduler, Subscription, ReplaySubject } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { cloneDeep, has } from 'lodash';
import { RestBoolean } from '../../../../../core/model/restBoolean.model';
import { firebaseMeetingWaitingMetaData, fStoreParticipant } from '../../../../../core/model/meeting/meeting.model';
import { ConferenceService } from '../../../../../core/services/general/meeting/conference.service';
import { AwsAttendeeDetails } from '../../../../../core/model/meeting/conference.model';
import { EquipmentStatus } from '../../../../../core/model/meeting/equipmentStatus.model';
import { FirebaseUtility } from '../../../../../core/services/firebase/firebase.service';
import { ParticipantType } from '../../../../../core/model/meeting/Participant.model';

@Component({
  selector: 'kt-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss']
})
export class GridComponent implements OnInit {
  @Input() amIWaiting = true;
  @Input() paymentOpen = false;
  @Input() nameOpen = false;
  @Input() set _meetingSession(value: DefaultMeetingSession) {
    if (value) {
      this.meetingSession = value;
    }
  }

  @Output() $triggerLocalMute = new EventEmitter<any>();
  @Output() $triggerLocalUnmute = new EventEmitter<any>();
  @Output() $videoOutStart = new EventEmitter<any>();
  @Output() $videoOutStop = new EventEmitter<any>();
  @Output() $audioInStart = new EventEmitter<any>();
  @Output() $audioInStop = new EventEmitter<any>();
  @Output() $screenStart = new EventEmitter<any>();
  @Output() $screenStop = new EventEmitter<any>();
  @Output() $leaveMeeting = new EventEmitter<any>();
  @Output() $contentSharingStopped = new EventEmitter<any>();
  @Output() $meetingEnded = new EventEmitter<any>();
  @Output() $activeParticipantCount = new EventEmitter<any>();
  @Output() $fromActive = new EventEmitter<any>();
  @Output() $participantLeft = new EventEmitter<string>();
  @Output() $connectionLost = new EventEmitter<any>();
  @Output() $suggestVideoStop = new EventEmitter<any>();
  @Output() $connected = new EventEmitter<any>();
  @Output() $counselorDisconnected = new EventEmitter<any>();
  @Output() $screenShare = new EventEmitter<any>();

  primes: Set<number>;
  factors = {};
  minWidth = '100px';
  minHeight = '80px';

  meetingSession: DefaultMeetingSession;

  tileIdForUserSharingScreen = undefined;
  screenBeingShared = false;
  screenShareAttendeeId = '';

  // tile controls
  tiles: HTMLVideoElement[] = [];
  tileIds: any[] = [];
  tileIndexMap = {};
  tileVideoState = {};
  tileIdAttendeeIdMap = {};
  attendees = new Set();
  attendeeAVStatusMap: {
    [key: string]: fStoreParticipant
  } = {};

  /**
   * menu controls
   */
  contextMenu = {};
  attendeeIdAccessIdMap = {};

  // subscriptions
  // resizeSubs: Subscription;

  // fireStore subscription
  fStoreSubscription: Subscription;

  // fireStore meeting Instance
  fStoreMeetingInstance: firebaseMeetingWaitingMetaData;

  EquipmentStatus = EquipmentStatus;

  connecting = true;
  reconnecting = false;

  bgShades = ["#242424", "#292929", "#2e2e2e", "#303030", "#363636", "#3b3b3b", "#3d3d3d"];


  @HostListener('window:resize', ['$event'])
  onResize(event) {
    // this.resizeObservable.next(event);
    this.handelResize();
  }
  // resizeObservable = new ReplaySubject();

  isCounselor = false;
  myAttendeeId: string;

  // video In
  videoIn = true;

  invokedForBalance = new Set();

  constructor(
    private cdr: ChangeDetectorRef,
    private conference: ConferenceService,
    private firebaseUtility: FirebaseUtility,
    private zone: NgZone
  ) { }

  ngOnInit() {
    if (!this.conference.metaData) {
      return;
    }

    /**
     * set factors and primes 
     * considering max 200 people only
     */
    this.setFactors();
    this.primes = new Set(this.getPrimes(200));
    this.setMinWidthHeight();

    // this.resizeSubs = this.resizeObservable.pipe(throttleTime(300)).subscribe(
    //   ev => {
    //     // this.handelResize();
    //   }
    // )

    /**
     * set counselor flag
     */
    if (this.conference.metaData.meeting.participant.counselor == RestBoolean.TRUE) {
      this.isCounselor = true;
    }

    this.myAttendeeId = (this.conference.metaData.meeting.participant.access.aws_attendee_details as AwsAttendeeDetails).AttendeeId;
  }

  setAudioVideoObserver() {
    this.meetingSession.audioVideo.addObserver(this.observer as AudioVideoObserver)
  }

  setAttendeeObserver() {
    this.meetingSession.audioVideo.realtimeSubscribeToAttendeeIdPresence(this.attendeeObserver.bind(this));
  }

  setContentShareObserver() {
    this.meetingSession.audioVideo.addContentShareObserver(this.contentShareObserver);
  }

  /**
   * event handlers for meeting events
   */
  observer: AudioVideoObserver = {

    /**
     * detect in video tile change
     * new tile addition
     * change in tile state
     */
    videoTileDidUpdate: (videoTileState: VideoTileState) => {
      /**
       * ignore if there is no attendee id present
       */
      if (!videoTileState.boundAttendeeId) {
        return;
      }

      /**
       * handel content share
       */
      if (videoTileState.isContent) {
        queueScheduler.schedule(() => {
          this.contentShareStart(videoTileState);
        })
        return;
      }

      /**
       * handel normal video
       */
      queueScheduler.schedule(() => {
        this.videoTileChange(videoTileState);
      });
    },
    videoTileWasRemoved: (tileId: number) => {
      try {
        switch (tileId) {
          case this.tileIdForUserSharingScreen:
            this.contentShareStopped();
            break;
          default:
            queueScheduler.schedule(() => {
              this.videoTileRemoved(tileId);
            });
            break;
        }
      } catch (error) {
        console.error(error);
      }
    },
    audioVideoDidStartConnecting: (reconnecting) => {
      this.zone.run(() => {
        if (reconnecting) {
          if( this.isCounselor ){
            this.$counselorDisconnected.emit();
          }
          else{
            this.$connectionLost.emit();
          }
        }
        this.reconnecting = reconnecting;
      })
      // console.log(reconnecting, " : reconnecting")
    },
    audioVideoDidStart: () => {
      // console.log('AudioVideo started');

      this.zone.run(() => {
        this.connecting = false;
        this.reconnecting = false;
        this.$connected.emit();
      })
    },
    connectionDidSuggestStopVideo: () => {
      this.$suggestVideoStop.emit();
    }
  }

  contentShareObserver: ContentShareObserver = {
    contentShareDidStop: () => {
      this.contentShareStopped();
    }
  }

  attendeeObserver(presentAttendeeId, present) {
    /**
     * do not process content
     */
    if (presentAttendeeId.includes('content')) {
      return;
    }

    /**
     * add task to queue
     */
    queueScheduler.schedule(() => {
      try {
        /**
       * if user is present
       */
        if (present) {
          /**
           * if user is not already added
           */
          if (!this.attendees.has(presentAttendeeId)) {
            /**
             * set context menu
             */
            this.contextMenu[presentAttendeeId] = false;

            /**
             * add to attendee set
             */
            this.attendees.add(presentAttendeeId);

            /**
             * add attendee initial Av map
             */
            if (!this.attendeeAVStatusMap[presentAttendeeId]) {
              let notFound = true;
              if (this.fStoreMeetingInstance) {
                for (let accessId in this.fStoreMeetingInstance.participants) {
                  if (presentAttendeeId == this.fStoreMeetingInstance.participants[accessId].AttendeeId) {
                    this.attendeeAVStatusMap[presentAttendeeId] = this.fStoreMeetingInstance.participants[accessId];
                    notFound = false;
                    break;
                  }
                }
              }

              if (notFound) {
                this.attendeeAVStatusMap[presentAttendeeId] = {
                  audio_out_participant: EquipmentStatus.UNDEFINED,
                  audio_out_counselor: EquipmentStatus.ON,
                  video_out_participant: EquipmentStatus.UNDEFINED,
                  video_out_counselor: EquipmentStatus.ON,
                  screen_participant: EquipmentStatus.UNDEFINED,
                  screen_counselor: EquipmentStatus.ON,
                  audio_in_counselor: EquipmentStatus.ON,
                  audio_in_participant: EquipmentStatus.ON,
                  video_in_counselor: EquipmentStatus.ON,
                  video_in_participant: EquipmentStatus.ON,
                  name: ''
                };
              }

            }


            /**
             * add a tile for this attendee
             */
            this.tileIds.push(presentAttendeeId);

            /**
             * map this attendeeId with its index in tiles array
             */
            this.tileIndexMap[presentAttendeeId] = this.tileIds.length - 1;

            /**
             * make its initial video state false
             */
            this.tileVideoState[presentAttendeeId] = false;

            /**
             * update grid layout to accommodate new tile
             */
            this.setMinWidthHeight();
            this.cdr.detectChanges();

            /**
             * get video element that will be bounded to this attendee ID
             */
            const videoElem = document.getElementById(presentAttendeeId) as HTMLVideoElement;



            /**
             * make video cover or fit as per height:width ratio of video
             */
            this.setVideoContentFit(videoElem);

            /**
             * add this video element to the video tile array
             */
            this.tiles.push(videoElem);
            this.cdr.detectChanges();

            if (this.myAttendeeId != presentAttendeeId) {
              if (!this.invokedForBalance.has(presentAttendeeId)) {
                this.$fromActive.emit();
                this.invokedForBalance.add(presentAttendeeId);
              }
            }
          }
        }
        else {
          const whoLeft = cloneDeep(this.attendeeAVStatusMap[presentAttendeeId]);

          /**
           * remove attendee
           */
          this.attendees.delete(presentAttendeeId);

          /**
           * get current index of this attendee for tile and tilesId array
           */
          const idx = this.tileIndexMap[presentAttendeeId];

          /**
           * remove tileId and video tile for this attendee
           */
          this.tileIds.splice(idx, 1);
          this.tiles.splice(idx, 1);

          for(let i = 0; i < this.tileIds.length; i++){
            this.tileIndexMap[this.tileIds[i]] = i;
          }

          // console.log(this.tileIds, " : ", presentAttendeeId);

          /**
           * delete all mapping for this attendee
           */
          delete this.tileIndexMap[presentAttendeeId];
          delete this.tileVideoState[presentAttendeeId];
          // delete this.attendeeAVStatusMap[presentAttendeeId];

          /**
           * adjust grid layout to accommodate the remove of this attendee
           */
          this.setMinWidthHeight();
          this.cdr.detectChanges();

          if (whoLeft.client == ParticipantType.COUNSELOR) {
            this.$meetingEnded.emit();
          }
          /**
           * client or guest left
           */
          else if (whoLeft.AttendeeId != this.myAttendeeId && this.conference.metaData.meeting.participant.counselor) {
            this.$participantLeft.emit(whoLeft.name);
          }
        }

        this.$activeParticipantCount.emit(this.attendees.size);
      } catch (error) {
        console.error(error);
      }
    })
  }

  videoTileChange(videoTileState: VideoTileState) {
    queueScheduler.schedule(() => {
      try {
        /**
       * get attendeeId id associated with this tile
       */
        const attendeeId = videoTileState.boundAttendeeId;

        /**
         * map the tile id to attendeeId
         */
        this.tileIdAttendeeIdMap[videoTileState.tileId] = attendeeId;

        /**
         * if there is a tile present for this user
         */
        if (has(this.tileIndexMap, attendeeId)) {

          /**
           * get tile index for this attendee
           */
          const idx = this.tileIndexMap[attendeeId];

          /**
           * get video element
           */
          const videoElement = this.tiles[idx];

          /**
           * bind the existing tile to the attendee video stream
           */
          this.meetingSession.audioVideo.bindVideoElement(videoTileState.tileId, videoElement);

          if (videoTileState.active) {
            /**
             * if video is on
             */
            this.tileVideoState[attendeeId] = true;
          }
          else {
            /**
             * video is off
             */
            this.tileVideoState[attendeeId] = false;
          }
          this.cdr.detectChanges();
        }
        else {
          /**
           * set context menu
           */
          this.contextMenu[attendeeId] = false;

          /**
           * if there was no tile present fo this attendee
           * this is a new attendee, add it
           */
          this.attendees.add(attendeeId);

          /**
           * add attendee initial Av map
           */
          if (!this.attendeeAVStatusMap[attendeeId]) {
            let notFound = true;
            if (this.fStoreMeetingInstance) {
              for (let accessId in this.fStoreMeetingInstance.participants) {
                if (attendeeId == this.fStoreMeetingInstance.participants[accessId].AttendeeId) {
                  this.attendeeAVStatusMap[attendeeId] = this.fStoreMeetingInstance.participants[accessId];
                  notFound = false;
                  break;
                }
              }
            }

            if (notFound) {
              this.attendeeAVStatusMap[attendeeId] = {
                audio_out_participant: EquipmentStatus.UNDEFINED,
                audio_out_counselor: EquipmentStatus.ON,
                video_out_participant: EquipmentStatus.UNDEFINED,
                video_out_counselor: EquipmentStatus.ON,
                screen_participant: EquipmentStatus.UNDEFINED,
                screen_counselor: EquipmentStatus.ON,
                audio_in_counselor: EquipmentStatus.ON,
                audio_in_participant: EquipmentStatus.ON,
                video_in_counselor: EquipmentStatus.ON,
                video_in_participant: EquipmentStatus.ON,
                name: ''
              };
            }

          }

          /**
           * add new tile for this attendee
           */
          this.tileIds.push(attendeeId);

          /**
           * map attendeeId with tile index
           */
          this.tileIndexMap[attendeeId] = this.tileIds.length - 1;

          /**
           * set initial video state false
           */
          this.tileVideoState[attendeeId] = false;

          this.cdr.detectChanges();

          /**
           * get video element associated with this user
           */
          const videoElem = document.getElementById(attendeeId) as HTMLVideoElement;

          /**
           * set video cover or fit
           */
          this.setVideoContentFit(videoElem);

          /**
           * add video element to tile
           */
          this.tiles.push(videoElem);

          /**
           * add attendee video stream to assigned video tile
           */
          this.meetingSession.audioVideo.bindVideoElement(videoTileState.tileId, videoElem);

          if (videoTileState.active) {
            /**
             * if video on
             */
            this.tileVideoState[attendeeId] = true;
          }
          else {
            /**
             * if video off
             */
            this.tileVideoState[attendeeId] = false;
          }
        }

        // console.log(this.tileIds, " : ", videoTileState.boundAttendeeId);
        this.setMinWidthHeight();
        this.cdr.detectChanges();
      } catch (error) {
        console.error(error);
        throw error;
      }
    })
  }

  videoTileRemoved(tileId) {
    try {
      /**
     * get attendeeId
     */
      const attendeeId = this.tileIdAttendeeIdMap[tileId];

      /**
       * if this attendee has a video tile allocated
       * remove the tile
       */
      if (has(this.tileIndexMap, attendeeId)) {
        this.tileVideoState[attendeeId] = false;
        delete this.tileIdAttendeeIdMap[tileId];
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  contentShareStart(videoTileState: VideoTileState) {
    try {
      /**
       * set screen share on
       */
      this.screenBeingShared = true;
      this.$screenShare.emit(true);

      /**
       * remove content from attendee id and get 
       * attendee id for the user who is sharing the screen
       */
      const baseAttendeeId = new DefaultModality(videoTileState.boundAttendeeId).base();

      /**
       * set screen share attendee id and 
       * tile id for the same
       */
      this.screenShareAttendeeId = baseAttendeeId;
      this.tileIdForUserSharingScreen = videoTileState.tileId;

      /**
       * get video element for screen share
       * and bind it to screen share stream
       */
      const videoElem = document.getElementById('contentTile') as HTMLVideoElement;
      this.meetingSession.audioVideo.bindVideoElement(videoTileState.tileId, videoElem);
      this.cdr.detectChanges();
    } catch (error) {
      console.error(error);
      this.screenBeingShared = false;
      this.$screenShare.emit(false);
      this.tileIdForUserSharingScreen = undefined;
      this.cdr.detectChanges()
    }
  }

  contentShareStopped() {
    /**
     * reset content share
     * remove tile id
     */
    this.screenBeingShared = false;
    this.$screenShare.emit(false);
    this.tileIdForUserSharingScreen = undefined;
    this.cdr.detectChanges();

    /**
     * remove attendeeId
     * and emit event to stop device screen share
     */
    this.screenShareAttendeeId = '';
    this.$contentSharingStopped.emit();
    this.cdr.detectChanges();

    /**
     * re configure grid 
     */
    this.setMinWidthHeight();
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 10)
  }

  setFactors() {
    for (let i = 2; i < 201; i++) {
      this.factors[i] = this.getFactors(i);
    }
  }

  getPrimes(max) {
    var sieve = [], i, j, primes = [];
    for (i = 2; i <= max; ++i) {
      if (!sieve[i]) {
        primes.push(i);
        for (j = i << 1; j <= max; j += i) {
          sieve[j] = true;
        }
      }
    }
    return primes;
  }

  getFactors(num) {
    const factors = [];
    for (let i = 1; i < num; i++) {
      if (num % i == 0) {
        factors.push(i);
      }
    }
    return factors;
  }

  desired(num) {
    let factors = this.factors[num];
    while ((factors[1] < 4 && factors.length == 3 && num > 9) || this.primes.has(num)) {
      num++;
      factors = this.factors[num];
    }
    return { num, factors }
  }

  setMinWidthHeight() {
    let count = this.tileIds.length;
    if (count == 0) return;

    const heightWidth = this.getContainerHeightWidth();
    const height = Math.floor(heightWidth.height);
    const width = Math.floor(heightWidth.width);

    if (count < 5) {
      if (height < width) {
        const availableWidth = width;
        const minWidth = count == 1 ? Math.floor(availableWidth) : Math.floor(availableWidth / 2);
        this.minWidth = minWidth + 'px';

        const availableHeight = height;
        const minHeight = count > 2 ? Math.floor(availableHeight / 2) : availableHeight;
        this.minHeight = minHeight + 'px';
      }
      else {
        const availableWidth = width;
        const minWidth = count < 3 ? Math.floor(availableWidth) : Math.floor(availableWidth / 2);
        this.minWidth = minWidth + 'px';

        const availableHeight = height;
        const minHeight = count > 1 ? Math.floor(availableHeight / 2) : availableHeight;
        this.minHeight = minHeight + 'px';
      }
      return;
    }

    const desiredVal = this.desired(count);
    const factors = desiredVal.factors;
    count = desiredVal.num;

    const mid = Math.ceil(factors.length / 2);
    const factor1 = factors[mid];
    const factor2 = Math.ceil(count / factor1);

    const availableWidth = width;
    const availableHeight = height;

    let colCount = Math.max(factor1, factor2);
    let rowCount = Math.min(factor1, factor2);

    if (height > width) {
      colCount = Math.min(factor1, factor2);
      rowCount = Math.max(factor1, factor2);
    }

    console.table({ colCount, rowCount })

    const minWidth = Math.floor(availableWidth / colCount);
    this.minWidth = minWidth + 'px';

    const minHeight = Math.floor(availableHeight / rowCount);
    this.minHeight = minHeight + 'px';
  }

  /**
   * if height is more than width
   * contain the video in frame
   * otherwise make video as cover
   * @param videoElem 
   */
  setVideoContentFit(videoElem: HTMLVideoElement) {
    videoElem.style.objectFit = 'contain';
    // if (videoElem.videoHeight > videoElem.videoWidth) {
    //   videoElem.style.objectFit = 'contain';
    // }
    // else {
    //   videoElem.style.objectFit = 'cover';
    // }
  }

  /**
   * get video grid height and width to
   * set layout
   */
  getContainerHeightWidth() {
    const node = document.getElementById('gridContainer');
    // minus 1 because by default browser is rounding of number to ceiling integer so to compensate for that
    let width = node.clientWidth - 1;
    let height = node.clientHeight - 1;
    return { height, width };
  }

  handelResize() {
    queueScheduler.schedule(() => {
      this.setMinWidthHeight();
    })
  }

  /**
   * listen to firebase meeting object
   * @param access_id 
   */
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

  /**
   * handel firebase meeting object changes
   * @param newInstance 
   * @param access_id 
   */
  handelFireStoreUpdates(newInstance: firebaseMeetingWaitingMetaData, access_id: string) {
    if (!newInstance) {
      return;
    }

    for (let key in newInstance.participants) {
      /**
       * fetch device updates
       */
      const avObj = cloneDeep(newInstance.participants[key]);

      this.attendeeAVStatusMap[newInstance.participants[key].AttendeeId] = avObj as any;
      this.attendeeIdAccessIdMap[newInstance.participants[key].AttendeeId] = key;
    }

    this.fStoreMeetingInstance = cloneDeep(newInstance);

    /**
     * if local user is present in firebase update
     * check video input status
     */
    if (newInstance.participants[access_id]) {
      this.checkVideoInStatus(newInstance, access_id);
    }

    this.cdr.detectChanges();
  }

  checkVideoInStatus(newInstance: firebaseMeetingWaitingMetaData, access_id: string) {
    /**
     * check if video in in stopped by counselor or turned on
     */
    if (newInstance.participants[access_id].video_in_counselor == EquipmentStatus.OFF) {
      if (this.meetingSession) {
        this.videoIn = false;
      }
    }
    else if (newInstance.participants[access_id].video_in_counselor != EquipmentStatus.OFF && newInstance.participants[access_id].video_in_participant != EquipmentStatus.OFF) {
      if (this.meetingSession) {
        this.videoIn = true;
      }
    }

    this.cdr.detectChanges();
  }

  closeContext(attendeeId) {
    this.contextMenu[attendeeId] = false;
  }

  async mute(attendeeId) {
    try {
      /**
       * set Equipment status
       * get meeting id
       */
      const meetingId = this.conference.metaData.meeting.meeting_id;

      /**
       * if iam muting myself
       */
      if (attendeeId == this.myAttendeeId) {
        /**
         * no need to update firebase control panel mute will take care of firebase update
         */
        this.$triggerLocalMute.emit();
      }
      else {
        /**
         * this is the case when counselor is muting someone else
         * update firebase
         */
        const toUpdate = {};
        toUpdate[`participants.${this.attendeeIdAccessIdMap[attendeeId]}.audio_out_counselor`] = EquipmentStatus.OFF;
        await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meetingId).update(toUpdate);
      }
    } catch (error) {
      console.error(error);
    }
  }


  async leaveMeeting(attendeeId: string) {
    try {
      /**
       * if local user event to leave meeting
       */
      if (this.myAttendeeId == attendeeId) {
        this.$leaveMeeting.emit();
        return;
      }

      /**
       * else update fire store 
       */
      await this.conference.reject(this.attendeeIdAccessIdMap[attendeeId]);
    } catch (error) {
      console.error(error);
    }
  }

  async unmute(attendeeId) {
    try {
      if (attendeeId == this.myAttendeeId) {
        /**
         * for local user emit event to unmute
         */
        this.$triggerLocalUnmute.emit();
      }
      else {
        /**
         * for counselor updating for other user update fire store
         */
        const meeting_id = this.conference.metaData.meeting.meeting_id;
        const toUpdate = {};
        toUpdate[`participants.${this.attendeeIdAccessIdMap[attendeeId]}.audio_out_counselor`] = EquipmentStatus.ON;
        await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meeting_id).update(toUpdate);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async muteMeeting(attendeeId: string) {
    try {
      if (attendeeId == this.myAttendeeId) {
        /**
         * for local user emit event 
         */
        this.$audioInStop.emit();
      }
      else {
        /**
         * for other user update firebase
         */
        const meeting_id = this.conference.metaData.meeting.meeting_id;
        const toUpdate = {};
        toUpdate[`participants.${this.attendeeIdAccessIdMap[attendeeId]}.audio_in_counselor`] = EquipmentStatus.OFF;
        await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meeting_id).update(toUpdate);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async unmuteMeeting(attendeeId) {
    try {
      if (attendeeId == this.myAttendeeId) {
        /**
         * for local user emit event this will be cached in conference home component
         */
        this.$audioInStart.emit();
      }
      else {
        /**
         * for remote user update firebase
         */
        const meeting_id = this.conference.metaData.meeting.meeting_id;
        const toUpdate = {};
        toUpdate[`participants.${this.attendeeIdAccessIdMap[attendeeId]}.audio_in_counselor`] = EquipmentStatus.ON;
        await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meeting_id).update(toUpdate);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async stopVideo(attendeeId: string) {
    try {
      if (attendeeId == this.myAttendeeId) {
        /**
         * for local user emit event and catch in conference home component
         */
        this.$videoOutStop.emit();
      }
      else {
        /**
         * for remote user update firebase
         */
        const meeting_id = this.conference.metaData.meeting.meeting_id;
        const toUpdate = {};
        toUpdate[`participants.${this.attendeeIdAccessIdMap[attendeeId]}.video_out_counselor`] = EquipmentStatus.OFF;
        await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meeting_id).update(toUpdate);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async startVideo(attendeeId) {
    try {
      if (attendeeId == this.myAttendeeId) {
        /**
         * for local user emit event can catch in conference home component
         */
        this.$videoOutStart.emit();
      }
      else {
        /**
         * for remote user update firebase
         */
        const meeting_id = this.conference.metaData.meeting.meeting_id;
        const toUpdate = {};
        toUpdate[`participants.${this.attendeeIdAccessIdMap[attendeeId]}.video_out_counselor`] = EquipmentStatus.ON;
        await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meeting_id).update(toUpdate);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async stopVideoIn(attendeeId: string) {
    try {
      /**
       * stop video in for local user
       */
      this.videoIn = false;
      this.cdr.detectChanges();

      /**
       * update firebase meeting object
       */
      const meeting_id = this.conference.metaData.meeting.meeting_id;
      const toUpdate = {};
      toUpdate[`participants.${this.attendeeIdAccessIdMap[attendeeId]}.video_in_participant`] = EquipmentStatus.OFF;
      await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meeting_id).update(toUpdate);
    } catch (error) {
      console.error(error);
    }
  }

  async stopMeetingVideo(attendeeId: string) {
    try {
      if (attendeeId == this.myAttendeeId) {
        /**
         * for local user
         */
        await this.stopVideoIn(attendeeId);
      }
      else {
        /**
         * for remote user update firebase
         */
        const meeting_id = this.conference.metaData.meeting.meeting_id;
        const toUpdate = {};
        toUpdate[`participants.${this.attendeeIdAccessIdMap[attendeeId]}.video_in_counselor`] = EquipmentStatus.OFF;
        await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meeting_id).update(toUpdate);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async startVideoIn(attendeeId: string) {
    try {
      /**
       * if counselor permission is of show alert to ask access and return
       */
      if (this.attendeeAVStatusMap[attendeeId] && this.attendeeAVStatusMap[attendeeId].video_in_counselor == EquipmentStatus.OFF) {
        alert('Please ask counselor to turn on your meeting video permissions');
        return;
      }

      /**
       * set video in true and update firebase
       */
      this.videoIn = true;
      this.cdr.detectChanges();
      const meeting_id = this.conference.metaData.meeting.meeting_id;
      const toUpdate = {};
      toUpdate[`participants.${this.attendeeIdAccessIdMap[attendeeId]}.video_in_participant`] = EquipmentStatus.ON;
      await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meeting_id).update(toUpdate);
    } catch (error) {
      console.error(error);
    }
  }

  async startMeetingVideo(attendeeId) {
    try {
      if (attendeeId == this.myAttendeeId) {
        /**
         * for local user
         */
        await this.startVideoIn(attendeeId);
      }
      else {
        /**
         * for remote user update firebase
         */
        const meeting_id = this.conference.metaData.meeting.meeting_id;
        const toUpdate = {};
        toUpdate[`participants.${this.attendeeIdAccessIdMap[attendeeId]}.video_in_counselor`] = EquipmentStatus.ON;
        await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meeting_id).update(toUpdate);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async stopScreenShare(attendeeId) {
    try {
      if (attendeeId == this.myAttendeeId) {
        /**
         * for local user emit event and catch in consoler home component
         */
        this.$screenStop.emit();
      }
      else {
        /**
         * for remote user update firebase
         */
        const meeting_id = this.conference.metaData.meeting.meeting_id;
        const toUpdate = {};
        toUpdate[`participants.${this.attendeeIdAccessIdMap[attendeeId]}.screen_counselor`] = EquipmentStatus.OFF;
        await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meeting_id).update(toUpdate);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async startScreenShare(attendeeId) {
    try {
      if (attendeeId == this.myAttendeeId) {
        /**
         * local user emit event and catch in conference home component
         */
        this.$screenStart.emit();
      }
      else {
        /**
         * for remote user update firebase
         */
        const meeting_id = this.conference.metaData.meeting.meeting_id;
        const toUpdate = {};
        toUpdate[`participants.${this.attendeeIdAccessIdMap[attendeeId]}.screen_counselor`] = EquipmentStatus.ON;
        await this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meeting_id).update(toUpdate);
      }
    } catch (error) {
      console.error(error);
    }
  }

  addTest(){
    this.tileIds.push(this.tileIds.length+1);
    this.handelResize();
  }

  gridHeight(){
    return (window.innerHeight - 100) + 'px';
  }

  fetchIconSize(size: string){
    let ht: any = size.replace('px', '');
    ht = Math.floor( parseInt(ht) * 0.3);
    return ht + 'px';
  }

  ngOnDestroy() {
    if (this.meetingSession) {
      this.meetingSession.audioVideo.removeObserver(this.observer as AudioVideoObserver);
      this.meetingSession.audioVideo.removeContentShareObserver(this.contentShareObserver);
      this.meetingSession.audioVideo.realtimeUnsubscribeToAttendeeIdPresence(this.attendeeObserver.bind(this));
    }

    // if (this.resizeSubs) {
    //   this.resizeSubs.unsubscribe();
    // }

    if (this.fStoreSubscription) {
      this.fStoreSubscription.unsubscribe();
    }
  }

}