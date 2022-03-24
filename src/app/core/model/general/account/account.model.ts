export interface AccountModel {
	account?: Account;
	reviews?: Reviews[];
}

export interface Account {
	'user_id'?: string;
	'name'?: string;
	'email'?: string;
	'image_url'?: string;
	'account_status'?: number;
	'phone_verified'?: number;
	'email_verified'?: number;
	'bank_verified'?: number;
	'payment_method_verified'?: number;
	'phone'?: string;
	'user_type'?: number;
	'rating'?: any;
	'review_count'?: number;
	'online'?: number;
	'legal_user_agreement'?: any;
	'legal_privacy_policy'?: any;
	'legal_escrow_agreement'?: any;
	'legal_confidentiality_agreement'?: any;
	'legal_ach_fees_agreement'?: any;
}

export interface Reviews {
	'reviewer_id'?: string;
	'user_id'?: string;
	'comment'?: string;
	'date'?: string;
	'rating'?: number;
	'reviewed_as'?: number;
	'last_update'?: number;
	'reviewer'?: Reviewer;
}

export interface Reviewer {
	'user_id'?: string;
	'name'?: string;
	'image_url'?: string;
}
