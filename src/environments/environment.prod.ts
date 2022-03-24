export const environment = {
	production: true,
	isMockEnabled: true, // You have to switch this, when your real back-end is done
	authTokenKey: 'authce9d77b308c149d5992a80073637e4d5',
	firebase: {
		apiKey: "AIzaSyC8_E6q8tFQBajJMxZQrHm0fhfaaCnvKgY",
		authDomain: "kounsel-184914.firebaseapp.com",
		databaseURL: "https://kounsel-184914.firebaseio.com",
		projectId: "kounsel-184914",
		storageBucket: "kounsel-184914.appspot.com",
		messagingSenderId: "340324864979",
		appId: "1:340324864979:web:94f5aeb2fe921ec019d526",
		publicMessagingKey: 'BKgOink4Q5AHtVCpMAX9hZXnHP3sAv6jkNVHkJINE46MTXj6yj2wC7E7vAafghYb2sw6wrTkfsvbvaJAkpg3klQ'
	},
	apiUrlIp: 'https://kounsel.mirach.co/api/v1/',
	apiUrlIpV2: 'https://kounsel.mirach.co/api/v2/',
	placesApiToken: 'AIzaSyC-EHzzjte66PJlHSMFoLzX1h3pZZe7lZQ',

	awsConfig: {
		BUCKET_NAME: 'io.kounsel.input',
		COGNITO_REGION: 'us-east-1',
		IDENTITY_POOL_ID: 'us-east-1:7ed4020d-09d4-4fe8-82a8-9030be6a7ad3',
		BUCKET_REGION: 'us-east-1'
	},
	version: '0.0.4'
};
