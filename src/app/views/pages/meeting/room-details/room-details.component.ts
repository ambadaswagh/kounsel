import { Component, OnInit, ChangeDetectorRef, EventEmitter, Output, HostListener } from '@angular/core';
import { MeetingService } from '../../../../core/services/general/meeting/meeting.service';
import moment from 'moment';
import { ParticipantGETResponse } from '../../../../core/model/meeting/meeting.model';
import { ParticipantType } from '../../../../core/model/meeting/Participant.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'kt-room-details',
  templateUrl: './room-details.component.html',
  styleUrls: ['./room-details.component.scss']
})
export class RoomDetailsComponent implements OnInit {
  @Output() $close = new EventEmitter<any>();
  displayParticipantDetail = false;
  userToDisplay;
  showBillingMethod = false;
  pType = ParticipantType;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    const elem = document.getElementById('roomDetailCont') as HTMLDivElement;
    elem.style.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)+'px';
  }

  constructor(
    public meeting: MeetingService,
    private cdr: ChangeDetectorRef,
    public translateService: TranslateService
  ) { }

  ngOnInit() {
    const elem = document.getElementById('roomDetailCont') as HTMLDivElement;
    elem.style.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)+'px';

    this.meeting.participantPagination.initialLoad = true;
    this.meeting.initParticipants();
    this.loadParticipants();
  }

  ngOnViewInit(){
    const elem = document.getElementById('roomDetailCont') as HTMLDivElement;
    elem.style.height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)+'px';
  }

  loadParticipants() {
    this.meeting.participantPagination.loading = true;
    this.cdr.detectChanges();
    this.meeting.getParticipants().subscribe(
      (response) => {
        if (response.code == 200 || response.code == 201) {
          this.processParticipants(response);
          this.meeting.participantPagination.loading = false;
        }
        else if (response.code == 500) {
          this.meeting.participantPagination.loading = false;
          this.meeting.participantPagination.loadMore = false;
        }
        this.meeting.participantPagination.initialLoad = true;
        this.cdr.detectChanges();
      },
      (err) => {
        console.error(err);
        this.meeting.participantPagination.loading = false;
        this.meeting.participantPagination.initialLoad = true;
        this.cdr.detectChanges();
      }
    )
  }

  handelScroll() {
    if (this.meeting.participantPagination.loading || !this.meeting.participantPagination.loadMore || !this.meeting.participantPagination.initialLoad || this.displayParticipantDetail) return;
    this.loadParticipants();
  }

  processParticipants(response: ParticipantGETResponse) {
    const participantSet = new Set(this.meeting.participants.map(i => i.access_id));
    response.data.participant = response.data.participant.filter(i => !participantSet.has(i.access_id));

    this.meeting.participants.push(...response.data.participant.map(item => {
      item['image_url'] = item['image_url'] ? item['image_url'] : 'assets/media/profile_images/profile-placeholder-300x300.png';
      return item;
    }))

    this.meeting.participants.sort((a, b) => b.toc - a.toc);
    
    if(this.meeting.participants.length){
      this.meeting.participantPagination.time = this.meeting.participants[this.meeting.participants.length - 1]['toc'] - 1;
    }

    if (response.data.participant.length < this.meeting.participantPagination.count) {
      this.meeting.participantPagination.loadMore = false;
    }
    else {
      this.meeting.participantPagination.loadMore = true;
    }
  }

  showParticipantDetail(user) {
    this.meeting.participantDetail = {
      participant: user,
      toDisplay: 'participant'
    }
    this.displayParticipantDetail = true;
    this.cdr.detectChanges();
  }

  closeParticipantDetail(accessId) {
    if (accessId) {
      const idx = this.meeting.participants.findIndex((val) => {
        return val.access_id == accessId;
      })
      if (idx > -1) {
        this.meeting.participants.splice(idx, 1);
      }
    }
    this.displayParticipantDetail = false;
    this.cdr.detectChanges();
  }

  toUnix(dtVal) {
    return moment(dtVal).valueOf();
  }

  displayParticipant() {
    this.displayParticipantDetail = true;
    this.cdr.detectChanges();
    this.meeting.initParticipants();
    this.loadParticipants();
  }

  close(){
    this.$close.emit();
  }

}
