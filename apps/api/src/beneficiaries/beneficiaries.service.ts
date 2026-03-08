import { Injectable } from '@nestjs/common';

import { BeneficiaryCoreService } from './services/beneficiary-core.service';
import { BeneficiarySponsorshipService } from './services/beneficiary-sponsorship.service';
import { BeneficiaryUpdatesService } from './services/beneficiary-updates.service';
import { BeneficiaryHealthService } from './services/beneficiary-health.service';
import { BeneficiaryEducationService } from './services/beneficiary-education.service';
import { BeneficiaryDocumentsService } from './services/beneficiary-documents.service';
import { BeneficiaryReportsService } from './services/beneficiary-reports.service';
import { BeneficiaryRemindersService } from './services/beneficiary-reminders.service';

@Injectable()
export class BeneficiariesService {
  constructor(
    private core: BeneficiaryCoreService,
    private sponsorship: BeneficiarySponsorshipService,
    private updates: BeneficiaryUpdatesService,
    private health: BeneficiaryHealthService,
    private education: BeneficiaryEducationService,
    private documents: BeneficiaryDocumentsService,
    private reports: BeneficiaryReportsService,
    private reminders: BeneficiaryRemindersService,
  ) {}

  // ----------------------------
  // BENEFICIARY CORE
  // ----------------------------

  findAll(user: any, options: any) {
    return this.core.findAll(options);
  }

  findById(id: string) {
    return this.core.findById(id);
  }

  create(user: any, dto: any) {
    return this.core.create(user, dto);
  }

  update(user: any, id: string, dto: any) {
    return this.core.update(user, id, dto);
  }

  delete(user: any, id: string) {
    return this.core.delete(user, id);
  }

  updatePhoto(id: string, url: string | null, path?: string | null) {
    return this.core.updatePhoto(id, url, path);
  }

  // ----------------------------
  // SPONSORSHIPS
  // ----------------------------

  getSponsors(beneficiaryId: string) {
    return this.sponsorship.getSponsors(beneficiaryId);
  }

  addSponsor(user: any, beneficiaryId: string, dto: any) {
    return this.sponsorship.addSponsor(user, beneficiaryId, dto);
  }

  getDonorSponsorships(donorId: string) {
    return this.sponsorship.getSponsors(donorId);
  }

  // ----------------------------
  // UPDATES
  // ----------------------------

  getUpdates(beneficiaryId: string) {
    return this.updates.getUpdates(beneficiaryId);
  }

  addUpdate(user: any, beneficiaryId: string, dto: any) {
    return this.updates.addUpdate(user, beneficiaryId, dto);
  }

  deleteUpdate(updateId: string) {
    return this.updates.deleteUpdate(updateId);
  }

  markDispatchCopied(id: string) {
    return this.updates.markDispatchCopied(id);
  }

  // ----------------------------
  // TIMELINE
  // ----------------------------

  getTimelineEvents(beneficiaryId: string) {
    return this.core.getTimelineEvents(beneficiaryId);
  }

  addTimelineEvent(beneficiaryId: string, dto: any) {
    return this.core.addTimelineEvent(beneficiaryId, dto);
  }

  // ----------------------------
  // HEALTH
  // ----------------------------

  getMetrics(beneficiaryId: string) {
    return this.health.getMetrics(beneficiaryId);
  }

  addMetric(user: any, beneficiaryId: string, dto: any) {
    return this.health.addMetric(user, beneficiaryId, dto);
  }

  getHealthEvents(beneficiaryId: string) {
    return this.health.getHealthEvents(beneficiaryId);
  }

  // ----------------------------
  // EDUCATION
  // ----------------------------

  getProgressCards(beneficiaryId: string) {
    return this.education.getProgressCards(beneficiaryId);
  }

  addProgressCard(user: any, beneficiaryId: string, dto: any) {
    return this.education.addProgressCard(user, beneficiaryId, dto);
  }

  getEducationTimeline(beneficiaryId: string) {
    return this.education.getEducationTimeline(beneficiaryId);
  }

  exportEducationSummaryPdf(beneficiaryId: string) {
    return this.education.exportEducationSummaryPdf(beneficiaryId);
  }

  // ----------------------------
  // DOCUMENTS
  // ----------------------------

  getDocuments(user: any, ownerType: string, ownerId?: string) {
    return this.documents.getDocuments(user, ownerType, ownerId);
  }

  createDocument(user: any, dto: any) {
    return this.documents.createDocument(user, dto);
  }

  // ----------------------------
  // REPORTS
  // ----------------------------

  exportToExcel(user: any) {
    return this.reports.exportToExcel(user);
  }

  getReportCampaigns() {
    return this.reports.getReportCampaigns();
  }

  createReportCampaign(user: any, dto: any) {
    return this.reports.createReportCampaign(user, dto);
  }

  // ----------------------------
  // REMINDERS
  // ----------------------------

  getDueSponsorships() {
    return this.reminders.getDueSponsorships();
  }

  queueSponsorshipReminderEmail(id: string) {
    return this.reminders.queueSponsorshipReminderEmail(id);
  }
}
