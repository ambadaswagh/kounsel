import { RestBoolean } from '../restBoolean.model';
import { Profile, Attachment } from '../profile/profile.model';

export interface AppointmentGETResponse {
		code: number;
		message: string;
		meta: Meta;
		data: Data;
	}
export interface Data {
		appointments: Appointment[];
	}

export interface Host {
		user_id: string;
		name: string;
		email: string;
		crud: number;
		account_status: number;
		phone_verified: number;
		email_verified: number;
		bank_verified: number;
		payment_method_verified: number;
		time: string;
		legal_user_agreement: string;
		legal_privacy_policy: string;
		legal_confidentiality_agreement: string;
		legal_escrow_agreement: string;
		legal_ach_fees_agreement: string;
	}

export interface Meta {
		result: number;
		version: string;
		resource: string;
	}

export interface Appointment {
	aws_appointment_details?: any;
	crud?: number;
	last_update?: number;
	appointment_id?: any;
	room_id?: string;
	toc?: number;
	code?: string;
	start: any;
	end: any;
	status?: number;
	agenda?: string;
	service_provider_id?: string;
	host_id?: string;
	earnings?: number;
	attachment?: number;
	payment_status?: number;
	refund_status?: number;
	service_provider?: Profile;
	attachments?: Attachment[];
	host?: Account;
	by?: any;
	tz?: any;
	user?: any;
}
