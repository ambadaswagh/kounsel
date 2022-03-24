import { Component, OnInit, ChangeDetectorRef, EventEmitter, Output, Input } from '@angular/core';
import { ConferenceService } from '../../../../../core/services/general/meeting/conference.service';
import { SnapShot } from '../../../../../core/model/general/message/snapshot.model'
import { Subscription } from 'rxjs';
import moment from 'moment';
import _, { cloneDeep } from 'lodash';
import { BaseService } from '../../../../../core/services/base/base.service';
import { PushNotificationService } from '../../../../../core/services/pushNotification/push-notification.service';
import { Attachment } from '../../../../../core/model/profile/profile.model';

@Component({
  selector: 'kt-chat-snapshot',
  templateUrl: './chat-snapshot.component.html',
  styleUrls: ['./chat-snapshot.component.scss']
})
export class ChatSnapshotComponent implements OnInit {
  @Output() chatToggled = new EventEmitter<any>();
  @Input() set newMessageSent(value){
    if(value){
      let idx = -1;
      let updated = false;

      for( let chat of this._chatHistory ){
        idx++;
        if( chat.topic.topic_id == value.topic_id ){
          if( !chat.chat ){
            chat['chat'] = {
              message: value.message,
              _time: value._time
            }
            this.msgIdSet.add(value.message_id);
            updated = true;
          }
          else if( chat.chat._time <= value._time ){
            chat.chat.message = value.message;
            chat.chat._time = value._time;
            this.msgIdSet.add(value.message_id);
            updated = true;
          }
          break;
        }
      }

      if( updated ){
        const toMoveObj = this._chatHistory[idx];
        this._chatHistory.splice(idx, 1);
        this._chatHistory.unshift(toMoveObj);
        this.cdr.markForCheck();
      }
    }
  }
  
  _chatHistory: SnapShot[] = [];

  initialLoading = true;
  initialLoadError = false;

  // pagination
  _time = new Date().getTime();
  _count = 15;
  loadMore = true;
  initialLoad = false;
  messageLoading = false;
  keepLoading = true;

  // topic ID set
  topicIDSet = new Set();
  msgIdSet = new Set();

  // message listener
  msgListener : Subscription;

  // meeting related info
  meeting_id: string;

  // group chat
  groupChatOpened = false;
  groupChatSubscriber: Subscription;
  groupChatMeta: any = {};

  constructor(
    private cdr: ChangeDetectorRef,
    private conference: ConferenceService,
    private baseService: BaseService,
    private pushNotification: PushNotificationService
  ) { }

  ngOnInit() {
    this.meeting_id = this.conference.metaData.meeting.meeting_id;
    this.initMessage(true);
    this.groupChatSubscriber = this.conference.$groupChatObserver.subscribe((data)=>{
      this.groupChatMeta = data.chat;
      this.cdr.detectChanges();
    })
  }

  initMessage(_initialLoad) {
    if (!this.initialLoad && !_initialLoad) return;
    if (!this.loadMore || !this.keepLoading || this.messageLoading) return;
    this.messageLoading = true;
    // this.updateMessageLoading();
    this.cdr.detectChanges()
    this.baseService.getMeetingChatSnapShot(this._time, this._count.toString(), this.meeting_id).subscribe(
      response => {
        this.initialLoading = false;
        if (response['code'] == 200 || response['code'] == 201) {
          this.processMessage(this.formaMessageListData(response));
          if (!this.initialLoad && _initialLoad) {
            this.initialLoad = true;
            if (this._chatHistory.length) {
              this._chatHistory[0].opened = false;
            }
            else {
              this.keepLoading = false;
            }
          }
        }
        else {
          // Message loading Error
          this.initialLoadError = true;
          this.initialLoad = true;
          console.error('error loading message list');
        }
        this.messageLoading = false;
        // this.updateMessageLoading();
        this.cdr.detectChanges();
      },
      err => {
        console.error(err);
        this.initialLoadError = true;
        this.messageLoading = false;
        // this.updateMessageLoading();
        this.cdr.detectChanges();
      }
    )
  }

  formaMessageListData(response) {
    let chatHistory: SnapShot[] = [];
    if (response['data'].hasOwnProperty('snapshot')) {
      chatHistory = response['data']['snapshot'];
      chatHistory.forEach((item, index) => {

        if( item.chat ){
          item.chat._last_update = this.toUnix(item.chat.last_update);
          item.chat._received = this.toUnix(item.chat.received);
          item.chat._time = this.toUnix(item.chat.time);
        }
        
        item.subscription._last_update = this.toUnix(item.subscription.last_update);
        item.subscription._time = this.toUnix(item.subscription.time);
        item.currUser = item.subscribers.filter(subs => subs.user_id == item.subscription.user_id)[0];
        item.subscribers.forEach(sub => {
          if (sub.image_url && sub.image_url.startsWith('http')) {
            sub.image_url = sub.image_url.replace('http://', 'https://');
          }
        });
        if (item.subscribers.length > 2) {
          item.groupChat = true;
          item.otherUsers = item.subscribers.filter(subs => subs.user_id != item.subscription.user_id);
        }
        else {
          item.groupChat = false;
          item.otherUser = item.subscribers.filter(subs => subs.user_id != item.subscription.user_id)[0];
        }

        // attachment processing
        if( item.chat ){
          if (item.chat.type == 3) this.processAttachment(chatHistory, index);
          else if (item.chat.type == 2) chatHistory[index].chat.message = JSON.parse(chatHistory[index].chat.message)['agenda'];
          this.msgIdSet.add(item.chat.message_id);
        }
        
      })

      for(let i = chatHistory.length-1; i >= 0; i--){
        if( chatHistory[i].chat ){
          this._time = chatHistory[i].chat._time - 1;
          break;
        }
      }

    }
    return chatHistory;
  }


  processMessage(data: SnapShot[]) {
    if (this._chatHistory.length) {
      if (data.length < this._count) {
        this.loadMore = false;
      }

      const toRemove = [];
      data.forEach((snap, idx) => {
        if (this.topicIDSet.has(snap.topic.topic_id)) {
          const existingIdx = _.findIndex(this._chatHistory, ['topic.topic_id', snap.topic.topic_id]);

          if( snap.chat && this._chatHistory[existingIdx].chat){
            if (snap.chat.message_id == this._chatHistory[existingIdx].chat.message_id) {
              toRemove.push(idx);
            }
            else if (snap.chat._time > this._chatHistory[existingIdx].chat._time) {
              this._chatHistory.splice(existingIdx, 1);
            }
            else if (snap.chat._time < this._chatHistory[existingIdx].chat._time) {
              toRemove.push(idx);
            }
          }
          
        }
        else { this.topicIDSet.add(snap.topic.topic_id); }
      })

      _.pullAt(data, toRemove);

      this._chatHistory.push(...data);
      this.cdr.detectChanges();
    }
    else {
      data.forEach(snap => this.topicIDSet.add(snap.topic.topic_id));
      this._chatHistory = data;
      this.cdr.detectChanges()
    }
  }


  toUnix(dateString) {
    return moment(dateString).valueOf();
  }


  toggleActive(idx) {
    this.groupChatOpened = false;
    this._chatHistory.forEach((item, index) => {
      item.opened = index == idx;
    });

    if( this._chatHistory[idx].chat ){
      this._chatHistory[idx].chat.unread = 0;
    }

    this.chatToggled.emit({
      id: this._chatHistory[idx].topic.topic_id,
      displayName: this._chatHistory[idx].otherUser.name
    });
    this.cdr.detectChanges();
  }


  processAttachment(chatHistory: SnapShot[], idx) {

    const attachment: Attachment = JSON.parse(chatHistory[idx].chat.message);

    switch (attachment.media_type) {
      case 577:
        chatHistory[idx].chat.message = 'Photo';
        break;
      case 569:
        chatHistory[idx].chat.message = 'Video';
        break;
      default:
        chatHistory[idx].chat.message = attachment.title;
        break;
    }
  }

  processNewMessage(message) {
    if (message.chat.type == 3) {
      const attachment: Attachment = JSON.parse(message.chat.message);

      switch (attachment.media_type) {
        case 577:
          message.chat.message = 'Photo';
          break;
        case 569:
          message.chat.message = 'Video';
          break;
        default:
          message.chat.message = attachment.title;
          break;
      }
    }
    else if (message.chat.type == 2) {
      message.chat.message = JSON.parse(message.chat.message)['agenda'];
    }

    let temp = {
      otherUser: {
        name: message.chat.sender.name,
        user_id: message.chat.sender.user_id
      },
      chat: {
        message: message.chat.message,
        message_id: message.chat.message_id,
        _time: this.toUnix(message.chat.time),
        type: message.chat.type,
        topic_id: message.chat.topic.topic_id
      },
      opened: false,
      groupChat: false,
      topic: { ...message.chat.topic }
    }

    return temp;
  }


  /**
   * on new message reception
   */
  onMessage(_message) {
    /**
     * remove reference (deep copy)
     */
    const message = JSON.parse(JSON.stringify(_message));
    /**
     * process new message into a topic
     */
    const temp: any = this.processNewMessage(message);

    /**
     * topic already exist in message list
     */
    if (this.topicIDSet.has(message.chat.topic.topic_id)) {
      /**
       * find index at which topic is present
       */
      const idx = _.findIndex(this._chatHistory, ['topic.topic_id', temp.topic.topic_id]);
      const topic = this._chatHistory[idx];

      /**
       * remove it from there
       */
      this._chatHistory.splice(idx, 1);

      /**
       * update topic data as per latest message
       */
      if( topic.chat._time < temp.chat._time ){
        topic.chat = { ...topic.chat, ...temp.chat };
      }
      else{
        topic.chat = { ...temp.chat, ...topic.chat };
      }

      /**
       * if topic is not opened update the unread count
       */
      if (!topic.opened && !this.msgIdSet.has(temp.chat.message_id)){
        topic.chat.unread += 1;
        this.pushNotification.playSound();
        this.msgIdSet.add(temp.chat.message_id);
      }

      /**
       * push topic to top
       */
      this._chatHistory.unshift(topic);
      this.cdr.markForCheck()
    }
    else {
      /**
       * when new message do not belong to any topic in message list or message list empty
       * if message list is not empty add unread count to topic
       */
      if (this._chatHistory.length) {
        temp.chat['unread'] = 1;
      } else {
        /**
         * if message list is empty open the newly received message body
         */
        temp.opened = true;
      }

      this.pushNotification.playSound();

      /**
       * push new topic to the top
       */
      this._chatHistory.unshift(temp);
      this.topicIDSet.add(temp.chat.topic_id);
      this.msgIdSet.add(temp.chat.message_id);

      /**
       * open this message if this is the only message in the list
       */
      if (this._chatHistory.length == 1) this.toggleActive(0);
      this.cdr.detectChanges();
    }


  }

  openGroupChat(){
    this.groupChatOpened = true;
    this._chatHistory.forEach((item, index) => {
      item.opened = false;
    });
    this.chatToggled.emit({groupChat: true});
    this.cdr.detectChanges();
  }


  ngOnDestroy(){

    if( this.msgListener ){
      this.msgListener.unsubscribe();
    }
    
  }

}
