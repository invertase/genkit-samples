import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC_fKY0WdB5acokDCZa-WnU-0hcC8faIZI",
  authDomain: "extensions-testing.firebaseapp.com",
  databaseURL: "https://extensions-testing.firebaseio.com",
  projectId: "extensions-testing",
  storageBucket: "extensions-testing.appspot.com",
  messagingSenderId: "219368645393",
  appId: "1:219368645393:web:84656cca08e0c44c6862b0",
  measurementId: "G-KQ5KYC8LT1",
};

export const app = initializeApp(firebaseConfig);

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(
    "6LeEO-EpAAAAAPA24kk3S30wNvtX9sgyWqJxKe7t"
  ),
  isTokenAutoRefreshEnabled: true, // Set to true to allow auto-refresh.
});

export const auth = getAuth(app);
