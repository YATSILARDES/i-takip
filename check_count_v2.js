import { initializeApp } from "firebase/app";
import { getFirestore, collection, getCountFromServer } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBi6YfQqucMEK8BuC7SiWlmq88UfwMWv7o",
    authDomain: "web-app-2d006.firebaseapp.com",
    projectId: "web-app-2d006",
    storageBucket: "web-app-2d006.firebasestorage.app",
    messagingSenderId: "1051375342414",
    appId: "1:1051375342414:web:6bc09d75410b670450c41f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCollections() {
    console.log("Checking collections in 'web-app-2d006'...");

    // Check 'randevular' (Correct spelling)
    try {
        const coll = collection(db, "randevular");
        const snapshot = await getCountFromServer(coll);
        console.log(`'randevular' koleksiyonundaki belge sayısı: ${snapshot.data().count}`);
    } catch (e) {
        console.error("Error checking 'randevular':", e.message);
    }

    // Check 'randvular' (Possible typo from user)
    try {
        const collTypo = collection(db, "randvular");
        const snapshotTypo = await getCountFromServer(collTypo);
        console.log(`'randvular' (typo?) koleksiyonundaki belge sayısı: ${snapshotTypo.data().count}`);
    } catch (e) {
        console.error("Error checking 'randvular':", e.message);
    }

    // Check 'randevu' (Another possibility)
    try {
        const collSingular = collection(db, "randevu");
        const snapshotSingular = await getCountFromServer(collSingular);
        console.log(`'randevu' koleksiyonundaki belge sayısı: ${snapshotSingular.data().count}`);
    } catch (e) {
        // Ignore
    }

    process.exit(0);
}

checkCollections();
