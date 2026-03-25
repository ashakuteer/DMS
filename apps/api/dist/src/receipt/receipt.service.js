"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ReceiptService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptService = void 0;
exports.isInKindDonation = isInKindDonation;
const common_1 = require("@nestjs/common");
const pdfkit_1 = __importDefault(require("pdfkit"));
const organization_profile_service_1 = require("../organization-profile/organization-profile.service");
const pdf_branding_1 = require("../common/pdf-branding");
const fs = __importStar(require("fs"));
const NAVY = '#243A5E';
const NAVY_LIGHT = '#3B5998';
const GREY_BG = '#F4F6F9';
const GREY_RULE = '#D8DEE8';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1A202C';
const TEXT_MID = '#4A5568';
const TEXT_SOFT = '#718096';
const AMBER = '#B45309';
const AMBER_BG = '#FFFBEB';
const IN_KIND_TYPES = new Set(['GROCERY', 'MEDICINES', 'PREPARED_FOOD', 'USED_ITEMS', 'KIND']);
function isInKindDonation(donationType) {
    return IN_KIND_TYPES.has(donationType?.toUpperCase());
}
let ReceiptService = ReceiptService_1 = class ReceiptService {
    constructor(orgProfileService) {
        this.orgProfileService = orgProfileService;
        this.logger = new common_1.Logger(ReceiptService_1.name);
    }
    numberToWords(num) {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
            'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        if (num === 0)
            return 'Zero';
        if (num < 0)
            return 'Minus ' + this.numberToWords(-num);
        const convert = (n) => {
            if (n < 20)
                return ones[n];
            if (n < 100)
                return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
            if (n < 1000)
                return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
            if (n < 100000)
                return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
            if (n < 10000000)
                return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
            return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
        };
        const rupees = Math.floor(num);
        const paise = Math.round((num - rupees) * 100);
        let result = convert(rupees) + ' Rupees';
        if (paise > 0)
            result += ' and ' + convert(paise) + ' Paise';
        result += ' Only';
        return result;
    }
    formatDate(date) {
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    }
    formatPaymentMode(mode) {
        if (!mode)
            return 'N/A';
        const map = {
            'CASH': 'Cash', 'UPI': 'UPI', 'GPAY': 'Google Pay', 'PHONEPE': 'PhonePe',
            'BANK_TRANSFER': 'Bank Transfer', 'CHEQUE': 'Cheque', 'ONLINE': 'Online',
        };
        return map[mode] || mode;
    }
    formatDonationType(type) {
        const map = {
            'CASH': 'Cash Donation', 'GROCERY': 'Grocery', 'MEDICINES': 'Medicines',
            'PREPARED_FOOD': 'Prepared Food', 'USED_ITEMS': 'Used Items', 'KIND': 'In-Kind Donation',
        };
        return map[type] || type;
    }
    formatHome(home) {
        if (!home || home === 'NONE')
            return 'General';
        const map = {
            'GIRLS_HOME': 'Girls Home', 'BLIND_BOYS_HOME': 'Blind Boys Home',
            'OLD_AGE_HOME': 'Old Age Home', 'GENERAL': 'General',
        };
        return map[home] || home;
    }
    drawHeader(doc, profile, margin, contentWidth) {
        const pageWidth = doc.page.width;
        const headerH = 100;
        const y = margin;
        doc.save();
        doc.rect(margin, y, contentWidth, headerH).fill(NAVY);
        doc.restore();
        let logoEndX = margin + 16;
        const logoPath = (0, pdf_branding_1.resolveLogoPath)(profile.logoUrl);
        if (logoPath) {
            try {
                const logoBuffer = fs.readFileSync(logoPath);
                const logoSize = 72;
                const logoY = y + (headerH - logoSize) / 2;
                doc.image(logoBuffer, margin + 16, logoY, { width: logoSize, height: logoSize });
                logoEndX = margin + 16 + logoSize + 14;
            }
            catch { }
        }
        const textW = pageWidth - margin * 2 - (logoEndX - margin) - 16;
        const textY = y + 18;
        doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(17);
        doc.text(profile.name, logoEndX, textY, { width: textW });
        if (profile.tagline1) {
            doc.fillColor('#B8C8E8').font('Helvetica').fontSize(9);
            doc.text(profile.tagline1, logoEndX, textY + 23, { width: textW });
        }
        if (profile.email || profile.phone1) {
            const contact = [profile.phone1, profile.email].filter(Boolean).join('  |  ');
            doc.fillColor('#8BA0C0').font('Helvetica').fontSize(8);
            doc.text(contact, logoEndX, textY + 38, { width: textW });
        }
        return y + headerH;
    }
    drawTitleBand(doc, title, subtitle, margin, contentWidth, y) {
        const bandH = 38;
        doc.save();
        doc.rect(margin, y, contentWidth, bandH).fill(GREY_BG);
        doc.restore();
        doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(13);
        doc.text(title, margin, y + 10, { width: contentWidth, align: 'center' });
        doc.fillColor(TEXT_SOFT).font('Helvetica').fontSize(8);
        doc.text(subtitle, margin, y + 26, { width: contentWidth, align: 'center' });
        return y + bandH;
    }
    drawField(doc, label, value, margin, contentWidth, y, rowIndex, bold = false) {
        const rowH = 30;
        const labelW = 140;
        const valueX = margin + labelW + 10;
        const valueW = contentWidth - labelW - 10;
        if (rowIndex % 2 === 0) {
            doc.save();
            doc.rect(margin, y, contentWidth, rowH).fill(GREY_BG);
            doc.restore();
        }
        doc.fillColor(TEXT_SOFT).font('Helvetica').fontSize(9);
        doc.text(label, margin + 10, y + 9, { width: labelW });
        doc.fillColor(TEXT_DARK).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
        doc.text(value, valueX, y + 8, { width: valueW });
        return y + rowH;
    }
    drawRule(doc, margin, contentWidth, y) {
        doc.save();
        doc.strokeColor(GREY_RULE).lineWidth(0.75);
        doc.moveTo(margin, y).lineTo(margin + contentWidth, y).stroke();
        doc.restore();
        return y + 1;
    }
    drawFooter(doc, profile, margin, contentWidth, y, isSystem = true) {
        y += 10;
        this.drawRule(doc, margin, contentWidth, y);
        y += 12;
        const signaturePath = (0, pdf_branding_1.resolveLocalFile)(profile.signatureImageUrl ?? null);
        if (signaturePath && fs.existsSync(signaturePath)) {
            try {
                const sigBuffer = fs.readFileSync(signaturePath);
                doc.image(sigBuffer, margin + contentWidth - 110, y, { width: 90 });
                doc.fillColor(TEXT_SOFT).font('Helvetica').fontSize(8);
                doc.text('Authorised Signatory', margin + contentWidth - 120, y + 52, {
                    width: 110, align: 'center',
                });
            }
            catch { }
        }
        const contactParts = [];
        if (profile.phone1)
            contactParts.push(`Tel: ${profile.phone1}`);
        if (profile.email)
            contactParts.push(`Email: ${profile.email}`);
        if (profile.website)
            contactParts.push(`Web: ${profile.website}`);
        doc.fillColor(TEXT_MID).font('Helvetica').fontSize(8.5);
        for (const part of contactParts) {
            doc.text(part, margin, y, { width: contentWidth - 130 });
            y = doc.y + 2;
        }
        y += 10;
        if (isSystem) {
            doc.fillColor(TEXT_SOFT).font('Helvetica').fontSize(7.5);
            doc.text('This is a computer-generated document. No signature is required unless stated.', margin, y, {
                width: contentWidth, align: 'center',
            });
            y = doc.y + 4;
        }
        if (profile.reportFooterText) {
            doc.fillColor(TEXT_SOFT).font('Helvetica').fontSize(7);
            doc.text(profile.reportFooterText, margin, y, { width: contentWidth, align: 'center' });
        }
        return doc.y;
    }
    drawHomesBar(doc, profile, margin, contentWidth, y) {
        if (!profile.homes || profile.homes.length === 0)
            return y;
        const homesList = profile.homes.join('  ·  ');
        const barH = 28;
        doc.save();
        doc.rect(margin, y, contentWidth, barH).fill(NAVY);
        doc.restore();
        doc.fillColor('#8BA0C0').font('Helvetica-Bold').fontSize(6.5);
        doc.text('OUR HOMES', margin, y + 5, { width: contentWidth, align: 'center' });
        doc.fillColor(WHITE).font('Helvetica').fontSize(7.5);
        doc.text(homesList, margin, y + 14, { width: contentWidth, align: 'center' });
        return y + barH + 12;
    }
    async generateReceiptPDF(data) {
        const orgProfile = await this.orgProfileService.getProfile();
        this.logger.log(`[Receipt PDF] Generating ${data.receiptType || 'GENERAL'} receipt for ${data.receiptNumber}`);
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({ size: 'A4', margin: 50, bufferPages: true });
                const chunks = [];
                doc.on('data', (c) => chunks.push(c));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);
                const margin = 50;
                const contentWidth = doc.page.width - margin * 2;
                const isTax = data.receiptType === 'TAX';
                let y = this.drawHeader(doc, orgProfile, margin, contentWidth);
                y += 12;
                y = this.drawTitleBand(doc, 'DONATION RECEIPT', isTax ? 'Official Receipt with Section 80G Tax Exemption' : 'General Donation Receipt — Thank You for Your Generosity', margin, contentWidth, y);
                y += 14;
                let row = 0;
                y = this.drawField(doc, 'Receipt Number', data.receiptNumber, margin, contentWidth, y, row++, true);
                y = this.drawField(doc, 'Date', this.formatDate(data.donationDate), margin, contentWidth, y, row++);
                y = this.drawField(doc, 'Donor Name', data.donorName, margin, contentWidth, y, row++, true);
                if (data.donorAddress) {
                    y = this.drawField(doc, 'Address', data.donorAddress, margin, contentWidth, y, row++);
                }
                if (isTax && data.donorPAN) {
                    y = this.drawField(doc, 'Donor PAN', data.donorPAN, margin, contentWidth, y, row++);
                }
                y += 4;
                this.drawRule(doc, margin, contentWidth, y);
                y += 10;
                const amountFormatted = `₹ ${data.donationAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                y = this.drawField(doc, 'Amount', amountFormatted, margin, contentWidth, y, row++, true);
                const words = this.numberToWords(data.donationAmount);
                doc.fillColor(TEXT_SOFT).font('Helvetica').fontSize(8);
                doc.text(`(${words})`, margin + 150, y - 10, { width: contentWidth - 150 });
                y += 2;
                y = this.drawField(doc, 'Payment Mode', this.formatPaymentMode(data.paymentMode), margin, contentWidth, y, row++);
                y = this.drawField(doc, 'Purpose', this.formatDonationType(data.donationType), margin, contentWidth, y, row++);
                if (data.designatedHome && data.designatedHome !== 'NONE') {
                    y = this.drawField(doc, 'Designated To', this.formatHome(data.designatedHome), margin, contentWidth, y, row++);
                }
                if (data.transactionRef) {
                    y = this.drawField(doc, 'Transaction Ref.', data.transactionRef, margin, contentWidth, y, row++);
                }
                if (data.remarks) {
                    y = this.drawField(doc, 'Notes', data.remarks, margin, contentWidth, y, row++);
                }
                y += 18;
                if (isTax) {
                    const boxPad = 14;
                    const section80GText = orgProfile.section80GText || '';
                    const textH = doc.font('Helvetica').fontSize(8.5).heightOfString(section80GText || ' ', {
                        width: contentWidth - boxPad * 2,
                    });
                    const boxH = textH + 70;
                    doc.save();
                    doc.rect(margin, y, contentWidth, boxH).fill(GREY_BG);
                    doc.restore();
                    doc.save();
                    doc.rect(margin, y, 4, boxH).fill(NAVY);
                    doc.restore();
                    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10);
                    doc.text('TAX EXEMPTION — Section 80G of the Income Tax Act, 1961', margin + boxPad, y + boxPad, {
                        width: contentWidth - boxPad * 2,
                    });
                    if (orgProfile.pan) {
                        doc.fillColor(TEXT_DARK).font('Helvetica-Bold').fontSize(9.5);
                        doc.text(`Organisation PAN: ${orgProfile.pan}`, margin + boxPad, doc.y + 6, {
                            width: contentWidth - boxPad * 2,
                        });
                    }
                    if (section80GText) {
                        doc.fillColor(TEXT_MID).font('Helvetica').fontSize(8.5);
                        doc.text(section80GText, margin + boxPad, doc.y + 8, {
                            width: contentWidth - boxPad * 2,
                        });
                    }
                    y += boxH + 16;
                }
                else {
                    const boxPad = 14;
                    const msgBoxH = 54;
                    doc.save();
                    doc.rect(margin, y, contentWidth, msgBoxH).fill(GREY_BG);
                    doc.restore();
                    doc.save();
                    doc.rect(margin, y, 4, msgBoxH).fill(NAVY_LIGHT);
                    doc.restore();
                    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(10);
                    doc.text('Thank you for your generous contribution!', margin + boxPad, y + boxPad, {
                        width: contentWidth - boxPad * 2,
                    });
                    doc.fillColor(TEXT_MID).font('Helvetica').fontSize(8.5);
                    doc.text('Your donation makes a direct difference in the lives of the people we serve. We are truly grateful for your continued support.', margin + boxPad, doc.y + 4, { width: contentWidth - boxPad * 2 });
                    y += msgBoxH + 16;
                }
                y = this.drawHomesBar(doc, orgProfile, margin, contentWidth, y);
                this.drawFooter(doc, orgProfile, margin, contentWidth, y);
                doc.end();
                this.logger.log(`[Receipt PDF] Generated successfully`);
            }
            catch (err) {
                this.logger.error(`[Receipt PDF] Error: ${err}`);
                reject(err);
            }
        });
    }
    async generateAcknowledgementPDF(data) {
        const orgProfile = await this.orgProfileService.getProfile();
        this.logger.log(`[Ack PDF] Generating acknowledgement for ${data.ackNumber}`);
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({ size: 'A4', margin: 50, bufferPages: true });
                const chunks = [];
                doc.on('data', (c) => chunks.push(c));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);
                const margin = 50;
                const contentWidth = doc.page.width - margin * 2;
                let y = this.drawHeader(doc, orgProfile, margin, contentWidth);
                y += 12;
                const bandH = 38;
                doc.save();
                doc.rect(margin, y, contentWidth, bandH).fill(AMBER_BG);
                doc.restore();
                doc.save();
                doc.rect(margin, y, contentWidth, 3).fill(AMBER);
                doc.restore();
                doc.fillColor(AMBER).font('Helvetica-Bold').fontSize(13);
                doc.text('DONATION ACKNOWLEDGEMENT', margin, y + 10, { width: contentWidth, align: 'center' });
                doc.fillColor('#92400E').font('Helvetica').fontSize(8);
                doc.text('In-Kind Contribution — Kind Donation Acknowledgement', margin, y + 26, { width: contentWidth, align: 'center' });
                y += bandH + 14;
                let row = 0;
                y = this.drawField(doc, 'Acknowledgement No.', data.ackNumber, margin, contentWidth, y, row++, true);
                y = this.drawField(doc, 'Date', this.formatDate(data.donationDate), margin, contentWidth, y, row++);
                y = this.drawField(doc, 'Donor Name', data.donorName, margin, contentWidth, y, row++, true);
                y += 4;
                this.drawRule(doc, margin, contentWidth, y);
                y += 10;
                y = this.drawField(doc, 'Nature of Donation', this.formatDonationType(data.donationType), margin, contentWidth, y, row++, true);
                if (data.designatedHome && data.designatedHome !== 'NONE') {
                    y = this.drawField(doc, 'Designated To', this.formatHome(data.designatedHome), margin, contentWidth, y, row++);
                }
                if (data.estimatedValue && data.estimatedValue > 0) {
                    const valueFormatted = `₹ ${data.estimatedValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Estimated)`;
                    y = this.drawField(doc, 'Estimated Value', valueFormatted, margin, contentWidth, y, row++);
                }
                if (data.remarks) {
                    y = this.drawField(doc, 'Description / Notes', data.remarks, margin, contentWidth, y, row++);
                }
                y += 20;
                const boxPad = 16;
                const msgLines = [
                    '"Thank you for your thoughtful support."',
                    '',
                    'Your contribution directly helps the people in our care. Whether it is food, clothing, medicines,',
                    'or everyday essentials — every in-kind gift makes a meaningful difference.',
                    '',
                    'We are grateful for your kindness and continued generosity.',
                ].join('\n');
                const msgH = doc.font('Helvetica').fontSize(9).heightOfString(msgLines, {
                    width: contentWidth - boxPad * 2,
                });
                const msgBoxH = msgH + boxPad * 2 + 10;
                doc.save();
                doc.rect(margin, y, contentWidth, msgBoxH).fill(AMBER_BG);
                doc.restore();
                doc.save();
                doc.rect(margin, y, 4, msgBoxH).fill(AMBER);
                doc.restore();
                doc.fillColor('#92400E').font('Helvetica-Bold').fontSize(11);
                doc.text('"Thank you for your thoughtful support."', margin + boxPad, y + boxPad, {
                    width: contentWidth - boxPad * 2,
                });
                doc.fillColor(AMBER).font('Helvetica').fontSize(9);
                doc.text('Your contribution directly helps the people in our care. Whether it is food, clothing, medicines, or everyday essentials — every in-kind gift makes a meaningful difference.\n\nWe are grateful for your kindness and continued generosity.', margin + boxPad, doc.y + 6, { width: contentWidth - boxPad * 2 });
                y += msgBoxH + 16;
                const noticePad = 12;
                const noticeBoxH = 30;
                doc.save();
                doc.rect(margin, y, contentWidth, noticeBoxH).fill('#F0F4F8');
                doc.restore();
                doc.fillColor(TEXT_SOFT).font('Helvetica').fontSize(7.5);
                doc.text('This is an acknowledgement for an in-kind (non-monetary) donation. It does not constitute a financial receipt or tax exemption document.', margin + noticePad, y + 9, { width: contentWidth - noticePad * 2, align: 'center' });
                y += noticeBoxH + 12;
                y = this.drawHomesBar(doc, orgProfile, margin, contentWidth, y);
                this.drawFooter(doc, orgProfile, margin, contentWidth, y);
                doc.end();
                this.logger.log(`[Ack PDF] Generated successfully`);
            }
            catch (err) {
                this.logger.error(`[Ack PDF] Error: ${err}`);
                reject(err);
            }
        });
    }
};
exports.ReceiptService = ReceiptService;
exports.ReceiptService = ReceiptService = ReceiptService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [organization_profile_service_1.OrganizationProfileService])
], ReceiptService);
//# sourceMappingURL=receipt.service.js.map