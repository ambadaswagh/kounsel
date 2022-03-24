import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentComponent } from './appointment.component';
import { AppointmentRoutingModule } from './appointment-routing.module';

import { MatInputModule } from '@angular/material';
import { MatSelectModule } from '@angular/material/select';
import { AppointmentService } from '../../../core/services/general/appointment/appointment.service';
import { AppointmentDetailsComponent } from './details/details.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';

import { CreateAppointmentComponent } from "./create-appointment/create-appointment.component";
import { BookAppointmentComponent } from "./book-appointment/book-appointment.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatRadioModule, MatProgressSpinnerModule, MatSliderModule, MatIconModule } from "@angular/material";
import { NgxCurrencyModule } from 'ngx-currency';
import { TranslateModule } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { PartialsModule } from '../../partials/partials.module';
@NgModule({
  declarations: [
		AppointmentComponent,
		 AppointmentDetailsComponent, 
		 CreateAppointmentComponent,
		 BookAppointmentComponent
	],
  providers: [AppointmentService],
  imports: [
	MatInputModule,
	MatSelectModule,
	PerfectScrollbarModule,
	CommonModule,
	PartialsModule,
	AppointmentRoutingModule,
	FormsModule,
	ReactiveFormsModule,
	MatRadioModule,
	MatProgressSpinnerModule,
	MatSliderModule,
	MatIconModule,
	NgxCurrencyModule,
	TranslateModule.forChild(),
	MatTooltipModule,
	MatDatepickerModule
  ]
})
export class AppointmentModule { }
