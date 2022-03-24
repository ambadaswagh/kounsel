// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/7.5.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.5.0/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyC8_E6q8tFQBajJMxZQrHm0fhfaaCnvKgY",
  authDomain: "kounsel-184914.firebaseapp.com",
  databaseURL: "https://kounsel-184914.firebaseio.com",
  projectId: "kounsel-184914",
  storageBucket: "kounsel-184914.appspot.com",
  messagingSenderId: "340324864979",
  appId: "1:340324864979:web:94f5aeb2fe921ec019d526"
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