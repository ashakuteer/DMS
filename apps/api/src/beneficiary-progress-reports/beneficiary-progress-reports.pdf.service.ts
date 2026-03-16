import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import PDFDocument from 'pdfkit';
import * as https from 'https';
import * as http from 'http';
import { ProgressReportData } from './beneficiary-progress-reports.types';

@Injectable()
export class BeneficiaryProgressReportsPdfService {
  private readonly logger = new Logger(BeneficiaryProgressReportsPdfService.name);

  constructor(private orgProfileService: OrganizationProfileService) {}

  async generatePdf(report: any): Promise<Buffer> {
    if (report.status !== 'READY' && report.status !== 'SHARED') {
      throw new BadRequestException('Report is not ready for download');
    }

    const data = report.reportData as unknown as ProgressReportData;
    if (!data) throw new BadRequestException('Report data missing');

    const orgProfile = await this.orgProfileService.getProfile();
    const orgName = orgProfile.name;
    const orgTagline = orgProfile.tagline1 || '';

    let profileImageBuffer: Buffer | null = null;
    if (data.beneficiary.photoUrl && report.includePhotos) {
      try {
        profileImageBuffer = await this.fetchImageBuffer(data.beneficiary.photoUrl);
      } catch (e) {
        this.logger.warn(`Failed to fetch profile photo: ${e.message}`);
      }
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100;
      const primaryColor = orgProfile.brandingPrimaryColor || '#1a365d';
      const accentColor = '#2b6cb0';
      const lightBg = '#f7fafc';

      this.addWatermark(doc, orgName);

      doc.rect(50, 50, pageWidth, 80).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
        .text(orgName, 60, 65, { width: pageWidth - 20 });
      if (orgTagline) {
        doc.fontSize(10).font('Helvetica').text(orgTagline, 60, 90, { width: pageWidth - 20 });
      }
      doc.fontSize(12).text('Beneficiary Progress Report', 60, 108, { width: pageWidth - 20, align: 'right' });

      let y = 150;

      doc.rect(50, y, pageWidth, profileImageBuffer ? 100 : 70).fill(lightBg);
      let textX = 60;
      if (profileImageBuffer) {
        try {
          doc.image(profileImageBuffer, 60, y + 10, { width: 80, height: 80 });
          textX = 155;
        } catch (e) {
          this.logger.warn(`Failed to embed profile image: ${e.message}`);
        }
      }
      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold')
        .text(data.beneficiary.fullName, textX, y + 12, { width: pageWidth - textX + 40 });
      doc.fillColor('#4a5568').fontSize(9).font('Helvetica');
      const infoY = y + 32;
      doc.text(`Code: ${data.beneficiary.code}`, textX, infoY);
      doc.text(`Home: ${this.formatHomeType(data.beneficiary.homeType)}`, textX, infoY + 14);
      if (data.beneficiary.gender) doc.text(`Gender: ${data.beneficiary.gender}`, textX + 200, infoY);
      if (data.beneficiary.approxAge) doc.text(`Approx Age: ${data.beneficiary.approxAge}`, textX + 200, infoY + 14);
      if (data.beneficiary.educationClassOrRole) doc.text(`Class/Role: ${data.beneficiary.educationClassOrRole}`, textX, infoY + 28);
      if (data.beneficiary.schoolOrCollege) doc.text(`School: ${data.beneficiary.schoolOrCollege}`, textX + 200, infoY + 28);

      y += profileImageBuffer ? 110 : 80;

      doc.fillColor(accentColor).fontSize(10).font('Helvetica-Bold')
        .text(`Report Period: ${data.period.label}`, 60, y);
      y += 20;

      if (data.beneficiary.hobbies || data.beneficiary.dreamCareer || data.beneficiary.favouriteSubject) {
        y = this.addSectionHeader(doc, 'About Me', y, pageWidth, primaryColor);
        doc.fillColor('#4a5568').fontSize(9).font('Helvetica');
        if (data.beneficiary.hobbies) { doc.text(`Hobbies: ${data.beneficiary.hobbies}`, 60, y); y += 14; }
        if (data.beneficiary.favouriteSubject) { doc.text(`Favourite Subject: ${data.beneficiary.favouriteSubject}`, 60, y); y += 14; }
        if (data.beneficiary.dreamCareer) { doc.text(`Dream Career: ${data.beneficiary.dreamCareer}`, 60, y); y += 14; }
        y += 6;
      }

      if (data.healthEvents.length > 0 || data.healthMetrics.length > 0) {
        y = this.checkPageBreak(doc, y, 80, orgName);
        y = this.addSectionHeader(doc, 'Health & Wellbeing', y, pageWidth, primaryColor);

        if (data.healthMetrics.length > 0) {
          doc.fillColor(accentColor).fontSize(9).font('Helvetica-Bold').text('Growth Metrics', 60, y);
          y += 14;
          y = this.drawTableHeader(doc, ['Date', 'Height (cm)', 'Weight (kg)', 'Status'], [60, 180, 280, 380], y, lightBg);
          for (const m of data.healthMetrics) {
            y = this.checkPageBreak(doc, y, 16, orgName);
            doc.fillColor('#4a5568').fontSize(8).font('Helvetica');
            doc.text(this.fmtDate(m.date), 60, y);
            doc.text(m.heightCm?.toString() || '-', 180, y);
            doc.text(m.weightKg?.toString() || '-', 280, y);
            doc.text(m.healthStatus, 380, y);
            y += 14;
          }
          y += 8;
        }

        if (data.healthEvents.length > 0) {
          doc.fillColor(accentColor).fontSize(9).font('Helvetica-Bold').text('Health Events', 60, y);
          y += 14;
          for (const ev of data.healthEvents) {
            y = this.checkPageBreak(doc, y, 30, orgName);
            const severityColor = ev.severity === 'CRITICAL' ? '#e53e3e' : ev.severity === 'HIGH' ? '#dd6b20' : ev.severity === 'MEDIUM' ? '#d69e2e' : '#38a169';
            doc.rect(56, y, 3, 22).fill(severityColor);
            doc.fillColor('#2d3748').fontSize(9).font('Helvetica-Bold')
              .text(`${this.fmtDate(ev.date)} - ${ev.title}`, 66, y);
            doc.fillColor('#718096').fontSize(8).font('Helvetica')
              .text(ev.description, 66, y + 12, { width: pageWidth - 30 });
            y += 30;
          }
          y += 6;
        }
      }

      if (data.progressCards.length > 0) {
        y = this.checkPageBreak(doc, y, 80, orgName);
        y = this.addSectionHeader(doc, 'Academic Progress', y, pageWidth, primaryColor);
        y = this.drawTableHeader(doc, ['Year', 'Term', 'Class', 'School', '%', 'Remarks'], [60, 140, 210, 270, 380, 410], y, lightBg);
        for (const p of data.progressCards) {
          y = this.checkPageBreak(doc, y, 16, orgName);
          doc.fillColor('#4a5568').fontSize(8).font('Helvetica');
          doc.text(p.academicYear, 60, y);
          doc.text(p.term.replace('_', ' '), 140, y);
          doc.text(p.classGrade, 210, y);
          doc.text((p.school || '-').substring(0, 18), 270, y);
          doc.text(p.percentage != null ? `${p.percentage}%` : '-', 380, y);
          doc.text((p.remarks || '-').substring(0, 12), 410, y);
          y += 14;
        }
        y += 10;
      }

      if (data.updates.length > 0) {
        y = this.checkPageBreak(doc, y, 60, orgName);
        y = this.addSectionHeader(doc, 'Updates & Milestones', y, pageWidth, primaryColor);
        for (const u of data.updates) {
          y = this.checkPageBreak(doc, y, 40, orgName);
          doc.fillColor(accentColor).fontSize(9).font('Helvetica-Bold')
            .text(`${this.fmtDate(u.date)} - ${u.title}`, 60, y);
          doc.fillColor('#718096').fontSize(8).font('Helvetica')
            .text(`[${u.type}]`, 60, y + 12);
          const contentHeight = doc.heightOfString(u.content, { width: pageWidth - 20 });
          doc.fillColor('#4a5568').fontSize(8).font('Helvetica')
            .text(u.content, 60, y + 24, { width: pageWidth - 20 });
          y += 30 + contentHeight;
        }
        y += 6;
      }

      if (data.sponsors.length > 0) {
        y = this.checkPageBreak(doc, y, 40, orgName);
        y = this.addSectionHeader(doc, 'Sponsors', y, pageWidth, primaryColor);
        for (const s of data.sponsors) {
          doc.fillColor('#4a5568').fontSize(9).font('Helvetica')
            .text(`${s.name} (${s.code})`, 60, y);
          y += 14;
        }
      }

      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fillColor('#a0aec0').fontSize(7).font('Helvetica')
          .text(
            `${orgName} | Confidential | Page ${i + 1} of ${pageCount}`,
            50,
            doc.page.height - 35,
            { width: pageWidth, align: 'center' },
          );
      }

      doc.end();
    });
  }

  private addWatermark(doc: typeof PDFDocument.prototype, orgName: string) {
    doc.save();
    doc.fillColor('#e2e8f0').fontSize(50).font('Helvetica-Bold').opacity(0.07);
    const textWidth = doc.widthOfString(orgName);
    const cx = doc.page.width / 2;
    const cy = doc.page.height / 2;
    doc.translate(cx, cy);
    doc.rotate(-35, { origin: [0, 0] });
    doc.text(orgName, -textWidth / 2, -25);
    doc.restore();
  }

  private addSectionHeader(doc: any, title: string, y: number, pageWidth: number, color: string): number {
    doc.rect(50, y, pageWidth, 20).fill(color);
    doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
      .text(title, 60, y + 4);
    return y + 28;
  }

  private drawTableHeader(doc: any, cols: string[], xs: number[], y: number, bg: string): number {
    doc.rect(50, y, doc.page.width - 100, 16).fill(bg);
    doc.fillColor('#4a5568').fontSize(8).font('Helvetica-Bold');
    cols.forEach((col, i) => doc.text(col, xs[i], y + 3));
    return y + 18;
  }

  private checkPageBreak(doc: any, y: number, needed: number, orgName: string): number {
    if (y + needed > doc.page.height - 60) {
      doc.addPage();
      this.addWatermark(doc, orgName);
      return 60;
    }
    return y;
  }

  private fetchImageBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { timeout: 8000 }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          this.fetchImageBuffer(res.headers.location).then(resolve).catch(reject);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Image fetch timed out')); });
    });
  }

  private formatHomeType(ht: string): string {
    return ht.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
