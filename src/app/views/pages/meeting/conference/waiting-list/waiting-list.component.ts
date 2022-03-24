import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { ConferenceService } from '../../../../../core/services/general/meeting/conference.service';
import { Subscription } from 'rxjs';
import { firebaseMeetingWaitingMetaData, fStoreParticipant, JoinStatus } from '../../../../../core/model/meeting/meeting.model';
import { AwsAttendeeDetails } from '../../../../../core/model/meeting/conference.model';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'kt-waiting-list',
  templateUrl: './waiting-list.component.html',
  styleUrls: ['./waiting-list.component.scss']
})
export class WaitingListComponent implements OnInit {
  @Output() $close = new EventEmitter<any>();
  @Output() $open = new EventEmitter<any>();
  @Output() $toActive = new EventEmitter<any>();

  fStoreSubscription: Subscription;
  waitingList: any[] = [];

  constructor(
    private conference: ConferenceService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
  }

  addFireStoreObservers() {
    if( this.fStoreSubscription ){
      this.fStoreSubscription.unsubscribe();
      this.fStoreSubscription = undefined;
    }
    this.fStoreSubscription = this.conference.$meetingObserver.subscribe(
      newInstance => {
        this.handelFireStoreUpdates(newInstance);
      },
      console.error
    )
  }

  handelFireStoreUpdates(newInstance: firebaseMeetingWaitingMetaData) {
    try {
      if( !newInstance ) return;

      /**
       * convert participant map to array
       * sort by name for consistency
       * filter participants to keep only waiting participants
       */
      const participants = Object.keys(newInstance.participants)
      .filter( key => {
        return key && key != 'undefined';
      } )
      .map(key => {
        const temp = cloneDeep(newInstance.participants[key]);
        temp['access_id'] = key;
        return temp;
      })
      .sort((a, b) => {
        return a.name.localeCompare(b.name);
      })
      .filter((value) => {
        return value.room_status == JoinStatus.WAITING && value.AttendeeId != (this.conference.metaData.meeting.participant.access.aws_attendee_details as AwsAttendeeDetails).AttendeeId
      } )

      /**
       * if waiting list was empty earlier
       * toggle it on for new waiting participants
       */
      if( !this.waitingList.length && participants.length ){
        this.$open.emit();
      }

      /**
       * update local waiting list
       */
      this.waitingList = participants;

      this.cdr.detectChanges();
    } catch (error) {
      console.error(error);
    }
  }

  async admit(access_id){
    try {
      this.$toActive.emit();
      await this.conference.admit(access_id);
    } catch (error) {
      console.error(error);
    }
  }

  async reject(access_id){
    try {
      await this.conference.reject(access_id);
    } catch (error) {
      console.error(error);
    }
  }

  async rejectAll(){
    try {
      if( !this.waitingList.length ){
        console.info('waiting list check while leaving, no one is waiting');
        return;
      }

      const request = [];
      for( const item of this.waitingList ){
        request.push(this.reject(item.access_id));
      }

      console.log(await Promise.all(request));
    } catch (error) {
      console.error(error);
    }
  }

  getWaitingCount(){
    if( this.waitingList.length == 0 ){
      return 'Here you will see people waiting to join.'
    }
    else if( this.waitingList.length == 1 ){
      return '1 Participant is waiting to join.'
    }
    else{
      return `${this.waitingList.length} Participants are waiting to join.`
    }
  }

  ngOnDestroy() {
    if (this.fStoreSubscription) {
      this.fStoreSubscription.unsubscribe();
    }
  }

}
