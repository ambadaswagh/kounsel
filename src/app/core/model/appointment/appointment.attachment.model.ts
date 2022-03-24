import { Appointment } from './appointment.model';

export interface AppointmentAttachmentResp {
	code: number;
	message: string;
	meta: Meta;
	data: Appointment;
}

export interface Meta {
	result: number;
	version: string;
	resource: string;
}
