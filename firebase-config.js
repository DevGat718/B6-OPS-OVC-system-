/* ==========================================================================
   JFK OPERATIONS - AVC ISSUE REQUEST & VOTING SYSTEM
   Firebase Cloud Database Configuration & Connection Utility
   ========================================================================== */

/**
 * PRODUCTION SETUP INSTRUCTIONS:
 * 1. Visit https://console.firebase.google.com and sign in with your Google account.
 * 2. Click "Add project" and name it (e.g. "jfk-ops-avc").
 * 3. In the project dashboard, click "Build" > "Firestore Database" > "Create database".
 *    - Start in "test mode" or publish the firestore.rules file from this repository.
 * 4. In Project Settings (gear icon) > General, scroll down to "Your apps",
 *    click the Web icon (</>), register the app (e.g. "JFK OPS Web"), and copy the `firebaseConfig` object.
 * 5. Paste the values into `DEFAULT_FIREBASE_CONFIG` below, OR paste them directly
 *    into the Admin Portal under "System Maintenance" > "Cloud Database Settings".
 */

// Encoded configuration payload (obfuscates keys from public repository scrapers)
const _FIREBASE_PAYLOAD = "eyJhcGlLZXkiOiAiQUl6YVN5QUlHdWhCOFVVdkFHQ0ZDc2RYQ29DV3NGa0ZXVnNyMy1RIiwgImF1dGhEb21haW4iOiAiamZrLW9wcy1hdmMuZmlyZWJhc2VhcHAuY29tIiwgInByb2plY3RJZCI6ICJqZmstb3BzLWF2YyIsICJzdG9yYWdlQnVja2V0IjogImpmay1vcHMtYXZjLmZpcmViYXNlc3RvcmFnZS5hcHAiLCAibWVzc2FnaW5nU2VuZGVySWQiOiAiNjEyOTk3MzU3NDU2IiwgImFwcElkIjogIjE6NjEyOTk3MzU3NDU2OndlYjoxNGIzNjVlZTNhODkzZWFlZjM1ZDE1IiwgIm1lYXN1cmVtZW50SWQiOiAiRy1XOFZHOUM0NDREIn0=";

function getEmbeddedFirebaseConfig() {
    try {
        if (typeof atob !== 'undefined') {
            return JSON.parse(atob(_FIREBASE_PAYLOAD));
        } else if (typeof Buffer !== 'undefined') {
            return JSON.parse(Buffer.from(_FIREBASE_PAYLOAD, 'base64').toString('utf-8'));
        }
    } catch (e) {
        console.warn("Failed to decode embedded config:", e);
    }
    return null;
}

const DEFAULT_FIREBASE_CONFIG = getEmbeddedFirebaseConfig() || {};

/**
 * Returns active Firebase config, checking localStorage override first.
 */
function getActiveFirebaseConfig() {
    try {
        const stored = localStorage.getItem('jfk_ops_firebase_config');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.projectId && parsed.apiKey) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn("Error reading stored firebase config:", e);
    }

    if (DEFAULT_FIREBASE_CONFIG.projectId && DEFAULT_FIREBASE_CONFIG.apiKey) {
        return DEFAULT_FIREBASE_CONFIG;
    }

    return null;
}

/**
 * Checks whether Firebase has credentials ready.
 */
function isCloudDatabaseReady() {
    const config = getActiveFirebaseConfig();
    return Boolean(config && config.projectId && config.apiKey);
}
