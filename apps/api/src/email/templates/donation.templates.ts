export type DonationEmailType = 'GENERAL' | 'TAX' | 'KIND';

export interface DonationTemplateParams {
  donorName: string;
  receiptNumber: string;
  donationAmount?: number;
  currency?: string;
  donationDate?: Date;
  donationMode?: string;
  donationType?: string;
  donorPAN?: string;
  kindDescription?: string;
  org: {
    name: string;
    regNumber?: string;
    phone1?: string;
    phone2?: string;
    email?: string;
    website?: string;
    tagline1?: string;
    tagline2?: string;
  };
}

const NAVY = '#1F3B64';
const WHITE = '#FFFFFF';
const BG_LIGHT = '#F4F6F8';
const BORDER = '#D9E0E6';
const CHARCOAL = '#2E3440';
const CHARCOAL_LIGHT = '#4A5568';
const GOLD = '#C9A96E';

function formatAmount(amount?: number, currency?: string): string {
  if (!amount) return '';
  const sym = currency === 'USD' ? '$' : '₹';
  return `${sym}${amount.toLocaleString('en-IN')}`;
}

function formatDate(date?: Date): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatMode(mode?: string): string {
  if (!mode) return '';
  const map: Record<string, string> = {
    CASH: 'Cash',
    UPI: 'UPI',
    GPAY: 'Google Pay',
    PHONEPE: 'PhonePe',
    BANK_TRANSFER: 'Bank Transfer',
    CHEQUE: 'Cheque',
    ONLINE: 'Online',
  };
  return map[mode] || mode;
}

function baseLayout(params: DonationTemplateParams, bodyContent: string): string {
  const { org } = params;
  const phoneDisplay = org.phone2 ? `${org.phone1} / ${org.phone2}` : (org.phone1 || '');
  const regLine = org.regNumber ? `Reg. No. ${org.regNumber}` : (org.tagline2 || '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${org.name}</title>
</head>
<body style="margin:0;padding:0;background-color:${BG_LIGHT};font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
  <div style="width:100%;background-color:${BG_LIGHT};padding:32px 0;">
    <div style="max-width:600px;margin:0 auto;background-color:${WHITE};border:1px solid ${BORDER};border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <div style="background-color:${NAVY};padding:32px 40px 24px 40px;text-align:center;">
        <h1 style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:${WHITE};letter-spacing:0.4px;line-height:1.3;">
          ${org.name}
        </h1>
        <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.65);letter-spacing:0.3px;">
          ${regLine}
        </p>
        <div style="margin:20px auto 0 auto;width:40px;height:2px;background-color:${GOLD};border-radius:1px;"></div>
      </div>

      <!-- BODY -->
      <div style="padding:36px 40px;">
        ${bodyContent}
      </div>

      <!-- FOOTER -->
      <div style="background-color:${BG_LIGHT};border-top:1px solid ${BORDER};padding:20px 40px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="font-size:12px;color:${CHARCOAL_LIGHT};padding-bottom:3px;"><strong style="color:${CHARCOAL};">Phone</strong>&nbsp;&nbsp;${phoneDisplay}</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:${CHARCOAL_LIGHT};padding-bottom:3px;"><strong style="color:${CHARCOAL};">Email</strong>&nbsp;&nbsp;<a href="mailto:${org.email}" style="color:${NAVY};text-decoration:none;">${org.email || ''}</a></td>
          </tr>
          <tr>
            <td style="font-size:12px;color:${CHARCOAL_LIGHT};"><strong style="color:${CHARCOAL};">Website</strong>&nbsp;&nbsp;<a href="https://${org.website}" style="color:${NAVY};text-decoration:none;">${org.website || ''}</a></td>
          </tr>
        </table>
      </div>

      <!-- DISCLAIMER -->
      <div style="padding:12px 40px;text-align:center;border-top:1px solid ${BORDER};">
        <p style="margin:0;font-size:11px;color:#A0AEC0;font-style:italic;">This is an automated communication. Please do not reply to this email.</p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

function summaryBox(rows: { label: string; value: string }[]): string {
  const rowsHtml = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:9px 0;font-size:13px;color:${CHARCOAL_LIGHT};border-bottom:1px solid ${BORDER};width:45%;">${r.label}</td>
        <td style="padding:9px 0;font-size:13px;color:${CHARCOAL};font-weight:600;border-bottom:1px solid ${BORDER};text-align:right;">${r.value}</td>
      </tr>`,
    )
    .join('');

  return `
  <div style="margin:28px 0;background-color:${BG_LIGHT};border:1px solid ${BORDER};border-radius:6px;padding:18px 22px;">
    <p style="margin:0 0 12px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:${NAVY};">Donation Summary</p>
    <table style="width:100%;border-collapse:collapse;">
      ${rowsHtml}
    </table>
  </div>`;
}

export function getGeneralThankYouTemplate(params: DonationTemplateParams): { subject: string; html: string; text: string } {
  const { donorName, receiptNumber, donationAmount, currency, donationDate, donationMode, org } = params;

  const rows: { label: string; value: string }[] = [
    { label: 'Reference / Receipt No.', value: receiptNumber },
  ];
  if (donationAmount) rows.push({ label: 'Donation Amount', value: formatAmount(donationAmount, currency) });
  if (donationDate) rows.push({ label: 'Date', value: formatDate(donationDate) });
  if (donationMode) rows.push({ label: 'Payment Mode', value: formatMode(donationMode) });

  const body = `
    <p style="margin:0 0 20px 0;font-size:16px;color:${CHARCOAL};line-height:1.5;">
      Dear <strong>${donorName}</strong>,
    </p>

    <p style="margin:0 0 16px 0;font-size:14px;color:${CHARCOAL_LIGHT};line-height:1.75;">
      Thank you for your generous contribution to <strong style="color:${CHARCOAL};">${org.name}</strong>.
      Your support means a great deal to us and to the many lives we serve together.
    </p>

    <p style="margin:0 0 16px 0;font-size:14px;color:${CHARCOAL_LIGHT};line-height:1.75;">
      ${org.tagline1 ? `Our mission — <em>${org.tagline1}</em> — is made possible by the kindness of donors like you.` : 'We remain committed to our mission of serving those in need, and your generosity strengthens that commitment.'}
    </p>

    <p style="margin:0 0 8px 0;font-size:14px;color:${CHARCOAL_LIGHT};line-height:1.75;">
      Please find your donation receipt attached for your records.
    </p>

    ${summaryBox(rows)}

    <p style="margin:24px 0 6px 0;font-size:14px;color:${CHARCOAL_LIGHT};">With gratitude,</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${NAVY};">${org.name}</p>
  `;

  return {
    subject: `Thank you for your donation — ${org.name}`,
    html: baseLayout(params, body),
    text: `Dear ${donorName},\n\nThank you for your generous contribution to ${org.name}.\n\nReceipt No: ${receiptNumber}\nAmount: ${formatAmount(donationAmount, currency)}\nDate: ${formatDate(donationDate)}\nMode: ${formatMode(donationMode)}\n\nWith gratitude,\n${org.name}`,
  };
}

export function getTaxReceiptTemplate(params: DonationTemplateParams): { subject: string; html: string; text: string } {
  const { donorName, receiptNumber, donationAmount, currency, donationDate, donationMode, donorPAN, org } = params;

  const rows: { label: string; value: string }[] = [
    { label: 'Receipt Number', value: receiptNumber },
  ];
  if (donationAmount) rows.push({ label: 'Donation Amount', value: formatAmount(donationAmount, currency) });
  if (donationDate) rows.push({ label: 'Date', value: formatDate(donationDate) });
  if (donationMode) rows.push({ label: 'Payment Mode', value: formatMode(donationMode) });
  if (donorPAN) rows.push({ label: "Donor's PAN", value: donorPAN });

  const body = `
    <p style="margin:0 0 20px 0;font-size:16px;color:${CHARCOAL};line-height:1.5;">
      Dear <strong>${donorName}</strong>,
    </p>

    <p style="margin:0 0 16px 0;font-size:14px;color:${CHARCOAL_LIGHT};line-height:1.75;">
      Thank you for your valued donation to <strong style="color:${CHARCOAL};">${org.name}</strong>.
      We sincerely appreciate your continued support towards our mission.
    </p>

    <p style="margin:0 0 16px 0;font-size:14px;color:${CHARCOAL_LIGHT};line-height:1.75;">
      Please find your official donation receipt attached to this email. You will require it for tax filing purposes.
    </p>

    ${summaryBox(rows)}

    <!-- 80G Notice -->
    <div style="margin:0 0 24px 0;padding:16px 20px;border-left:3px solid ${GOLD};background-color:#FFFDF7;border-radius:0 4px 4px 0;">
      <p style="margin:0 0 6px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:${NAVY};">80G Tax Exemption</p>
      <p style="margin:0;font-size:13px;color:${CHARCOAL_LIGHT};line-height:1.65;">
        This donation is eligible for tax deduction under <strong>Section 80G</strong> of the Income Tax Act, 1961.
        Please retain your receipt as valid proof for your income tax return.
      </p>
    </div>

    <p style="margin:0 0 16px 0;font-size:14px;color:${CHARCOAL_LIGHT};line-height:1.75;">
      Should you need any clarification regarding the tax certificate or your donation record,
      please do not hesitate to contact us.
    </p>

    <p style="margin:24px 0 6px 0;font-size:14px;color:${CHARCOAL_LIGHT};">With appreciation,</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${NAVY};">${org.name}</p>
  `;

  return {
    subject: `Donation Receipt & Tax Certificate — ${org.name}`,
    html: baseLayout(params, body),
    text: `Dear ${donorName},\n\nThank you for your donation to ${org.name}.\n\nReceipt No: ${receiptNumber}\nAmount: ${formatAmount(donationAmount, currency)}\nDate: ${formatDate(donationDate)}\nMode: ${formatMode(donationMode)}${donorPAN ? `\nPAN: ${donorPAN}` : ''}\n\n80G Tax Exemption: This donation is eligible for deduction under Section 80G of the Income Tax Act, 1961.\n\nWith appreciation,\n${org.name}`,
  };
}

export function getKindDonationTemplate(params: DonationTemplateParams): { subject: string; html: string; text: string } {
  const { donorName, receiptNumber, donationDate, donationType, kindDescription, org } = params;

  const itemLabel = kindDescription || donationType || 'In-Kind Donation';

  const rows: { label: string; value: string }[] = [
    { label: 'Reference No.', value: receiptNumber },
    { label: 'Nature of Donation', value: itemLabel },
  ];
  if (donationDate) rows.push({ label: 'Date', value: formatDate(donationDate) });

  const body = `
    <p style="margin:0 0 20px 0;font-size:16px;color:${CHARCOAL};line-height:1.5;">
      Dear <strong>${donorName}</strong>,
    </p>

    <p style="margin:0 0 16px 0;font-size:14px;color:${CHARCOAL_LIGHT};line-height:1.75;">
      On behalf of <strong style="color:${CHARCOAL};">${org.name}</strong>, we extend our heartfelt gratitude
      for your generous in-kind contribution. Your thoughtful support makes a direct and meaningful impact
      on the lives of those in our care.
    </p>

    <p style="margin:0 0 16px 0;font-size:14px;color:${CHARCOAL_LIGHT};line-height:1.75;">
      Donations of <strong style="color:${CHARCOAL};">${itemLabel}</strong> go directly towards supporting
      the daily needs of our residents — children, the elderly, and those who depend on our homes for shelter and care.
    </p>

    ${summaryBox(rows)}

    <p style="margin:0 0 16px 0;font-size:14px;color:${CHARCOAL_LIGHT};line-height:1.75;">
      We are truly grateful for your kindness and generosity. It is the compassion of supporters like you
      that keeps our work going.
    </p>

    <p style="margin:24px 0 6px 0;font-size:14px;color:${CHARCOAL_LIGHT};">With warm regards,</p>
    <p style="margin:0;font-size:15px;font-weight:700;color:${NAVY};">${org.name}</p>
  `;

  return {
    subject: `Thank you for your kind donation — ${org.name}`,
    html: baseLayout(params, body),
    text: `Dear ${donorName},\n\nThank you for your in-kind contribution to ${org.name}.\n\nReference No: ${receiptNumber}\nNature of Donation: ${itemLabel}\nDate: ${formatDate(donationDate)}\n\nWith warm regards,\n${org.name}`,
  };
}

export function getDonationEmailTemplate(
  type: DonationEmailType,
  params: DonationTemplateParams,
): { subject: string; html: string; text: string } {
  switch (type) {
    case 'TAX':
      return getTaxReceiptTemplate(params);
    case 'KIND':
      return getKindDonationTemplate(params);
    case 'GENERAL':
    default:
      return getGeneralThankYouTemplate(params);
  }
}
