"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBeneficiaryBirthdayTemplate = getBeneficiaryBirthdayTemplate;
function getBeneficiaryBirthdayTemplate(donorName, beneficiaryName, homeName, updateSnippet, daysUntil, org) {
    let subject = "";
    let intro = "";
    if (daysUntil === 0) {
        subject = `${beneficiaryName}'s Birthday Today`;
        intro = `${beneficiaryName} from ${homeName} is celebrating today.`;
    }
    else if (daysUntil === 2) {
        subject = `${beneficiaryName}'s Birthday in 2 Days`;
        intro = `${beneficiaryName}'s birthday is coming up in 2 days.`;
    }
    else {
        subject = `${beneficiaryName}'s Birthday Soon`;
        intro = `${beneficiaryName}'s birthday is coming up soon.`;
    }
    const body = `
  <div style="font-family:Arial">
    <p>Dear ${donorName},</p>
    <p>${intro}</p>
    <p>Recent update: <em>${updateSnippet}</em></p>
    <p>Your sponsorship is changing lives.</p>
    <p>Warm regards,<br/>${org.name}</p>
  </div>
  `;
    return { subject, body };
}
//# sourceMappingURL=beneficiary-birthday.template.js.map