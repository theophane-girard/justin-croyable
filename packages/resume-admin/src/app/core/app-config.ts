import { environment } from '../../environments/environment';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAJQtpobzZCDWU7B7JmBqI6jvINxjSRp5Q',
  authDomain: 'justin-croyable-story.firebaseapp.com',
  projectId: 'justin-croyable-story',
  storageBucket: 'justin-croyable-story.firebasestorage.app',
  messagingSenderId: '956067265057',
  appId: '1:956067265057:web:20a72394a25f8e0a428160',
  measurementId: 'G-TBNFPQVSVV',
} as const;

export const API_BASE_URL = environment.apiBaseUrl;
