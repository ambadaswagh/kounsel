// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
	production: false,
	isMockEnabled: true, // You have to switch this, when your real back-end is done

	authTokenKey: 'authce9d77b308c149d5992a80073637e4d5',
	firebase: {
		apiKey: 'AIzaSyA-y9jRSYddZIdmTA6kZ-MkbnUasBmABD8',
		authDomain: 'project-2229039926989578476.firebaseapp.com',
		projectId: 'project-2229039926989578476',
		databaseURL: 'https://project-2229039926989578476.firebaseio.com',
		messagingSenderId: '582092791978',
		appId: "1:582092791978:web:623a6c6e9ab58710c2b0d3",
		storageBucket: "project-2229039926989578476.appspot.com",
		publicMessagingKey: 'BH9QnO1v_SdcCDsH0tT9ZlqbY9s5vob4B_ThPnfoNAkSARybOqYqA_WtIWr0DvVdJCO-iBKTvwUz0q9Yk4zFChA'
	},
	apiUrlIp: 'https://api-meeting-eeihggz33a-uc.a.run.app/api/v1/',
	apiUrlIpV2: 'https://api-meeting-eeihggz33a-uc.a.run.app/api/v2/',
	placesApiToken: 'AIzaSyC-EHzzjte66PJlHSMFoLzX1h3pZZe7lZQ',


	awsConfig: {
		BUCKET_NAME: 'com.kounsel.bucket.s3.input',
		COGNITO_REGION: 'us-east-1',
		IDENTITY_POOL_ID: 'us-east-1:6ec013ea-2318-49a9-a536-cbfaa7283d61',
		BUCKET_REGION: 'us-west-1'
	},

	version: '0.0.4'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
