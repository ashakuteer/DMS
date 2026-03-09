export function getSpecialDayTemplate(
  donorName: string,
  occasionType: string,
  personName: string | null | undefined,
  daysUntil: number,
  org: any
) {
  const phoneDisplay = org.phone2
    ? `${org.phone1} / ${org.phone2}`
    : org.phone1;

  const prefix =
    daysUntil === 0
      ? "Today"
      : daysUntil === 1
      ? "Tomorrow"
      : `In ${daysUntil} days`;

  let subject = "";
  let greeting = "";

  switch (occasionType) {
    case "DOB_SELF":
      subject = `Happy Birthday from ${org.name}`;
      greeting =
        daysUntil === 0
          ? "Wishing you a very happy birthday!"
          : `${prefix}, we celebrate your birthday!`;
      break;

    case "FAMILY_BIRTHDAY":
      subject = `Birthday Wishes for ${personName}`;
      greeting =
        daysUntil === 0
          ? `Wishing ${personName} a happy birthday!`
          : `${prefix}, we celebrate ${personName}'s birthday.`;
      break;

    case "ANNIVERSARY":
      subject = `Happy Anniversary from ${org.name}`;
      greeting =
        daysUntil === 0
          ? "Happy anniversary!"
          : `${prefix}, we celebrate your anniversary.`;
      break;

    default:
      subject = `Warm Wishes from ${org.name}`;
      greeting = "We hope you are doing well.";
  }

  const body = `
  <div style="font-family:Arial">
    <p>Dear ${donorName},</p>
    <p>${greeting}</p>
    <p>Your support for ${org.name} is deeply appreciated.</p>
    <p>Warm regards,<br/><strong>${org.name}</strong></p>
    <hr/>
    <p>Phone: ${phoneDisplay}<br/>Email: ${org.email}</p>
  </div>
  `;

  return { subject, body };
}
