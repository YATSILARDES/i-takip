import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Firebase Console'dan projenizin ayarlarını alıp buraya yapıştırın.
// https://console.firebase.google.com/
const firebaseConfig = {
    apiKey: "AIzaSyBi6YfQqucMEK8BuC7SiWlmq88UfwMWv7o",
    authDomain: "web-app-2d006.firebaseapp.com",
    projectId: "web-app-2d006",
    storageBucket: "web-app-2d006.firebasestorage.app",
    messagingSenderId: "1051375342414",
    appId: "1:1051375342414:web:6bc09d75410b670450c41f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
