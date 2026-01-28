// firebase-config.js
// Modular Firebase initialization for web (ES modules)
// Replace placeholder fields below with your real Firebase project settings
import { initDOM, toggleVisibility } from './script.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js';

let user;
let auth;
let database;
let app;
 
const firebaseConfig = {
  apiKey: "AIzaSyDL2FuehazNsB-k74jH-bsAqHfHvuL8JoA",
  authDomain: "poll-8c0c2.firebaseapp.com",
  databaseURL: "https://poll-8c0c2-default-rtdb.firebaseio.com",
  projectId: "poll-8c0c2",
  storageBucket: "poll-8c0c2.firebasestorage.app",
  messagingSenderId: "824105340758",
  appId: "1:824105340758:web:2589843b99ff71703690f7",
  measurementId: "G-C78N4QYYNL"
};

console.log(window.firebase, window.firebaseui);

function handleFirebaseStart() {

  if (window.firebaseui && window.firebase) {
    console.log('Firebase initialized');
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    auth = getAuth(app);
    auth.languageCode = 'pt-BR';
  
    const ui = new firebaseui.auth.AuthUI(auth);
    const uiConfig = {
      signInOptions: [
        // List of OAuth providers supported.
        GoogleAuthProvider.PROVIDER_ID,
      ],
      signInFlow: 'popup',
      callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
          // User successfully signed in.
          // Return false to avoid redirect.
          user = authResult.user;
          return false;
        }
      }
      // Other config options...
    }
  onAuthStateChanged(auth, (user) => {
    const container = document.getElementById('firebaseui-auth-container');
  
    // toggleVisibility('main-content', true);
    if (user) {
      try {
        // container.classList.add('hidden')
        initDOM();
        return false
      } catch (e) {
        console.warn('initDOM failed', e);
      }
      // try { ui.reset(); } catch (e) { /* ignore */ }
      return;
    } else {
      ui.start(container, uiConfig);
      // container.classList.add('visible')
      // handleLoggout();
    }
  });
  }
}


window.onload = function () {
  const loadingScreen = document.querySelector('.mike-loading');
  
  if (loadingScreen) {
    this.setTimeout(() => {
      loadingScreen.style.display = 'none';
      toggleVisibility('main-content', true);
      console.log('External libs loaded and app modules initialized');
      toggleVisibility('image-lp', true);
      initDOM();
    }, 1000)
  }
}

document.addEventListener('DOMContentLoaded', handleFirebaseStart);

export { app, database, auth, user, signOut };