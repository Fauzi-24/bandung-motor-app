// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBNQJ-a8c5V6xA7fBiU3psj-kDAw3fFYuk",
    authDomain: "bandung-motor.firebaseapp.com",
    projectId: "bandung-motor",
    storageBucket: "bandung-motor.firebasestorage.app",
    messagingSenderId: "419358460913",
    appId: "1:419358460913:web:fe74901414d001e4839250",
    measurementId: "G-7LENS2KH4F"
};

// Initialize Firebase (Main App)
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Initialize Secondary App for Admin operations (like adding employees without logging out)
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
export const secondaryAuth = getAuth(secondaryApp);
