import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MeetingComponent } from './meeting.component';
import { ConferenceHomeComponent } from './conference/conference-home/conference-home.component';
import { ConferenceAuthGuard } from '../../../core/guards/conference-auth.guard'
import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';

const routes: Routes = [
  { 
    path: '', 
    canActivate: [FirebaseAuthGuard],
    component: MeetingComponent 
  },
  { 
    path: 'conference', 
    canActivate: [ConferenceAuthGuard],
    component: ConferenceHomeComponent 
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MeetingRoutingModule { }
