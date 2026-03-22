"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSponsorshipDueTemplate = getSponsorshipDueTemplate;
function getSponsorshipDueTemplate(donorName, beneficiaryName, amount, homeName, daysUntil, org) {
    let subject = "";
    let message = "";
    if (daysUntil === 0) {
        subject = "Sponsorship Due Today";
        message = `Your sponsorship for ${beneficiaryName} is due today.`;
    }
    else if (daysUntil < 0) {
        subject = "Sponsorship Overdue Reminder";
        message = `Your sponsorship for ${beneficiaryName} is overdue.`;
    }
    else {
        subject = "Upcoming Sponsorship Reminder";
        message = `Your sponsorship is due in ${daysUntil} days.`;
    }
    const body = `
  <div style="font-family:Arial">
    <p>Dear ${donorName},</p>
    <p>${message}</p>
    <p>Your support for ${beneficiaryName} at ${homeName} means a lot.</p>
    <p>Warm regards,<br/>${org.name}</p>
  </div>
  `;
    return { subject, body };
}
//# sourceMappingURL=sponsorship.template.js.map