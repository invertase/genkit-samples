import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Board from "./components/Board";
import RainEffect from "./components/Background";
import { Header } from "./components/Header";
import { useEffect } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
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

const app = initializeApp(firebaseConfig);

initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(
    "6LeEO-EpAAAAAPA24kk3S30wNvtX9sgyWqJxKe7t"
  ),
  isTokenAutoRefreshEnabled: true, // Set to true to allow auto-refresh.
});

export const auth = getAuth(app);

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    signInAnonymously(auth)
      .then(() => {
        console.log("Signed in anonymously");
      })
      .catch((error) => {
        console.error("Error signing in anonymously: ", error);
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User ID: ", user.uid);
      } else {
        console.log("No user signed in");
      }
    });

    return () => unsubscribe();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <RainEffect />
      <Header />
      <div className="flex w-screen h-screen justify-center items-start pt-[10vh] md:pt-0">
        <div className="m-4 md:m-24 relative max-w-[90%] max-h-[90%] w-[90vw] md:w-[40vw] md:h-[40vh]">
          <Board />
        </div>
      </div>
    </QueryClientProvider>
  );
}
