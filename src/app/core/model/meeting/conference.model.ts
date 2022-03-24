import { PaymentMethod } from '../paymentMethod.model';
import { PaymentStatus } from '../paymentStatus.model';
import { RestBoolean } from '../restBoolean.model';
import { BillingType } from './billing.model';
import { ParticipantType } from './Participant.model';

export interface ConferenceMetaData {
    "meeting"?: {
        "meeting_id": string,
        "room_id": string,
        "topic_id": string,
        "waiting_room_id": string,
        "participant"?: {
            "payment_method_verified": number,
            "name": string,
            "email": string,
            "image_url": string
            "access": {
                "name"?: string,
                "created": string, // "2020-08-22T17:09:49.144Z"
                "expires": string,
                "client": ParticipantType,
                "access_id": string,
                "meeting_id": string,
                "aws_attendee_details": string | AwsAttendeeDetails,
            },
            "counselor": RestBoolean
        },
        "aws_meeting_details": string | AwsMeetingDetails,
        
    },
    "join": RestBoolean,
    "payment": {
        "amount": number,
        "billing_type": BillingType,
        "payment_method": PaymentMethod,
        "payment_status": PaymentStatus,
    },
    "login_required"?: RestBoolean,
    "access_code"?: string
}

export interface AwsAttendeeDetails{
    AttendeeId?: string,
    ExternalUserId?: string,
    JoinToken?: string
}

export interface AwsMeetingDetails{
    ExternalMeetingId?: string,
    MediaRegion?: string,
    MeetingId?: string,
    MediaPlacement?: {
        AudioFallbackUrl?: string,
        AudioHostUrl?: string,
        SignalingUrl?: string,
        TurnControlUrl?: string
    }
}