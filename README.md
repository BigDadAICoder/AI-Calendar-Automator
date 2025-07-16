# 🤖 AI Calendar Automator

An AI-powered Google Apps Script to automatically parse event invitations from Gmail and create detailed, color-coded Google Calendar events. This project turns a cluttered inbox of event invites into a perfectly organized calendar, all with zero manual effort.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Language: Google Apps Script](https://img.shields.io/badge/Language-Google%20Apps%20Script-blue.svg)](https://www.google.com/script/start/)

---

## The Problem
For anyone applying to programs like an MBA or attending multiple online webinars, managing the high volume of event invitations is a serious challenge. Each email has a different format, timezone, and link. Manually creating calendar entries is tedious and prone to error, especially when converting timezones.

## The Solution 🚀
This project implements a fully automated, two-account system within the Google ecosystem to solve this problem. It uses an intelligent "Forwarder" to identify and de-duplicate invitations, and a "Processor" that leverages the **Google Gemini API** to understand the email and create a perfect calendar event.

---

## How It Works ⚙️
The system uses a two-account architecture for a clean and robust separation of tasks.

graph TD
    subgraph "Mail B: The Forwarder Account"
        A[📧 Incoming Event Invitation] --> B(Forwarder.gs Script);
        B -- "1. Identifies valid invite<br/>2. De-duplicates using 'Event Fingerprint'<br/>3. Forwards to Primary Account" --> C;
    end

    subgraph "Mail A: The Processor Account"
        C[📨 Forwarded Email Arrives] --> D(Processor.gs Script);
        D -- "1. Parses email with Gemini API<br/>2. Categorizes event (e.g., MBA)<br/>3. Creates formatted calendar event" --> E[🗓️ Final Event on Your Main Calendar];
    end

---

## Key Features ✨
* **Intelligent De-duplication:** Uses a persistent "Event Fingerprint" log to prevent creating duplicate calendar entries, even if reminders are sent in completely separate email threads.
* **AI-Powered Parsing:** Leverages the Google Gemini API to robustly extract event titles, descriptions, and dates from unstructured email text.
* **Automatic Timezone Conversion:** Reliably converts various US timezones (ET, CT, PT, etc.) to the user's local timezone (IST in this case), correctly accounting for Daylight Saving Time.
* **Smart Categorization:** The AI categorizes events (e.g., "MBA" vs. "Other") and extracts key data like school names.
* **Custom Formatting & Color-Coding:** Automatically creates formatted event titles (e.g., "MBA - Chicago Booth") and applies colors to the calendar event for easy identification.
* **Resilient Error Handling:** The script automatically retries API calls with exponential backoff if the server is temporarily busy, making the system highly reliable.
* **Zero Cost:** Built entirely on the Google Apps Script platform with generous free tiers for personal use.

---

## Tech Stack & Tools 🛠️
* **Backend:** Google Apps Script
* **Language:** JavaScript
* **AI Model:** Google Gemini API
* **Google Services:**
    * Gmail API (`GmailApp`)
    * Google Calendar API (`CalendarApp`)
    * Properties Service (for the de-duplication log)
    * Time-Driven Triggers (for automation)

---

## Setup Guide 📖
To get this system running for yourself, you'll need two Google accounts and a Gemini API key.

### **Prerequisites**
1.  **Two Google Accounts:** A primary account (`Mail A`) for your main calendar and a secondary account (`Mail B`) to receive public-facing invitations.
2.  **Gemini API Key:** Get a free API key from [Google AI Studio](https://aistudio.google.com/).

### **Step 1: Configure the Forwarder Account (`Mail B`)**
1.  **Authorize Forwarding:** In `Mail B`'s Gmail settings, go to `Forwarding and POP/IMAP` and add `Mail A`'s address. Complete the verification process.
2.  **Create the Script:** Go to `script.google.com`, create a new project, and name it "Invitation Forwarder".
3.  **Add the Code:** Paste the code from `Forwarder.gs` into the script editor. **Remember to replace the placeholder email address with your primary email.**
4.  **Set the Trigger:** Go to `Triggers` (⏰ icon), add a new trigger, and set it to run the `autoForwardInvitations` function on a `Time-driven` trigger every 10 or 15 minutes.
5.  **Authorize:** Run the function once manually to grant the necessary permissions.

### **Step 2: Configure the Processor Account (`Mail A`)**
1.  **Create Labels:** In `Mail A`'s Gmail, create two labels: `CreateEvent` and `ProcessedEvent`.
2.  **Create the Filter:** Go to Gmail `Settings` -> `Filters` and create a new filter.
    * **From:** Your `Mail B` email address.
    * **Has the words:** `{(subject:"Reminder:") (subject:"Confirmed") "Thank you for registering" ...}` (copy the full query from the `Forwarder.gs` script).
    * **Action:** `Apply the label: CreateEvent` and `Skip the Inbox (Archive it)`.
3.  **Create the Script:** Go to `script.google.com`, create a new project, and name it "Main Calendar Bot".
4.  **Add the Code:** Paste the code from `Processor.gs`.
5.  **Add API Key:** Go to `Project Settings` (⚙️ icon) -> `Script Properties` and add a new property.
    * **Property:** `GEMINI_API_KEY`
    * **Value:** `YOUR_GEMINI_API_KEY_HERE`
6.  **Set the Trigger:** Create a `Time-driven` trigger to run `mainFunction` every 5 minutes.
7.  **Authorize:** Run the function once manually to grant all necessary permissions.

Your automated system is now live!
