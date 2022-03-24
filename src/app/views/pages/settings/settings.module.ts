import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsComponent } from './settings.component';
import { MessageComponent } from './message/message.component';
import { CounselingSessionComponent } from './counseling-session/counseling-session.component';
import { SearchVisibilityComponent } from './search-visibility/search-visibility.component';
import { NotificationComponent } from './notification/notification.component';
import { EmailComponent } from './email/email.component';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';


@NgModule({
  declarations: [SettingsComponent, MessageComponent, CounselingSessionComponent, SearchVisibilityComponent, NotificationComponent, EmailComponent],
  imports: [
    CommonModule,
    SettingsRoutingModule,
    FormsModule,
    MatRadioModule
  ]
})
export class SettingsModule { }
