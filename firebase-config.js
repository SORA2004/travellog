// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAAbS3wIcaCay6VKuAJySBe4k5Q_5zPF1M",
  authDomain: "travellog-3da51.firebaseapp.com",
  projectId: "travellog-3da51",
  storageBucket: "travellog-3da51.appspot.com",
  messagingSenderId: "635303327353",
  appId: "1:635303327353:web:47a229b964291c2e31c6a8",
  measurementId: "G-YHD7HX2BX8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
