import { RestBoolean } from '../restBoolean.model';
import { EquipmentStatus } from './equipmentStatus.model';
import { ParticipantType } from './Participant.model';

export interface meetingGETResponse {
    code?: number,
    data?: {
        meeting?: Meeting,
        counselor?: RestBoolean
    }
}

export interface ParticipantGETResponse {
    code?: number,
    data?: {
        participant: Participant[]
    }
}

export interface meetingAccessPOSTResponse {
    code?: number,
    data?: {
        meeting?: Access
    }
}

export interface Meeting {
    aws_meeting_details?: any,
    crud?: number,
    last_update?: number,
    meeting_id?: string,
    room_id?: string,
    toc?: number,
    code?: string
}

export interface Participant {
    access_id?: string,
    aws_attendee_details?: any,
    client?: number,
    crud?: number,
    expiration_date?: string, // "2020-09-09T04:13:31+0000"
    issue_date?: string | number,
    last_update?: number,
    meeting_id?: string,
    toc?: number,
    image_url?: string,
    name?: string,
    duration?: number,
    total_paid?: string,
    participant_type?: ParticipantType
}

export interface Access {
    access_code?: string,
    access_id?: string,
    expiration_date?: string,
    issue_date?: string,
    room_id?: string,
    participant_type?: any
}

export interface firebaseMeetingWaitingMetaData {
    "topic_id"?: string,
    "waiting_room_id"?: string,
    "participants"?: {
        [key: string]: fStoreParticipant
    }
}

export interface fStoreParticipant {
    "image_url"?: string,
    "name"?: string,
    "client"?: ParticipantType,
    "room_status"?: JoinStatus,
    "participation"?: number,
    "user_id"?: string,
    "audio_out_participant"?: EquipmentStatus,
    "audio_out_counselor"?: EquipmentStatus,
    "video_out_participant"?: EquipmentStatus,
    "video_out_counselor"?: EquipmentStatus,
    "screen_participant"?: EquipmentStatus,
    "screen_counselor"?: EquipmentStatus,
    "audio_in_participant"?: EquipmentStatus,
    "audio_in_counselor"?: EquipmentStatus,
    "video_in_participant"?: EquipmentStatus,
    "video_in_counselor"?: EquipmentStatus,
    "AttendeeId"?: string,
    "device"?: string
}

export enum JoinStatus {
    "UNDEFINED" = 0,
    "WAITING" = 2,
    "ACTIVE" = 3,
    "REJECTED" = 5
}