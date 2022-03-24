import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FirebaseAuthGuard } from '../../../core/guards/firebase-auth.guard';
import { AppointmentComponent } from './appointment.component';
import { BookAppointmentComponent } from './book-appointment/book-appointment.component';
import { CreateAppointmentComponent } from './create-appointment/create-appointment.component';


const routes: Routes = [
  { 
    path: '', 
    canActivate: [FirebaseAuthGuard],
    component: AppointmentComponent 
  },
  { 
    path: 'book', 
    canActivate: [FirebaseAuthGuard],
    component: AppointmentComponent 
  },
  { 
    path: 'create', 
    canActivate: [FirebaseAuthGuard],
    component: CreateAppointmentComponent 
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppointmentRoutingModule { }
