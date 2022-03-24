import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'kt-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  chatBoxOpened = false;
  activeChat;
  chatIsOpened = false;
  newMessageFromMessageBox;
  constructor() { }

  ngOnInit() {
  }

  chatToggled(chatMeta){
    this.activeChat = chatMeta;
    this.chatIsOpened = true;
  }

  closeChat(){
    this.chatIsOpened = false;
  }

}
