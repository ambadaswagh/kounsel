import { Injectable } from '@angular/core';
import { BaseService } from '../../base/base.service';
import { Observable } from 'rxjs';
import { meetingGETResponse, Meeting, ParticipantGETResponse, meetingAccessPOSTResponse, Participant, Access } from '../../../model/meeting/meeting.model';
import { ParticipantType } from '../../../../core/model/meeting/Participant.model';

@Injectable({
  providedIn: 'root'
})
export class MeetingService extends BaseService {
  personalRoomDetails: Meeting;
  counselor: number;
  participants: any[] = [];
  participantDetail : { toDisplay?: string, access?: Access, participant?: Participant };
  participantPagination = {
    count: 15,
    time: undefined,
    loadMore: true,
    loading: false,
    initialLoad: false
  }


  getMeeting(): Observable<meetingGETResponse> {
    return this.httpGetWithHeader('meeting');
  }

  getParticipants() : Observable<ParticipantGETResponse>{
    const qs = Utility.getQueryString({
      room_id: this.personalRoomDetails.room_id,
      time: this.participantPagination.time || Utility.getUnixTimeNow(),
      count: this.participantPagination.count
    })


    return this.httpGetWithHeader(`meeting/participant?${qs}`);
  }

  getMeetingAccess(payload) : Observable<meetingAccessPOSTResponse> {
    return this.httpPostWithHeader('meeting/access', payload);
  }

  revokeMeetingAccess(accessId){
    return this.httpDeleteWithHeader('meeting/access/'+accessId);
  }

  setName(name: string, access: string, userType: ParticipantType){
    const payload = {
      participant: {
        access_id: access,
        name: name
      }
    };

    if( userType == ParticipantType.GUEST ){
      console.log('GUEST');
      return this.httpPut('public/meeting/participant', payload);
    }
    else{
      console.log('NOT GUEST')
      return this.httpPutWithHeader('meeting/participant', payload);
    }
  }

  initParticipants(){
    this.participants = [];
    this.participantPagination = {
      count: 15,
      time: undefined,
      loadMore: true,
      loading: true,
      initialLoad: false
    }
  }

  join(payload){
    return this.httpPostWithHeader('meeting/join', payload);
  }

  fetchMetaDataSecure(url: string, body: any){
    return this.httpPostWithHeader(url, body);
  }
}

class Utility {
  static getUnixTimeNow(): number {
    return (new Date()).getTime();
  }

  static getQueryString(params: { [key: string]: any }){
    return Object.keys(params).map( key => key+'='+params[key] ).join('&');
  }
}