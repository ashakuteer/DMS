"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPledgeTemplate = getPledgeTemplate;
function getPledgeTemplate(donorName, pledge, daysUntil, org) {
    const pledgeItem = pledge.pledgeType === "MONEY"
        ? `₹${pledge.amount?.toLocaleString("en-IN")}`
        : pledge.quantity || "your pledge";
    let subject = "";
    let message = "";
    if (daysUntil < 0) {
        subject = "Pledge Reminder";
        message = `Your pledge of ${pledgeItem} was expected earlier.`;
    }
    else if (daysUntil === 0) {
        subject = "Today: Your pledge reminder";
        message = `Today is the expected date for your pledge of ${pledgeItem}.`;
    }
    else {
        subject = "Upcoming pledge reminder";
        message = `Your pledge of ${pledgeItem} is due in ${daysUntil} days.`;
    }
    const body = `
  <div style="font-family:Arial">
    <p>Dear ${donorName},</p>
    <p>${message}</p>
    <p>Your support helps us serve many lives.</p>
    <p>Warm regards,<br/>${org.name}</p>
  </div>
  `;
    return { subject, body };
}
//# sourceMappingURL=pledge.template.js.map