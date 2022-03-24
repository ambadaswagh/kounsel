import { Appointment } from '../appointment/appointment.model';
import { Status } from './status.model';
import { Attachment } from '../../profile/profile.model'

export interface Conversation {
    'child'?: number;
    'incoming'?: number;
    'message'?: string;
    'last_update'?: string;
    'attachment'?: Attachment,
    'message_id'?: string;
    'received'?: string;
    'root'?: number;
    'root_id'?: string;
    'sender'?: string;
    'time'?: string;
    'topic_id'?: string;
    'type'?: ConversationType;
    'unread'?: number;
    'status'?: Status[]

    // **********  UI RELATED ********** //
    'containsLink'?: boolean;
    'formattedMessage'?: StringList[];
    'event'?: Appointment;
    '_last_update'?: number;
    '_time'?: number;
    '_received'?: number;
}

export interface StringList {
    'value'?: string;
    'isLink'?: boolean;
    'link'?: any
}

export enum ConversationType {
    EVENT = 2,
    ATTACHMENT = 3,
    TEXT = 5,
    REQUEST = 7,
    THREAD_TEXT = 11,
    STATUS = 13,
    READ_STATUS = 17,
    UNDEFINED = 86028121
}