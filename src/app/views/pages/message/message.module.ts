import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MessageRoutingModule } from './message-routing.module';
import { MessageComponent } from './message.component';
import { MessageListComponent } from './message-list/message-list.component';
import { ChatBoxComponent } from './chat-box/chat-box.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { FormsModule } from '@angular/forms';
import { MessageListLimitPipe } from './pipes/message-list-limit.pipe';
import { VedioPlayerComponent } from './vedio-player/vedio-player.component'
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule, MatProgressSpinnerModule, MatTooltipModule } from '@angular/material';
import { FileUploadAreaComponent } from './file-upload-area/file-upload-area.component';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { NameTrimPipe } from './pipes/name-trim.pipe';
import { MessageListPipe } from './pipes/message-list.pipe';
import { FileDropAreaComponent } from './file-drop-area/file-drop-area.component';
import { CloudSelectionSidebarComponent } from './cloud-selection-sidebar/cloud-selection-sidebar.component';
import { TranslateModule } from '@ngx-translate/core';


@NgModule({
  declarations: [MessageComponent, MessageListComponent, ChatBoxComponent, MessageListLimitPipe, VedioPlayerComponent, FileUploadAreaComponent, NameTrimPipe, MessageListPipe, FileDropAreaComponent, CloudSelectionSidebarComponent],
  imports: [
    CommonModule,
    MessageRoutingModule,
    PerfectScrollbarModule,
    FormsModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    NgxDropzoneModule,
    MatCheckboxModule,
    MatTooltipModule,
    TranslateModule.forChild()
  ],
  providers: [
    MessageListLimitPipe
  ]
})
export class MessageModule { }
