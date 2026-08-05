# JFK Operations: AVC Issue Request & Voting System

A clean, responsive, and secure internal airline operations application designed for JFK Operations Coordinators to submit department improvements, track progress, participate in votes, and review quarterly transparency reports.

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
* **Quarterly Updates & PDF Exporter**: View dynamic summaries of quarterly results (Q1 2026/Q4 2025). The page features full print styling sheet overrides to output clean, clean A4/Letter PDF reports without sidebar menus or page backgrounds.
* **Mobile Simulation Overlay**: Instantly test the crewmember view with a responsive frame overlay that converts the main navigation into a mobile-friendly bottom tab bar.
* **Complete Database Reset**: A **"Reset Database"** button in the top-right header controls allows admins to wipe out all custom issues, polls, and votes to start the system from a clean slate. Features a dual-confirmation safety prompt to prevent accidental data loss.

---

## 🔒 Security Gate & Admin Access
Access to the **AVC Admin Portal** is password-protected.
* **Passcode**: `babyblue07`
* Switching the role dropdown to *AVC Admin* or trying to access the restricted page triggers a custom modal verification prompt. Entering the correct code unlocks the admin tools; cancelation cleanly reverts the view to *Crewmember* mode.

---

## ⚙️ Local Development & Running

This is a pure frontend client application persisting state securely using browser `localStorage`. 

To launch the project locally:
1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd "B6 AVC"
   ```
2. Start a simple local server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open your browser and navigate to:
   [http://localhost:8000](http://localhost:8000)

---

*Created by DMG Official for JFK Operations and B6 AVC representatives.*
