// USA
export const locale = {
	lang: 'en',
	data: {
		TRANSLATOR: {
			SELECT: 'Select your language',
		},
		MENU: {
			NEW: 'new',
			ACTIONS: 'Actions',
			CREATE_POST: 'Create New Post',
			PAGES: 'Pages',
			FEATURES: 'Features',
			APPS: 'Apps',
			DASHBOARD: 'Dashboard',
			GENERAL: 'General',
			COUNSELLOR_PROFILE: 'COUNSELLOR PROFILE',
			ACCOUNT: 'ACCOUNT'
		},
		AUTH: {
			GENERAL: {
				OR: 'Or',
				SUBMIT_BUTTON: 'Submit',
				NO_ACCOUNT: 'Don\'t have an account?',
				SIGNUP_BUTTON: 'Sign Up',
				FORGOT_BUTTON: 'Forgot Password?',
				BACK_BUTTON: 'Back',
				PRIVACY: 'Privacy',
				LEGAL: 'Legal',
				CONTACT: 'Contact',
			},
			LOGIN: {
				TITLE: 'Login Account',
				BUTTON: 'Sign In',
			},
			FORGOT: {
				TITLE: 'Forgotten Password?',
				DESC: 'Enter your email to reset your password',
				SUCCESS: 'Your account has been successfully reset.'
			},
			REGISTER: {
				TITLE: 'Sign Up',
				DESC: 'Enter your details to create your account',
				SUCCESS: 'Your account has been successfuly registered.'
			},
			INPUT: {
				EMAIL: 'Email',
				FULLNAME: 'Fullname',
				PASSWORD: 'Password',
				CONFIRM_PASSWORD: 'Confirm Password',
				USERNAME: 'Username'
			},
			VALIDATION: {
				INVALID: '{{name}} is not valid',
				REQUIRED: '{{name}} is required',
				MIN_LENGTH: '{{name}} minimum length is {{min}}',
				AGREEMENT_REQUIRED: 'Accepting terms & conditions are required',
				NOT_FOUND: 'The requested {{name}} is not found',
				INVALID_LOGIN: 'Invalid email or password',
				REQUIRED_FIELD: 'Required field',
				MIN_LENGTH_FIELD: 'Minimum field length:',
				MAX_LENGTH_FIELD: 'Maximum field length:',
				INVALID_FIELD: 'Field is not valid',
			}
		},
		ECOMMERCE: {
			COMMON: {
				SELECTED_RECORDS_COUNT: 'Selected records count: ',
				ALL: 'All',
				SUSPENDED: 'Suspended',
				ACTIVE: 'Active',
				FILTER: 'Filter',
				BY_STATUS: 'by Status',
				BY_TYPE: 'by Type',
				BUSINESS: 'Business',
				INDIVIDUAL: 'Individual',
				SEARCH: 'Search',
				IN_ALL_FIELDS: 'in all fields'
			},
			ECOMMERCE: 'eCommerce',
			CUSTOMERS: {
				CUSTOMERS: 'Customers',
				CUSTOMERS_LIST: 'Customers list',
				NEW_CUSTOMER: 'New Customer',
				DELETE_CUSTOMER_SIMPLE: {
					TITLE: 'Customer Delete',
					DESCRIPTION: 'Are you sure to permanently delete this customer?',
					WAIT_DESCRIPTION: 'Customer is deleting...',
					MESSAGE: 'Customer has been deleted'
				},
				DELETE_CUSTOMER_MULTY: {
					TITLE: 'Customers Delete',
					DESCRIPTION: 'Are you sure to permanently delete selected customers?',
					WAIT_DESCRIPTION: 'Customers are deleting...',
					MESSAGE: 'Selected customers have been deleted'
				},
				UPDATE_STATUS: {
					TITLE: 'Status has been updated for selected customers',
					MESSAGE: 'Selected customers status have successfully been updated'
				},
				EDIT: {
					UPDATE_MESSAGE: 'Customer has been updated',
					ADD_MESSAGE: 'Customer has been created'
				}
			}
		},
		MEETING: {
			common:{
				paid: 'Paid',
				free: 'Free',
				counselor: 'counselor',
				notAvailable: 'Not Available'
			},
			roomDetails:{
				title: 'Room Details',
				existingParticipants: 'EXISTING PARTICIPANTS'
			},
			addParticipant:{
				meetingId: 'Meeting ID',
				shareLink: "Share link with people you want in the meeting. Guest won't be charged.",
				whoToAdd: 'Who do you want to add?',
				selectBilling: 'Select billing method',
				addParticipant: 'Add participant',
				copyDetail: "Copy the login details and access code. Share this with your client or store securely because this code can't be recovered if lost.",
			},
			billingMethod: {
				selectBilling: 'Select Billing Method',
				ratePerMinute: 'Rate Per Minute',
				perMinuteMessage: "The client will pay for every minute of his/her attendance and will have access to your room until revoked. Your profile rate will be used.",
				fixedAmount: 'Fixed Amount',
				fixedAmountMessage: "The client will pay a one time fee for attending the meeting, and the client will have access to your room until revoked or expired. Enter the amount in the input field below, you would like to charge.",
				amount: 'Amount',
				addParticipant: 'Add participant',
			},
			joinMeeting: {
				title: 'Join Meeting',
				meetingId: 'Meeting ID',
				passCode: 'Meeting Passcode',
				joinOption: 'JOIN OPTIONS',
				audio: 'Audio',
				video: 'Video',
				enterRoom: 'Enter your room',
				roomDetails: 'Room details',
				join: 'Join',
				meetingIdPlaceholder: 'Meeting ID or counselor user name',
				accessRevoked: 'Your access is revoked. Please contact your counselor for a new meeting passcode.',
				wrongCredentials: 'Wrong Meeting Id or Code.',
				noAccess: 'You do not have access to join this meting.',
				manageParticipants: 'Manage participants'
			},
			participantDetails: {
				roomDetails: 'Room Details',
				accessHistory: 'Access History',
				issued: 'Issued',
				expires: 'Expires',
				none: 'None',
				freeUser: 'Free user',
				accessDetails: 'Access Details',
				meetingId: 'Meeting ID',
				code: 'Code',
				join: 'Join',
				meetingLink: 'www.kounsel.io/meeting',
				revokeAccess: 'Revoke Access',
				participated: 'Participated',
				detailsCopied: 'Details are copied to clipboard',
				accessRevoked: 'Access is revoked successfully'
			},
			conference: {
				addName: {
					title: 'Add Name',
					name: 'Name',
					continue: 'Continue'
				},
				chat: {
					title: 'Chat'
				},
				chatBox: {
					today: 'Today',
					youtube: 'Youtube',
					activeAppointment: 'Active Appointment',
					join: 'Join',
					appointment: 'Appointment',
					dueIn: 'Due in',
					wasOn: 'Was on',
					attachment: 'Attachment'
				},
				chatSnapshot: {
					noChat: 'You have not chat with anyone, but once you do all message will display here'
				},
				fileUploadArea: {
					uploading: 'Uploading...',
					clickDrop: 'Click or drop files here to upload',
					clickToDrop: 'Click to upload',
					maxMb: 'Max 5 MB',
					recommendedSize: 'Recommended size: 600 x 600 px',
					selectFile: 'Selected File',
					pleaseSelect: 'Please Select a file',
					selectedFile: 'Selected File',
					percentUploaded: '% Uploaded',
					maxMbAllowed: 'Maximum 5 MB file size is allowed',
					errorProcessing: 'Error processing files try again',
					fileSuccess: 'File successfully uploaded',
					fileUploadCancel: 'File upload canceled'
				},
				controlPanel: {
					stopVideo: 'Stop Video',
					startVideo: 'Start Video',
					mute: 'Mute',
					unmute: 'Unmute',
					shareScreen: 'Share Screen',
					stopSharing: 'Stop Sharing',
					chat: 'Chat',
					closeChat: 'Close Chat',
					participant: 'Participants',
					fullScreen: 'Full Screen',
					exitFullScreen: 'Exit full Screen',
					gridMode: 'Grid Mode',
					endCall: 'End Call',
					noMicrophone: 'No microphone found, For people to hear you during meetings, Kounsel would like to access your microphone.',
					browserAudioPermission: 'Audio permission denied by browser, For people to hear you during meetings, Kounsel would like to access your microphone.',
					audioPermission: 'Audio permission denied, For people to hear you during meetings, Kounsel would like to access your microphone.',
					counselorMicPermission: 'Microphone disabled by meeting admin.',
					counselorCameraPermission: 'Camera disabled by meeting admin.',
					noWebCam: 'No webcam found, For people to see you during meetings, Kounsel would like to access your camera.',
					browserCamPermission: 'Video permission denied by browser, For people to see you during meetings, Kounsel would like to access your camera.',
					camPermission: 'Video permission denied, For people to see you during meetings, Kounsel would like to access your camera.',
					screenShareCounselor: 'Screen share disabled by meeting admin.',
					audioInCounselor: 'Speaker disabled by meeting admin.'
				},
				conferenceHome: {
					leaveWarning: 'There are active/waiting participants in the meeting, do you still want to end meeting?',
					endCall: 'End call',
					meetingCanceled: 'Join meeting cancelled',
					accessExpired: 'Your access credentials are expired please ask for new credentials.',
					meetingFull: 'Meeting is full at this moment.',
					audioDeviceSwitched: 'You joined the meeting from another device, disconnecting from here.',
					meetingEnded: 'This meeting has been ended.',
					noAccess: 'You do not have access to join this meting.',
					counselorRemoved: 'Counselor removed you from meeting, you can ask counselor again for access.',
					meetingEndSmall: 'Meeting ended',
					counselorLeft: 'Counselor left the meeting.',
					leftMeeting: ' left the meeting.',
					weakConnection: 'your connection is weak, you can turn of video to save bandwidth.',
					meetingEndedConnectivityIssue: 'Meeting Ended due to connectivity issue.'
				},
				grid: {
					mute: 'Mute',
					unmute: 'Unmute',
					speakerOn: 'Turn on speaker',
					speakerOff: 'Turn off speaker',
					cameraOn: 'Turn on camera',
					cameraOff: 'Turn off camera',
					displayOn: 'Turn on display',
					displayOff: 'Turn off display',
					screenShareOn: 'Turn on screen share',
					screenShareOff: 'Turn off screen share',
					removeParticipant: 'Remove Participant'
				}
			}
		},
		COMMON: {
			unknown: 'Unknown',
			loading: 'Loading...',
			close: 'Close',
			error: 'Something went wrong, please try again',
			cancel: 'Cancel',
			back: 'Back',
			save: 'Save',
		},
		FILES: {
			maxFileSizeError: 'Maximum 5 MB file size is allowed'
		},
		ACCOUNT: {
			title: 'Account',
			changeImage: 'Change Image',
			rating: 'Rating',
			status: 'Status',
			reviews: 'reviews',
			fullName: 'Full Name',
			email: 'Email',
			card: 'Card',
			bank: 'Bank',
			phoneNumber: 'Phone Number',
			connectedWith: 'CONNECTED WITH',
			facebook: 'Facebook',
			google: 'Google',
			signOut: 'Sign Out',
			enterName: 'Enter Name',
			enterEmail: 'Enter Email Id',
			enterBank: 'Enter Bank Name',
			enterPhone: 'Enter Phone Number',
			enterCard: 'Enter Card Number',
			unknown: 'Unknown',
			active: 'Active',
			paymentLocked: 'Payment Locked',
			blocked: 'Blocked',
			accountImageChanged: 'Account image changed'
		},
		SELECT_FROM_CLOUD: {
			kounselCloud: 'Kounsel Cloud',
			noFiles: 'You don`t have files in Cloud yet.',
			select: 'Select',
		},
		IMAGE: {
			onlyImage: 'Only image is allowed',
			errorSelectingFromCloud: 'Error selecting image from cloud, try again',
			changeImage: 'Change Image',
			uploading: 'Uploading',
			dropFiles: 'Click or drop files here to upload',
			clickToUpload: 'Click to upload',
			selectFromCloud: 'Select From Cloud',
			maxFiveMb: 'Max 5 MB',
			dimensionExample: 'Recommended size: 600 x 600 px'
		}
	}
};
