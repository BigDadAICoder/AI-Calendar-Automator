// PART A: THE MAIN FUNCTION
function mainFunction() {
  const labelName = "CreateEvent";
  const processedLabelName = "ProcessedEvent";
  const label = GmailApp.getUserLabelByName(labelName);
  if (!label) { return; }
  const threads = label.getThreads();
  if (threads.length === 0) { return; }
  for (const thread of threads) {
    try {
      const message = thread.getMessages()[0];
      const emailContent = message.getPlainBody();
      const jsonString = callGeminiAPI(emailContent);
      if (jsonString) {
        const eventDetails = JSON.parse(jsonString);
        if (eventDetails && eventDetails.title) {
          createCalendarEvent(eventDetails);
          thread.removeLabel(label);
          let processedLabel = GmailApp.getUserLabelByName(processedLabelName);
          if (!processedLabel) { processedLabel = GmailApp.createLabel(processedLabelName); }
          thread.addLabel(processedLabel);
        }
      }
    } catch (e) {
      console.error(`Failed to process email thread with subject: "${thread.getFirstMessageSubject()}". Error: ${e.toString()}`);
    }
  }
}

// PART B: THE GEMINI CALLER
function callGeminiAPI(emailText) {
  const API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!API_KEY) { throw new Error("GEMINI_API_KEY not found in Script Properties. Add it in Project Settings."); }
  const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + API_KEY;
  const prompt = `
    You are a highly efficient text-parsing and categorization API. Your function is to analyze the email text and extract event details into a structured JSON object.
    The user is in India (Timezone: IST, which is UTC+5:30). You must convert all event times to IST. The current year is 2025.
    **Categorization Rules:**
    1. Analyze the sender and content to determine if the event is for an "MBA" program or "Other".
    2. If the category is "MBA", you must extract the school name (e.g., "Chicago Booth", "London Business School").
    **Timezone Rules:** When you see a US timezone abbreviation, assume it is Daylight Saving Time for a July date. 'ET' is EDT (UTC-4), 'CT' is CDT (UTC-5), 'PT' is PDT (UTC-7).
    **Output Rules:**
    Respond ONLY with a valid JSON object. Do not include any other text or explanations.
    The JSON object must have these keys: "title", "startTimeIST", "endTimeIST", "description", "category", and "schoolName" (use an empty string "" for schoolName if the category is "Other").
    The start and end times must be in ISO 8601 format (e.g., "2025-07-15T03:30:00"). If no end time is specified, assume a 60-minute duration.
    The description should include the core details, like a meeting link if available.
    ---
    Email to process: ${emailText}
    ---
  `;
  const requestBody = { "contents": [{ "parts": [{ "text": prompt }] }], "generationConfig": { "responseMimeType": "application/json" } };
  const options = { 'method': 'post', 'contentType': 'application/json', 'payload': JSON.stringify(requestBody), 'muteHttpExceptions': true };
  let response;
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    response = UrlFetchApp.fetch(API_URL, options);
    if (response.getResponseCode() === 200) { return JSON.parse(response.getContentText()).candidates[0].content.parts[0].text; }
    if (response.getResponseCode() === 503) { Utilities.sleep(Math.pow(2, i) * 1000); } else { break; }
  }
  throw new Error(`API call failed after ${maxRetries} attempts. Final status code: ${response.getResponseCode()}.`);
}

// PART C: THE CALENDAR CREATOR
function createCalendarEvent(details) {
  console.log(`Attempting to create event with details: ${JSON.stringify(details, null, 2)}`);
  const userCalendar = CalendarApp.getDefaultCalendar();
  let title = details.title;
  let eventColor = null;
  if (details.category && details.category.toUpperCase() === 'MBA') {
    eventColor = CalendarApp.EventColor.RED;
    if (details.schoolName && details.schoolName.trim() !== '') {
      title = `MBA - ${details.schoolName}`;
    }
  }
  const startTime = new Date(details.startTimeIST);
  let endTime;
  if (details.endTimeIST) {
    endTime = new Date(details.endTimeIST);
  } else {
    endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
  }
  const description = details.description;
  const event = userCalendar.createEvent(title, startTime, endTime, { description: description });
  if (eventColor) { event.setColor(eventColor); }
  event.addPopupReminder(30);
  const eventDay = new Date(startTime);
  eventDay.setHours(9, 0, 0, 0);
  if (eventDay < startTime) {
    const minutesToNineAm = (startTime.getTime() - eventDay.getTime()) / 60000;
    event.addPopupReminder(Math.round(minutesToNineAm));
  }
  console.log(`Event created successfully with title: "${title}"`);
}
