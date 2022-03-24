import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  HostListener,
  ChangeDetectorRef,
  SimpleChanges,
} from "@angular/core";
import { Conversation, ConversationType } from "../../../../../core/model/general/message/conversation.model";
import { TopicSubscriber } from "../../../../../core/model/general/message/topicSubscriber.model";
import { Subscription } from "rxjs";
import { Topic } from "../../../../../core/model/general/message/topic.model";
import { FireBaseUserService } from "../../../../../core/services/user/fire-base-user.service";
import { DomSanitizer } from "@angular/platform-browser";
import { IconService } from "../../../../../core/services/utility/icon.service";
import { FirebaseUtility } from "../../../../../core/services/firebase/firebase.service";
import { PushNotificationService } from "../../../../../core/services/pushNotification/push-notification.service";
import { MessageService } from "../../../../../core/services/general/message/message.service";
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import moment from 'moment';
declare var $: any;
import { v4 as uuid } from 'uuid';
import * as lodash from 'lodash';
import * as moment_tz from 'moment-timezone';
import { TranslateService } from '@ngx-translate/core';
import { ConferenceService } from "../../../../../core/services/general/meeting/conference.service";

export interface ConversationResponse {
  conversation: Conversation[];
  subscribers: TopicSubscriber[];
  topic: Topic;
}

@Component({
  selector: "kt-chat-box",
  templateUrl: "./chat-box.component.html",
  styleUrls: ["./chat-box.component.scss"],
})
export class ChatBoxComponent implements OnInit {
  @Input() activeChat;
  @ViewChild("text_box_editor") text_box_editor: ElementRef;
  @Output() messageSent = new EventEmitter<any>();
  @Output() closeChat = new EventEmitter<any>();
  chatTitle = "";
  chatUserName = "";
  location = "";

  innerWidth = 0;
  @HostListener("window:resize", ["$event"])
  onResize(event) {
    this.innerWidth = window.innerWidth;
  }

  // chat controls
  chatId = "";
  chat: (Conversation & { [key:string]: any } )[] = [];
  _time = new Date().getTime();
  _count = 30;
  currentUser: TopicSubscriber;
  otherUser: TopicSubscriber;
  otherUsers: TopicSubscriber[] = [];
  userToImgMap = {};
  loadingChat = false;
  chatToLoad = true;
  chatLoadSubscription: Subscription;

  //scrollbars event
  // scrollToTop = new ReplaySubject();
  // scrollToTopEvent = this.scrollToTop.asObservable();

  // textArea Controls
  currentMessage = "";
  typing = false;
  currentPlayer;
  currentAudioPlayer;

  // user locations
  userLocations = {};
  userLocationsFireStorePath = "/app/presences/users/";

  // chat container
  @ViewChild("chatContainer")
  chatContainer: PerfectScrollbarComponent;

  // subs sink
  subscriptionSink: Subscription[] = [];

  // topic
  topic: Topic;
  messageSendFireStorePath = "/app/chat/buffers";
  chatIdSet = new Set();

  // is Group chat
  groupChat = false;
  groupChatSubscription: Subscription;

  constructor(
    private messageService: MessageService,
    private userService: FireBaseUserService,
    private cdr: ChangeDetectorRef,
    public sanitizer: DomSanitizer,
    public iconService: IconService,
    public fireBaseUtility: FirebaseUtility,
    private pushNotification: PushNotificationService,
    public translateService: TranslateService,
    private conference: ConferenceService
  ) {}

  ngOnInit() {

    if( this.activeChat.groupChat ){
      this.groupChat = true;
      this.groupChatSubscription = this.conference.$groupChatObserver.subscribe((data)=>{
        data.subscribers.forEach((item)=>{
          item.img = item.image_url;
          this.userToImgMap[item.user_id] = item;
        })
        this.chat = data.conversation;
        if( this.chatContainer ){
          setTimeout(() => {
            this.chatContainer.directiveRef.scrollToBottom();
          }, 0);
        }
        this.cdr.detectChanges();
      })
    }

    this.innerWidth = window.innerWidth;
    let locationSubs = this.userService.getLocation().subscribe((location) => {
      if (location.city) {
        this.location = location.city;
      }
    }, console.error);

    this.subscriptionSink.push(locationSubs);
    
  }

  getTime() {
    return new Date();
  }

  taFocus(el: any) {
    el.focus();
    this.typing = true;
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.activeChat.currentValue && !changes.activeChat.currentValue.groupChat){
      if (changes.activeChat.currentValue.id) {
        if ( !changes.activeChat.previousValue || (changes.activeChat.currentValue.id != changes.activeChat.previousValue.id) ) {
          this.initChat();
          this.chatId = changes.activeChat.currentValue.id;
          this.topic = { topic_id: this.chatId };
          this.loadChat(true);
          this.chatTitle = changes.activeChat.currentValue.displayName;
          this.userLocations = {};
          this.cdr.detectChanges();
        }
      }
    }
  }

  startListeningForMessages() {
    /**
     * new message listener
     */
    this.subscriptionSink.push(
      this.pushNotification.Message.subscribe(
        (newMessage) => this.onMessage(newMessage),
        console.error
      )
    );
  }

  async loadChat(initialize = false) {
    try {
      if (this.loadingChat || !this.chatToLoad || this.chatId == "") {
        return;
      }
      // alert('loading Data');
      this.loadingChat = true;
      this.cdr.detectChanges();
      const c_id = this.chatId;
      let response = await this.messageService
        .getConversation(this._time, this._count.toString(), this.chatId)
        .toPromise();

      if (c_id != this.chatId) {
        return;
      }

      if (response.code == 200 || response.code == 201) {
        let data: ConversationResponse = response["data"];
        this.setSubscribers(data.subscribers);
        if (initialize) {
          this.formatChatData(true, data.conversation);
          setTimeout(() => {
            this.chatContainer.directiveRef.scrollToBottom();
          }, 0);
          this.startListeningForMessages();
        } else {
          this.formatChatData(false, data.conversation);
        }
        this.topic = data.topic;
        this.cdr.detectChanges();
      } else {
        throw new Error(response);
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingChat = false;
      this.cdr.detectChanges();
    }
  }

  formatChatData(initialize = false, response: Conversation[]) {
    let data: Conversation[] = response;
    data.forEach((conversation) => {
      this.processConversation(conversation);
    });

    data = data.filter((conversation) =>
      conversation.type == 3 ? conversation.attachment.crud != 3 : true
    );

    data.sort((a, b) => {
      return a._time - b._time;
    });

    if (initialize) {
      this.chat = data;
    } else {
      this.chat.unshift(...data);
      this.cdr.detectChanges();
      this.chatContainer.directiveRef.scrollToElement(
        "#msg-" + (data.length - 3)
      );
    }

    if (data.length < this._count) {
      this.chatToLoad = false;
    }

    this._time = data.length ? data[0]._time - 1 : new Date().getTime();
    console.log(data);
  }

  processConversation(conversation) {
    conversation._last_update = this.toUnix(conversation.last_update);
    conversation._time = this.toUnix(conversation.time);
    this.chatIdSet.add(conversation.message_id);
    if (conversation.type == 3) {
      this.formatAttachment(conversation);
    }

    // if (conversation.type == 5) {
    //   conversation.formattedMessage = this.detectURLBreakString(conversation.message);
    // }

    if (conversation.type == 2) {
      conversation.event = this.formatEvent(conversation);
    }
  }

  setSubscribers(data: TopicSubscriber[], fromPush = false) {
    for (let subs of data) {
      if (subs.user_id == this.userService.userId) {
        this.currentUser = subs;
      } else {
        this.otherUser = subs;
        this.otherUsers.push(subs);
      }

      if (!fromPush) {
        if (subs.image_url && subs.image_url.startsWith("http")) {
          subs.image_url = subs.image_url.replace("http://", "https://");
        }

        this.userToImgMap[subs.user_id] = {
          img: subs.image_url,
          name: subs.name,
        };
      }
    }
    this.updateUserLocations();
  }

  toUnix(dateString) {
    return moment(dateString).valueOf();
  }

  dayDifference(t1: number, t2: number) {
    const date1: any = new Date(t1).setHours(0, 0, 0, 0);
    const date2: any = new Date(t2).setHours(0, 0, 0, 0);
    const diffTime = Math.abs(date2 - date1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  ifToday(t: number) {
    const todaysDate = new Date();
    const inputDate = new Date(t);
    return inputDate.setHours(0, 0, 0, 0) == todaysDate.setHours(0, 0, 0, 0);
  }

  initChat() {
    this.chat.forEach((item) => {
      if (item.attachment && item.attachment.audio_link) {
        item.attachment.audio_link.pause();
      }
    });
    this.chat = [];
    this._time = new Date().getTime();
    this._count = 30;
    this.currentUser = undefined;
    this.otherUser = undefined;
    this.otherUsers = [];
    this.loadingChat = false;
    this.chatToLoad = true;
    if( this.text_box_editor ){
      this.text_box_editor.nativeElement.innerText = "";
    }
    this.currentMessage = "";
  }

  withinMinute(t1: number, t2: number) {
    let m1 = new Date(t1).getMinutes();
    let m2 = new Date(t2).getMinutes();
    return 60000 >= Math.abs(t1 - t2) && m1 == m2;
  }

  formatAttachment(conversation: Conversation) {
    conversation.attachment = JSON.parse(conversation.message);

    if (conversation.attachment.crud == 3) return;

    if (
      conversation.attachment.original &&
      conversation.attachment.original.startsWith("http")
    ) {
      conversation.attachment.original = conversation.attachment.original.replace(
        "http://",
        "https://"
      );
    }

    if (conversation.attachment.media_type == 593) {
      conversation.attachment.youtube_embed = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube.com/embed/${conversation.attachment.youtube_id}?enablejsapi=1`
      );
      conversation.attachment.youtube_link = this.sanitizer.bypassSecurityTrustUrl(
        `https://www.youtube.com/watch?v=${conversation.attachment.youtube_id}`
      );
    } else if (conversation.attachment.media_type == 587) {
      conversation.attachment.audio_link = new Audio(
        conversation.attachment.original
      );
      conversation.attachment.audio_link["audio_meta"] = {
        played: 0,
      };

      conversation.attachment.audio_link.addEventListener(
        "loadedmetadata",
        ($event) => {
          if (this.cdr) {
            this.cdr.detectChanges();
          }
          conversation.attachment.audio_link.removeEventListener(
            "loadedmetadata",
            () => {}
          );
        }
      );
    } else if (conversation.attachment.media_type == 569) {
      conversation.attachment["sources"] = [];

      if (conversation.attachment.hasOwnProperty("hls_3")) {
        if (conversation.attachment.hls_3.startsWith("http")) {
          conversation.attachment.hls_3 = conversation.attachment.hls_3.replace(
            "http://",
            "https://"
          );
        }
        conversation.attachment["sources"].push({
          src: conversation.attachment.hls_3,
          type: "application/x-mpegURL",
        });
      }

      conversation.attachment["sources"].push({
        src: conversation.attachment.original,
        type: conversation.attachment.mime_type,
      });
    }
  }

  scrollTopEventHandel(_ev) {
    if (!this.loadingChat && this.chatToLoad) {
      this.loadChat();
    }
  }

  // detectURLBreakString(str: string) {
  //   const _regexp = new RegExp(/(?:(?:https?|ftp):\/\/|\b(?:[a-z\d]+\.))(?:(?:[^\s()<>]+|\((?:[^\s()<>]+|(?:\([^\s()<>]+\)))?\))+(?:\((?:[^\s()<>]+|(?:\(?:[^\s()<>]+\)))?\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))?/g);
  //   let matches: any = str.match(_regexp);
  //   if (!matches || !matches.length) {
  //     matches = [];
  //   }

  //   matches = matches.map(item => ({ index: str.indexOf(item), value: item }));
  //   let retData: StringList[] = [];

  //   let prevIndex = 0;

  //   for (let stringMatch of matches) {
  //     let newString = str.substring(prevIndex, stringMatch.index);
  //     if (newString.length) {
  //       retData.push({
  //         isLink: false,
  //         value: newString
  //       })
  //     }

  //     retData.push({
  //       isLink: true,
  //       value: stringMatch.value,
  //       link: this.sanitizer.bypassSecurityTrustUrl(stringMatch.value)
  //     });

  //     prevIndex = stringMatch.index + stringMatch.value.length;
  //   }

  //   if (prevIndex <= str.length - 1) {
  //     retData.push({
  //       value: str.substring(prevIndex, str.length),
  //       isLink: false
  //     })
  //   }

  //   return retData;
  // }

  bytesToBigUnits(a, b = 2) {
    if (0 === a) return "0 Bytes";
    const c = 0 > b ? 0 : b,
      d = Math.floor(Math.log(a) / Math.log(1024));
    return (
      parseFloat((a / Math.pow(1024, d)).toFixed(c)) +
      " " +
      ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d]
    );
  }

  playAudio(audioElement: HTMLAudioElement) {
    if (this.currentAudioPlayer) {
      this.currentAudioPlayer.pause();
      clearInterval(this.currentAudioPlayer["audio_meta"]["update"]);
    }
    this.currentAudioPlayer = audioElement;
    audioElement.play();
    audioElement["audio_meta"]["update"] = setInterval(() => {
      audioElement["audio_meta"]["played"] = Math.ceil(
        (audioElement.currentTime / audioElement.duration) * 100
      );
      // audioElement['audio_meta']['remaining'] = 100 - audioElement['audio_meta']['played'];
      if (audioElement.currentTime == audioElement.duration) {
        clearInterval(audioElement["audio_meta"]["update"]);
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  pauseAudio(audioElement: HTMLAudioElement) {
    audioElement.pause();
    clearInterval(audioElement["audio_meta"]["update"]);
  }

  str_pad_left(string, pad, length) {
    return (new Array(length + 1).join(pad) + string).slice(-length);
  }

  toMinutes(val: number) {
    val = Math.round(val);
    let minutes = Math.floor(val / 60);
    let seconds = val - minutes * 60;
    return (
      this.str_pad_left(minutes, "0", 2) +
      ":" +
      this.str_pad_left(seconds, "0", 2)
    );
  }

  formatEvent(conversation: Conversation) {
    const event = JSON.parse(conversation.message);
    event["start"] = this.toUnix(event["start"]);
    event["end"] = this.toUnix(event["end"]);
    if (typeof event["host"] == "string") {
      event["host"] = JSON.parse(event["host"]);
    }

    if (typeof event["service_provider"] == "string") {
      event["service_provider"] = JSON.parse(event["service_provider"]);
    }

    event["approxCost"] =
      (event.service_provider.rate / 100) *
      ((event["end"] - event["start"]) / 60000);
    return event;
  }

  currentlyActiveEvent(start, end) {
    let now = this.getTime().getTime();
    if (start <= now && end > now) return true;
    return false;
  }

  dueIn(start: number) {
    let now = this.getTime().getTime();
    if (start < now) return;
    let days = this.dayDifference(now, start);
    if (days > 0) return days == 1 ? "1 Day" : days + " Days";
    let hours = this.hoursDifference(now, start);
    if (hours >= 1) return hours == 1 ? "1 Hour" : hours + " Hours";
    let minute = this.minuteDifference(start, now);
    return minute + " Minutes";
  }

  hoursDifference(t1: number, t2: number) {
    let hd = Math.abs((t1 - t2) / 3600000);
    hd = hd >= 1 ? Math.round(hd) : hd;
    return hd;
  }

  minuteDifference(t1: number, t2: number) {
    return Math.round(Math.abs((t1 - t2) / 60000));
  }

  stopOtherVideos(_event) {
    if (this.currentPlayer != undefined) {
      if (this.currentPlayer.attachment_id != _event.attachment_id) {
        this.currentPlayer.player.pause();
      }
    }
    this.currentPlayer = _event;
  }

  openImage(id) {
    $(`#${id}`).modal("show");
    this.cdr.detectChanges();
  }

  seekAudioTo(audioElement: HTMLAudioElement, audioMeta: any, percent: number) {
    let seekToTime = (percent * audioElement.duration) / 100;
    audioElement.currentTime = seekToTime;
  }

  //  ************* chat sending section starts ******************* //

  getChatUUID() {
    return `CHAT-${uuid()}`;
  }

  getSender() {
    let sender = {
      user_id: this.currentUser.user_id,
      name: this.currentUser.name ? this.currentUser.name : "",
    };
    return sender;
  }

  getFormattedTime() {
    let temp = moment();
    let isoTime = temp.toISOString();
    return isoTime.split(".")[0] + "-0000";
  }

  getTopic() {
    return {
      name: this.topic.name ? this.topic.name : "",
      topic_id: this.topic.topic_id,
    };
  }

  getChatObjectForText() {
    const chatId = this.getChatUUID();

    const chatFireBaseObj = {
      chat: {
        message: this.currentMessage,
        type: ConversationType.TEXT,
        message_id: chatId,
        root_id: chatId,
        root: 10,
        sender: this.getSender(),
        time: this.getFormattedTime(),
        topic: this.getTopic(),
      },
      sender: this.userService.userId,
      receiver: this.otherUser? this.otherUser.user_id: this.userService.userId,
    };

    const toChat: Conversation = {};
    toChat.message = chatFireBaseObj.chat.message;
    toChat.time = chatFireBaseObj.chat.time;
    toChat._time = this.toUnix(toChat.time);
    toChat.type = chatFireBaseObj.chat.type;
    toChat.sender = chatFireBaseObj.chat.sender.user_id;
    // toChat.formattedMessage = this.detectURLBreakString(toChat.message);

    return { chatFireBaseObj, toChat };
  }

  async sendTextMessage() {
    try {
      
      this.currentMessage = this.text_box_editor.nativeElement.innerText;
      this.currentMessage = this.currentMessage.trim();
      if (!this.currentMessage) return;

      if( this.groupChat ){
        this.conference.addGroupChatMessage(this.currentMessage);
        this.text_box_editor.nativeElement.innerText = "";
        if( this.chatContainer ){
          setTimeout(() => {
            this.chatContainer.directiveRef.scrollToBottom();
          }, 0);
        }
        this.cdr.detectChanges();
        return;
      }

      let chatObj = this.getChatObjectForText();

      /**
       * set image and name if not present
       */
      if (
        !this.userToImgMap.hasOwnProperty(
          chatObj.chatFireBaseObj.chat.sender.user_id
        )
      ) {
        this.userToImgMap[chatObj.chatFireBaseObj.chat.sender.user_id] = {
          img: undefined,
          name: chatObj.chatFireBaseObj.chat.sender.name,
        };
      }

      this.text_box_editor.nativeElement.innerText = "";
      // text_box_editor.innerText = ''
      this.chat.push(chatObj.toChat);
      setTimeout(() => {
        this.chatContainer.directiveRef.scrollToBottom();
      }, 0);
      this.cdr.detectChanges();
      this.chatIdSet.add(chatObj.chatFireBaseObj.chat.message_id);
      await this.fireBaseUtility.addDataToCollection(
        this.messageSendFireStorePath,
        chatObj.chatFireBaseObj
      );

      console.log('Reached till emiting')

      this.messageSent.emit({
        topic_id: chatObj.chatFireBaseObj.chat.topic.topic_id,
        message: chatObj.chatFireBaseObj.chat.message,
        message_id: chatObj.chatFireBaseObj.chat.message_id,
        _time: chatObj.toChat._time,
      });

      this.currentMessage = "";
      this.cdr.detectChanges();
    } catch (error) {
      console.log(error);
    }
  }

  openUploadModal() {
    $("#messageFileSendModal").modal({
      backdrop: "static",
      keyboard: false,
    });
    $("#messageFileSendModal").modal("show");
    console.log($("#messageFileSendModal"))
    this.cdr.detectChanges();
  }

  closeUploadModal() {
    $("#messageFileSendModal").modal("hide");
    this.cdr.detectChanges();
  }

  // on component destruction
  ngOnDestroy() {
    this.subscriptionSink.forEach((subs) => subs.unsubscribe());
    this.chat.forEach((item) => {
      if (item.type == 3) {
        if (item.attachment.media_type == 587) {
          item.attachment.audio_link.pause();
          clearInterval(item.attachment.audio_link["audio_meta"]["update"]);
        }
      }
    });

    if( this.groupChatSubscription ){
      this.groupChatSubscription.unsubscribe();
    }
  }

  attachmentUploaded(ev) {
    if (ev) {
      const conversation = { ...ev.chat };
      conversation.attachment = ev.attachment;

      if (conversation.attachment.media_type == 593) {
        conversation.attachment.youtube_embed = this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://www.youtube.com/embed/${conversation.attachment.youtube_id}?enablejsapi=1`
        );
        conversation.attachment.youtube_link = this.sanitizer.bypassSecurityTrustUrl(
          `https://www.youtube.com/watch?v=${conversation.attachment.youtube_id}`
        );
      } else if (conversation.attachment.media_type == 587) {
        conversation.attachment.audio_link = new Audio(
          conversation.attachment.original
        );
        conversation.attachment.audio_link["audio_meta"] = {
          played: 0,
        };

        conversation.attachment.audio_link.addEventListener(
          "loadedmetadata",
          ($event) => {
            if (this.cdr) {
              this.cdr.detectChanges();
            }
            conversation.attachment.audio_link.removeEventListener(
              "loadedmetadata",
              () => {}
            );
          }
        );
      } else if (conversation.attachment.media_type == 569) {
        conversation.attachment["sources"] = [];

        if (conversation.attachment.hasOwnProperty("hls_3")) {
          conversation.attachment["sources"].push({
            src: conversation.attachment.hls_3.replace("http://", "https://"),
            type: "application/x-mpegURL",
          });
        }

        conversation.attachment["sources"].push({
          src: conversation.attachment.original.replace("http://", "https://"),
          type: conversation.attachment.mime_type,
        });
      }

      conversation["_time"] = this.toUnix(conversation.time);

      this.chat.push(conversation);
      this.chatIdSet.add(conversation.message_id);

      let temp: any = {
        topic_id: this.topic.topic_id,
        message_id: conversation.message_id,
        _time: this.toUnix(conversation.time),
      };

      switch (conversation.attachment.media_type) {
        case 577:
          temp.message = "Photo";
          break;
        case 569:
          temp.message = "Video";
          break;
        default:
          temp.message = conversation.attachment.title;
          break;
      }
      this.messageSent.emit(temp);
      // scroll new message to view
      setTimeout(() => {
        this.chatContainer.directiveRef.scrollToBottom();
      }, 0);
    }
    this.closeUploadModal();
  }

  /**
   * new push message
   */
  async onMessage(data) {
    /**
     * parse incoming data to remove pointer reference
     */
    const conversation = JSON.parse(JSON.stringify(data.chat));

    /**
     * if message is not for this topic Ignore it
     * if this message is already revived Ignore it
     */
    if (
      conversation.topic.topic_id != this.topic.topic_id ||
      this.chatIdSet.has(conversation.message_id)
    )
      return;

    this.chatIdSet.add(conversation.message_id);

    /**
     * set image and name if not present
     */
    if (!this.userToImgMap.hasOwnProperty(conversation.sender.user_id)) {
      this.userToImgMap[conversation.sender.user_id] = {
        img: undefined,
        name: conversation.sender.name,
      };
    }

    /**
     * process conversation and attachment if Any
     */
    this.processConversation(conversation);
    this.setSubscribers([conversation.sender], true);
    conversation.sender = conversation.sender.user_id;

    /**
     * set current user if not set
     */
    if (!this.currentUser) {
      let temp: any = {
        user_id: this.userService.userId,
        name: await this.userService.UserNamePromise,
      };
      this.currentUser = temp;
    }

    /**
     * using binary search to find index
     * and inserting message in correct place
     */
    const idxToInsert = lodash.sortedIndexBy(this.chat, conversation, "_time");
    this.chat.splice(idxToInsert, 0, conversation);
    this.cdr.detectChanges();
    this.chatContainer.directiveRef.scrollToBottom();
    this.cdr.detectChanges();
  }

  setEndOfContentEditable() {
    let range, selection;
    let contentEditableElement = this.text_box_editor.nativeElement;
    if (document.createRange) {
      range = document.createRange();
      range.selectNodeContents(contentEditableElement);
      range.collapse(false);
      selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  textAreaEnterHandel(event) {
    if (event.keyCode == 13 && !event.shiftKey) {
      this.currentMessage = this.text_box_editor.nativeElement.innerText;
      setTimeout(() => {
        this.sendTextMessage();
      }, 0);
      return false;
    }
  }

  sendButtonEnable() {
    if (this.currentMessage.match(/^\s*$/)) {
      return false;
    }
    return true;
  }

  async updateUserLocations() {
    if (this.currentUser) {
      if (!this.userLocations.hasOwnProperty(this.currentUser.user_id)) {
        let data = await this.fireBaseUtility
          .getDocument(
            this.userLocationsFireStorePath + this.currentUser.user_id
          )
          .toPromise();
        console.log(data, this.currentUser.user_id);
        if (data) {
          this.userLocations[this.currentUser.user_id] = data;
        }
      }
    }

    for (let users of this.otherUsers) {
      if (!this.userLocations.hasOwnProperty(users.user_id)) {
        let data = await this.fireBaseUtility
          .getDocument(this.userLocationsFireStorePath + users.user_id)
          .toPromise();
        console.log(data, users.user_id);
        if (data) {
          this.userLocations[users.user_id] = data;
        }
      }
    }
    this.cdr.detectChanges();
  }

  getReceiverTimeString(userInfo) {
    const receiverTime = moment_tz().tz(userInfo.timezone);
    const senderTime = moment_tz();
    const senderDay = senderTime.date();
    const receiverDay = receiverTime.date();
    let suffix = "";

    if (senderDay == receiverDay) {
      suffix = "now";
    } else if (senderDay < receiverDay) {
      suffix = "tomorrow";
    } else if (senderDay > receiverDay) {
      suffix = "yesterday";
    }

    if (this.userLocations.hasOwnProperty(this.currentUser.user_id)) {
      const currUserInfo = this.userLocations[this.currentUser.user_id];
      if (currUserInfo.country == userInfo.country) {
        if (currUserInfo.state == userInfo.state) {
          if (currUserInfo.city == userInfo.city) {
            // same city
            return `${suffix} ${receiverTime.format("h:mm a")}`;
          }
          // Same state
          return `${userInfo.city} ${suffix} ${receiverTime.format("h:mm a")}`;
        }
        // Same country
        return `${userInfo.state} ${suffix} ${receiverTime.format("h:mm a")}`;
      }
    }
    // Different country
    return `${userInfo.country} ${suffix} ${receiverTime.format("h:mm a")}`;
  }
}
