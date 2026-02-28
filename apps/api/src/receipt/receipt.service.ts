import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { addReceiptBranding, addReceiptFooterBranding } from '../common/pdf-branding';

export interface ReceiptData {
  receiptNumber: string;
  donationDate: Date;
  donorName: string;
  donationAmount: number;
  currency: string;
  paymentMode?: string | null;
  donationType: string;
  remarks?: string;
  donorAddress?: string;
  donorEmail?: string;
  donorPAN?: string;
  transactionRef?: string;
}

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);
  
  constructor(private orgProfileService: OrganizationProfileService) {}

  private numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    if (num < 0) return 'Minus ' + this.numberToWords(-num);
    
    const convert = (n: number): string => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };
    
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    
    let result = convert(rupees) + ' Rupees';
    if (paise > 0) {
      result += ' and ' + convert(paise) + ' Paise';
    }
    result += ' Only';
    
    return result;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private formatPaymentMode(mode: string | null | undefined): string {
    if (!mode) return 'N/A';
    const map: Record<string, string> = { 
      'CASH': 'Cash', 
      'UPI': 'UPI', 
      'GPAY': 'Google Pay', 
      'PHONEPE': 'PhonePe', 
      'BANK_TRANSFER': 'Bank Transfer', 
      'CHEQUE': 'Cheque', 
      'ONLINE': 'Online' 
    };
    return map[mode] || mode;
  }

  async generateReceiptPDF(data: ReceiptData): Promise<Buffer> {
    const orgProfile = await this.orgProfileService.getProfile();
    this.logger.log(`[Receipt PDF] Generating receipt for ${data.receiptNumber}`);
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margin: 60, 
          autoFirstPage: true,
          bufferPages: true
        });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 60;
        const contentWidth = pageWidth - margin * 2;
        const primaryColor = orgProfile.brandingPrimaryColor || '#2E7D32';

        const borderMargin = 30;
        doc.strokeColor(primaryColor).lineWidth(2);
        doc.rect(borderMargin, borderMargin, pageWidth - borderMargin * 2, pageHeight - borderMargin * 2).stroke();

        let y = addReceiptBranding(doc, orgProfile, { y: margin, contentWidth, margin });

        doc.font('Helvetica-Bold').fontSize(16).fillColor(primaryColor);
        doc.text('DONATION RECEIPT', margin, y, { align: 'center', width: contentWidth });
        y = doc.y + 8;

        const titleLineY = y;
        doc.save();
        doc.strokeColor(primaryColor).lineWidth(2);
        doc.moveTo(margin + contentWidth * 0.3, titleLineY).lineTo(margin + contentWidth * 0.7, titleLineY).stroke();
        doc.restore();
        y += 25;

        const labelX = margin + 14;
        const labelWidth = 130;
        const valueX = margin + labelWidth + 20;
        const valueWidth = contentWidth - labelWidth - 34;
        const rowHeight = 28;
        let rowIndex = 0;

        const drawRow = (label: string, value: string, bold = false) => {
          if (rowIndex % 2 === 0) {
            doc.save();
            doc.rect(margin, y - 4, contentWidth, rowHeight).fill('#e8f5e9');
            doc.restore();
          }
          doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor);
          doc.text(label, labelX, y + 5, { width: labelWidth });
          doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(11).fillColor('#1a1a1a');
          doc.text(value, valueX, y + 4, { width: valueWidth });
          y = Math.max(y + rowHeight, doc.y + 6);
          rowIndex++;
        };

        drawRow('Receipt No.', data.receiptNumber, true);
        drawRow('Date', this.formatDate(data.donationDate));
        drawRow('Donor Name', data.donorName, true);

        const amountFormatted = `Rs. ${data.donationAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        const amountWords = this.numberToWords(data.donationAmount);
        drawRow('Amount', amountFormatted, true);
        doc.font('Helvetica').fontSize(8).fillColor('#777777');
        doc.text(`(${amountWords})`, valueX, y - 6, { width: valueWidth });
        y = doc.y + 6;

        drawRow('Payment Mode', this.formatPaymentMode(data.paymentMode));

        if (data.transactionRef) {
          drawRow('Transaction Ref', data.transactionRef);
        }

        if (data.donorPAN) {
          drawRow('Donor PAN', data.donorPAN);
        }

        y += 20;

        const taxBoxPadding = 14;
        const taxBoxX = margin;
        const section80GLines = doc.font('Helvetica').fontSize(9).heightOfString(
          orgProfile.section80GText || '', { width: contentWidth - taxBoxPadding * 2 }
        );
        const taxBoxHeight = section80GLines + 50;

        doc.save();
        doc.roundedRect(taxBoxX, y, contentWidth, taxBoxHeight, 4).fill('#e8f5e9');
        doc.restore();

        doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor);
        doc.text('TAX EXEMPTION (Section 80G)', taxBoxX + taxBoxPadding, y + taxBoxPadding, {
          width: contentWidth - taxBoxPadding * 2,
        });

        doc.font('Helvetica').fontSize(9).fillColor('#333333');
        doc.text(`PAN: ${orgProfile.pan}`, taxBoxX + taxBoxPadding, doc.y + 6, {
          width: contentWidth - taxBoxPadding * 2,
        });

        if (orgProfile.section80GText) {
          doc.font('Helvetica').fontSize(8).fillColor('#555555');
          doc.text(orgProfile.section80GText, taxBoxX + taxBoxPadding, doc.y + 6, {
            width: contentWidth - taxBoxPadding * 2,
          });
        }

        y += taxBoxHeight + 22;

        if (orgProfile.homes && orgProfile.homes.length > 0) {
          const homesList = orgProfile.homes.join('  |  ');
          const homesFont = 6.5;
          const homesBarPadding = 10;
          const fullWidth = pageWidth - borderMargin * 2;
          doc.font('Helvetica').fontSize(homesFont);
          const textHeight = doc.heightOfString(homesList, { width: fullWidth - homesBarPadding * 2 });
          const homesBarHeight = textHeight + 18;

          doc.save();
          doc.rect(borderMargin, y, fullWidth, homesBarHeight).fill(primaryColor);
          doc.restore();

          doc.font('Helvetica-Bold').fontSize(7).fillColor('#ffffff');
          doc.text('OUR HOMES', borderMargin + homesBarPadding, y + 4, { align: 'center', width: fullWidth - homesBarPadding * 2 });

          doc.font('Helvetica').fontSize(homesFont).fillColor('#ffffff');
          doc.text(homesList, borderMargin + homesBarPadding, doc.y + 2, { align: 'center', width: fullWidth - homesBarPadding * 2 });
          y += homesBarHeight + 18;
        }

        addReceiptFooterBranding(doc, orgProfile, { y, contentWidth, margin });

        doc.end();
        this.logger.log(`[Receipt PDF] Receipt generated successfully`);
      } catch (error) {
        this.logger.error(`[Receipt PDF] Error generating receipt: ${error}`);
        reject(error);
      }
    });
  }
}
