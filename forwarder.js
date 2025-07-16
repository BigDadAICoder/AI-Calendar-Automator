// HELPER FUNCTION: Creates a unique "fingerprint" for an event to prevent duplicates.
function createEventFingerprint(subject, body) {
  const cleanedSubject = subject.replace(/(Reminder:|You're Confirmed:|Registration Confirmed:|You're Invited!|It’s Almost Time!)/i, '')
                                .trim().toUpperCase().replace(/\s/g, '');
  const dateRegex = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}|\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}/i;
  const dateMatch = body.match(dateRegex);
  if (!dateMatch) return null;
  const cleanedDate = dateMatch[0].toUpperCase().replace(/[\s,]/g, '');
  return `${cleanedSubject}-${cleanedDate}`;
}

// MAIN FUNCTION: Finds, de-duplicates, and forwards invitations, with a final count.
function autoForwardInvitations() {
  const primaryEmail = 'YOUR_PRIMARY_EMAIL@gmail.com'; // <-- IMPORTANT: Replace with your primary email address
  const processedEventsLog = PropertiesService.getScriptProperties();
  const searchQuery = '{(subject:"Reminder:") (subject:"Confirmed") "Thank you for registering" "You are registered" "look forward to meeting you at" "event details are as follows" "starts tomorrow"} -{"Register Now" "Register Here" "Learn More & Register" "You\'re Invited"}';

  let forwardedCount = 0;
  const threads = GmailApp.search(searchQuery);

  if (threads.length === 0) {
    console.log("No new candidate emails found.");
    return;
  }

  const processedThreadIds = [];
  for (const thread of threads) {
    const threadLogKey = `thread-id-${thread.getId()}`;
    if (processedEventsLog.getProperty(threadLogKey)) {
      continue;
    }
    
    const message = thread.getMessages()[0];
    const subject = message.getSubject();
    const body = message.getPlainBody();
    const eventFingerprint = createEventFingerprint(subject, body);
    
    if (eventFingerprint) {
      if (processedEventsLog.getProperty(eventFingerprint)) {
        console.log(`Duplicate event found. Fingerprint: ${eventFingerprint}. Skipping.`);
        processedEventsLog.setProperty(threadLogKey, new Date().toISOString());
      } else {
        message.forward(primaryEmail);
        processedEventsLog.setProperty(eventFingerprint, new Date().toISOString());
        processedEventsLog.setProperty(threadLogKey, new Date().toISOString());
        forwardedCount++;
        console.log(`Successfully forwarded and logged event with subject: "${subject}"`);
      }
    }
  }

  if (forwardedCount > 0) {
    console.log(`Execution complete. Total new emails forwarded in this run: ${forwardedCount}`);
  }
}
