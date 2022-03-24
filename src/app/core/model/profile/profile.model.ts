export interface ProfileModel {
	profile?: Profile;
	presence?: Presence;
	cover?: Attachment;
	attachment?: Attachment[];
	license?: Licence[];
}

export interface Profile {
	'user_id'?: string;
	'name'?: string;
	'category'?: string;
	'image_url'?: string;
	'profession'?: string;
	'rating'?: number;
	'language'?: string;
	'city'?: string;
	'country'?: string;
	'state'?: string;
	'description'?: string;
	'keywords'?: string;
	'rate'?: number;
	'last_update_profile'?: string;
	'crud'?: number;
	'message_with_payment_method'?: number;
	'counseling_availability'?: number;
	'appointment_availability'?: number;
	'counseling_appointment'?: number;
	'message_licensed_state'?: number;
	'counseling_licensed_state'?: number;
	'message_new_inquiry_availability'?: number;
	'status'?: number;
	'skills'?: Skill[];
	'behance'?: string;
	'medium'?: string;
	'dribble'?: string;
	'linkedin'?: string;
	'stackoverflow'?: string;
	'yelp'?: string;
	'web'?: string;
}

export interface Skill {
	'user_id'?: string;
	'name'?: string;
	'learned'?: number;
}

export interface Presence {
	'user_id'?: string;
	'mqtt_status'?: number;
	'online'?: number;
	'last_seen'?: string;
}

export interface Attachment {
	'attachment_id'?: string;
	'attachment_type'?: number;
	'duration'?: number;
	'media_type'?: number;
	'mime_type'?: string;
	'owner'?: string;
	'cloud'?: number;
	'res_1024x768'?: string;
	'res_1200x900'?: string;
	'res_1920x1080'?: string;
	'res_320x480'?: string;
	'original'?: string;
	'size'?: number;
	'profile'?: number;
	'account'?: number;
	'cover'?: number;
	'title'?: string;
	'crud'?: number;
	'last_update'?: string;
	'time'?: string;
	'file'?: File;
	'uploadStatus'?: any;
	'uploadProgress'?: number;
	'uploadError'?: string;
	'deleted'?: boolean;
	'mode'?: string;
	'youtube_id'?: string;
	'youtube_embed'?: any;
	'youtube_link'?: any;
	'audio_link'?: any;
	'hls_3'?: string;
	[key: string]: any
}

export interface Licence {
	'user_id'?: string;
	'number'?: string;
	'board'?: string;
	'country'?: string;
	'type'?: string;
	'state'?: string;
	'expiration'?: number;
	'id'?: number;
	'last_update'?: number;
	'toc'?: number;
	'crud'?: number;
}
