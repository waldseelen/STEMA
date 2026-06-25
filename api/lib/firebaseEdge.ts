import { initializeApp, getApps, getApp } from 'firebase/app'
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    limit,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    orderBy
} from 'firebase/firestore/lite'

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_SUPABASE_URL?.split('.')[0]?.replace('https://', ''),
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
export const db = getFirestore(app)

// JWT Token decoder for Firebase Auth in Edge Functions
export function getUserIdFromToken(authHeader: string | null): string {
    if (!authHeader) return '00000000-0000-0000-0000-000000000000'
    const token = authHeader.replace('Bearer ', '')
    if (token === 'mock-session-token' || !token) return '00000000-0000-0000-0000-000000000000'

    try {
        const parts = token.split('.')
        if (parts.length !== 3) return '00000000-0000-0000-0000-000000000000'
        const payload = JSON.parse(atob(parts[1]))
        return payload.sub || '00000000-0000-0000-0000-000000000000'
    } catch (err) {
        console.error('Error decoding Firebase token on Edge:', err)
        return '00000000-0000-0000-0000-000000000000'
    }
}

export {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    limit,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    orderBy
}
