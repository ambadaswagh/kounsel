// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/7.5.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.5.0/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: "AIzaSyC8BTOWOmDiPVfvJ9x3euWxpXS3yPZS9Ns",
    authDomain: "project-2229039926989578476.firebaseapp.com",
    databaseURL: "https://project-2229039926989578476.firebaseio.com",
    projectId: "project-2229039926989578476",
    storageBucket: "project-2229039926989578476.appspot.com",
    messagingSenderId: "582092791978",
    appId: "1:582092791978:web:623a6c6e9ab58710c2b0d3"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

/*
 * Overrides push notification data, to avoid having 'notification' key and firebase blocking
 * the message handler from being called
 */
self.addEventListener('push', function (e) {
    // Skip if event is our own custom event
    if (e.custom) return;
    // Create a new event to dispatch
    var newEvent = new Event('push');
    newEvent.waitUntil = e.waitUntil.bind(e);
    newEvent.data = {
        json: function () {
            var newData = e.data.json();
            newData._notification = newData.notification;
            delete newData.notification;
            return newData;
        },
    };

    newEvent.custom = true;

    // Stop event propagation
    e.stopImmediatePropagation();

    // Dispatch the new wrapped event
    dispatchEvent(newEvent);
});

messaging.setBackgroundMessageHandler(function (e) {
    messaging.sendMessageToWindowClients_(e);
})