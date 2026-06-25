import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const isConfigured = !!firebaseConfig.apiKey
export const isFirebaseConfigured = isConfigured

if (!isConfigured) {
    console.error('Firebase configuration VITE_FIREBASE_API_KEY is missing. Check your .env.local file.')
}

// Use a mock fallback config if env keys are missing to prevent fatal crash
const activeConfig = isConfigured ? firebaseConfig : {
    apiKey: "mock-api-key-for-preventing-app-crash",
    authDomain: "mock-project.firebaseapp.com",
    projectId: "mock-project-id",
    storageBucket: "mock-project.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:mockappid"
}

export const app = initializeApp(activeConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
