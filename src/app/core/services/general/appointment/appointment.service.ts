import { Injectable } from '@angular/core';
import { BaseService } from '../../base/base.service';
import { Observable } from 'rxjs';
import {
	AppointmentGETResponse,
	Appointment
} from '../../../model/appointment/appointment.model';
import { AppointmentAttachmentResp } from '../../../model/appointment/appointment.attachment.model';
import { String } from 'aws-sdk/clients/lexmodelbuildingservice';
@Injectable({
	providedIn: 'root'
})
export class AppointmentService extends BaseService {
	personalRoomDetails: Appointment;
	counselor: number;
	participants: any[] = [];

	getAppointment(appointment: Appointment): Observable<AppointmentGETResponse> {
		return this.httpGetWithHeader(`appointment?by=${appointment.by}&start=${appointment.start}&end=${appointment.end}&tz=${appointment.tz}`);
	}

	getAttachments(appointmentId: string): Observable<AppointmentAttachmentResp> {
		return this.httpGetWithHeader(`appointment/event/${appointmentId}`);
	}
	
	createAppointment(username: String, payload): Observable<AppointmentGETResponse> {
		return this.httpPostWithHeaderV2(`appointment/${username}?notification=true`, payload)
	}
}
