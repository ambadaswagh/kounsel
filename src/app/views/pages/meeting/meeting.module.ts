import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { MeetingRoutingModule } from "./meeting-routing.module";
import { MeetingComponent } from "./meeting.component";
import { JoinMeetingComponent } from "./join-meeting/join-meeting.component";
import { RoomDetailsComponent } from "./room-details/room-details.component";
import { AddParticipantComponent } from "./add-participant/add-participant.component";
import { BillingMethodComponent } from "./billing-method/billing-method.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ParticipantDetailComponent } from "./participant-detail/participant-detail.component";
import { PerfectScrollbarModule } from "ngx-perfect-scrollbar";
import { MatRadioModule, MatProgressSpinnerModule, MatSliderModule, MatIconModule } from "@angular/material";
import { ConferenceHomeComponent } from "./conference/conference-home/conference-home.component";
import { ConferenceControlPanelComponent } from "./conference/conference-control-panel/conference-control-panel.component";
import { GridComponent } from "./conference/grid/grid.component";
import { WaitingListComponent } from "./conference/waiting-list/waiting-list.component";
import { ClickOutsideModule } from 'ng-click-outside';
import { ChatComponent } from './conference/chat/chat.component';
import { ChatSnapshotComponent } from './conference/chat-snapshot/chat-snapshot.component';
import { ChatBoxComponent } from './conference/chat-box/chat-box.component';
import { VideoPlayerComponent } from './conference/chatHelperComponents/video-player/video-player.component';
import { FileUploadAreaComponent } from './conference/chatHelperComponents/file-upload-area/file-upload-area.component';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { CostComponent } from './conference/payment/cost/cost.component';
import { AddPaymentMethodComponent } from './conference/payment/add-payment-method/add-payment-method.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { AddNameComponent } from './conference/add-name/add-name.component';
import { NgxCurrencyModule } from 'ngx-currency';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [
    MeetingComponent,
    JoinMeetingComponent,
    RoomDetailsComponent,
    AddParticipantComponent,
    BillingMethodComponent,
    ParticipantDetailComponent,
    ConferenceHomeComponent,
    ConferenceControlPanelComponent,
    GridComponent,
    WaitingListComponent,
    ChatComponent,
    ChatSnapshotComponent,
    ChatBoxComponent,
    VideoPlayerComponent,
    FileUploadAreaComponent,
    CostComponent,
    AddPaymentMethodComponent,
    AddNameComponent,
  ],
  imports: [
    CommonModule,
    MeetingRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    PerfectScrollbarModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    ClickOutsideModule,
    MatSliderModule,
    NgxDropzoneModule,
    MatIconModule,
    NgSelectModule,
    NgxCurrencyModule,
    TranslateModule.forChild(),
    MatTooltipModule
  ],
})
export class MeetingModule {}
