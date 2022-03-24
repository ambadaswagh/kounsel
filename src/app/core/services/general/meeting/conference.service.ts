import { Injectable } from '@angular/core';
import { AwsAttendeeDetails, ConferenceMetaData } from '../../../model/meeting/conference.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { firebaseMeetingWaitingMetaData, JoinStatus } from '../../../../core/model/meeting/meeting.model';
import { FirebaseUtility } from '../../firebase/firebase.service';
import { map } from 'rxjs/operators';
import { cloneDeep, has } from 'lodash';
import { DataMessage, MeetingSession } from 'amazon-chime-sdk-js';
import moment from 'moment';
import { v4 as uuid } from 'uuid';
import { ConversationType } from '../../../../core/model/general/message/conversation.model';
@Injectable({
  providedIn: 'root'
})
export class ConferenceService {
  metaData: ConferenceMetaData;
  audio = false;
  video = false;
  guest = false;
  userId = '';

  $meetingObserver: Observable<firebaseMeetingWaitingMetaData>;

  // for group chat
  groupChat = {
    chat: {},
    subscribers: [],
    conversation: [],
    activeUsers: [],
    participantsMap: {},
  }
  groupChatSubject = new BehaviorSubject(cloneDeep(this.groupChat));
  $groupChatObserver = this.groupChatSubject.asObservable();
  chatSession: MeetingSession;

  constructor(
    private firebaseUtility: FirebaseUtility
  ) { }

  startListeningToMeetingChanges() {
    this.$meetingObserver = undefined;
    const meetingId = this.metaData.meeting.meeting_id;
    this.$meetingObserver = this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meetingId).valueChanges().pipe(
      map((newInstance: firebaseMeetingWaitingMetaData) => {
        const meetingObj = cloneDeep(newInstance);
        if (!meetingObj) return;
        const keysToHave = ["image_url", "name", "client", "room_status", "participation", "user_id", "audio_out_participant", "audio_out_counselor", "video_out_participant", "video_out_counselor", "screen_participant", "screen_counselor", "audio_in_participant", "audio_in_counselor", "video_in_participant", "video_in_counselor", "AttendeeId"]
        const participants = {};
        const subscribers = [];
        for (const key in meetingObj.participants) {
          if (keysToHave.every(val => has(meetingObj.participants[key], val))) {
            participants[key] = meetingObj.participants[key];
          }

          if( meetingObj.participants[key].room_status == JoinStatus.ACTIVE ){
            subscribers.push({
              user_id: meetingObj.participants[key].user_id,
              image_url: meetingObj.participants[key].image_url,
              name: meetingObj.participants[key].name,
              AttendeeId: meetingObj.participants[key].AttendeeId
            })
            this.groupChat.participantsMap[meetingObj.participants[key].AttendeeId] = meetingObj.participants[key];
          }
        }
        this.setGroupChatSubscribers(subscribers);
        meetingObj.participants = cloneDeep(participants);
        return cloneDeep(meetingObj);
      })
    );
  }

  async admit(access_id) {
    try {
      const meetingId = this.metaData.meeting.meeting_id;
      const ref = this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meetingId);
      const toUpdate = {};
      toUpdate[`participants.${access_id}.room_status`] = JoinStatus.ACTIVE;
      await ref.update(toUpdate);
    } catch (error) {
      throw error;
    }
  }

  async reject(access_id) {
    try {
      if (!access_id) {
        console.error("Access id is empty");
        return;
      }
      const meetingId = this.metaData.meeting.meeting_id;
      const ref = this.firebaseUtility.fireStore.collection('/counseling/sessions/meeting/').doc(meetingId);
      const toUpdate = {};
      toUpdate[`participants.${access_id}.room_status`] = JoinStatus.REJECTED;
      await ref.update(toUpdate);
    } catch (error) {
      throw error;
    }
  }

  cleanConference() {
    this.metaData = undefined;
    this.audio = false;
    this.video = false;
    this.$meetingObserver = undefined;
  }

  setGroupChatSubscribers(value: any){
    this.groupChat.subscribers = value;
    this.groupChatSubject.next(cloneDeep(this.groupChat));
  }

  addGroupChatMessage(value: string){
    this.chatSession.audioVideo.realtimeSendDataMessage('chat', value, 300000)
    const chat = {
      message: value,
      type: ConversationType.TEXT,
      message_id: 'Chat-'+uuid(),
      sender: this.userId,
      time: this.getFormattedTime(),
      topic: 'chat',
      image_url: this.metaData.meeting.participant.image_url || ''
    }
    this.groupChat.chat = chat;
    this.groupChat.conversation.push(chat);
    this.groupChatSubject.next(cloneDeep(this.groupChat));
  }

  newChatReceived(dataMessage: DataMessage){
    if( dataMessage.senderAttendeeId != (this.metaData.meeting.participant.access.aws_attendee_details as AwsAttendeeDetails).AttendeeId && this.groupChat.participantsMap[dataMessage.senderAttendeeId]){
      const chat = {
        message: dataMessage.text(),
        type: ConversationType.TEXT,
        message_id: 'Chat-'+uuid(),
        sender: this.groupChat.participantsMap[dataMessage.senderAttendeeId].user_id,
        time: this.getFormattedTime(),
        topic: 'chat',
        image_url: this.groupChat.participantsMap[dataMessage.senderAttendeeId].image_url
      }
      this.groupChat.chat = chat;
      this.groupChat.conversation.push(chat);
      this.groupChatSubject.next(cloneDeep(this.groupChat));
    }
  }

  getFormattedTime() {
    let temp = moment();
    let isoTime = temp.toISOString();
    return isoTime.split('.')[0] + '-0000';
  }

  getSender() {
    let sender = {
      user_id: this.userId,
      name: this.metaData.meeting.participant.name,
      image_url: this.metaData.meeting.participant.image_url || ''
    }
    return sender;
  }

  clearChatOnDestroy(){
    this.groupChatSubject.next({
      chat: {},
      subscribers: [],
      conversation: [],
      activeUsers: [],
      participantsMap: {},
    })
  }
}
