# JFK Operations: AVC Issue Request & Voting System

A clean, responsive, and secure internal airline operations application designed for JFK Operations Coordinators to submit department improvements, track progress, participate in votes, and review quarterly transparency reports.git

Built with **JetBlue-inspired aesthetics**, high-fidelity animations, and full mobile optimization.

---

## 🎨 Visual Themes & Layouts
The application supports three distinct visual design directions:
1. **Version A: Classic Corporate** — Clean, structured corporate colors with standard grid layouts.
2. **Version B: Modern Operations** — High-contrast dark mode with neon flight-deck colors, designed for low-light operations.
3. **Version C: Minimal Aviation** — Monospaced blueprint style with clean outlines, ideal for raw utility.

---

## 🚀 Key Features

* **Simplified Operations Dashboard**: Aggregates all coordinator requests into four rollup metrics:
  * **Open Issues / Under Review** (Submitted, Under Review, Needs Information, Blocked)
  * **Active Department Votes** (Voting)
  * **Submitted to Leadership** (Submitted to Leadership)
  * **Approved / Completed** (Approved, Implementing, Completed)
* **Interactive Issue Submission**: Submit forms featuring input validation, duplicate safety checks, and automatic history timeline creation.
* **Coordinator Voting Center**: Cast votes on pending operational proposals.
  * Checks for duplicate voting attempts by Crewmember ID.
  * Restricts results to aggregate percentages to maintain **voter confidentiality**.
* **Confidential Voter Registry (AVC Admin Portal)**: A locked voter tracking log to verify ballots and prevent double-voting. Flags duplicate entries in red and allows CSV export for audits.
* **Quarterly Updates & PDF Exporter**: View dynamic summaries of quarterly results. On load, the system auto-detects the current date (e.g., August 2026 selects **2026** and **Q3** automatically). Provides separate **Year** and **Quarter** dropdown controls to dynamically load metrics and categorized issues for any period. Features print layout overrides for clean A4 PDF reports.
* **Mobile Simulation Overlay**: Instantly test the crewmember view via the **Mobile View (Demo Display)** option inside the **Viewing Options** dropdown, which mimics a native-like bottom tab bar navigation.
* **Complete Database Reset (AVC Admin Portal)**: Tucked securely inside the **System Maintenance** tab of the password-protected Admin Portal, allowing authorized administrators to wipe out custom issues, polls, and votes to start from a clean slate with a safety confirmation prompt.



---

## 🔒 Security Gate & Admin Access
Access to the **AVC Admin Portal** is password-protected.
* **Passcode**: `babyblue07`
* Switching the role dropdown to *AVC Admin* or trying to access the restricted page triggers a custom modal verification prompt. Entering the correct code unlocks the admin tools; cancelation cleanly reverts the view to *Crewmember* mode.

---

## ☁️ Shared Multi-User Cloud Database (Firebase Firestore)

To enable live data sharing across all 30 crew members opening your shared GitHub link, the system includes native Google Firebase Firestore synchronization with offline local storage fallback.

### Enabling Cloud Sync:
1. Go to **[Firebase Console](https://console.firebase.google.com)** and sign in with your Google account.
2. Click **Add project** (e.g. `jfk-ops-avc`).
3. In **Build > Firestore Database**, click **Create database**, select a location (e.g. `nam5`), and start in **Test mode** (or apply the included `firestore.rules`).
4. Go to **Project Settings** (gear icon) > scroll to **Your apps** > click **Web (</>)** and copy the `firebaseConfig` object.
5. Either:
   * **In the App**: Log into **AVC Admin** > **Admin Portal** > **System Maintenance** > paste the config into **Cloud Database Synchronization** and click **Save & Connect**.
   * **In Code**: Paste the keys into `firebase-config.js` and push to GitHub so all link visitors connect automatically.

Once connected, submissions, poll creations, and votes synchronize in real-time across all devices without needing page reloads!

---

## ⚙️ Local Development & Running

To test locally:
1. Start a simple local server:
   ```bash
   python3 -m http.server 8000
   ```
2. Open your browser and navigate to:
   [http://localhost:8000](http://localhost:8000)

---

*Created by DMG Official for JFK Operations and B6 AVC representatives.*
