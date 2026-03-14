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
  return (this.core as any).update(user, id, dto);
}

  delete(user: any, id: string) {
    return this.core.delete(user, id);
  }

  updatePhoto(id: string, url: string | null, path?: string | null) {
  return (this.core as any).updatePhoto(id, url, path);
}

  // ----------------------------
  // SPONSORSHIPS
  // ----------------------------

  getSponsors(beneficiaryId: string) {
    return this.sponsorship.getSponsors(beneficiaryId);
  }

  addSponsor(user: any, beneficiaryId: string, dto: any) {
  return (this.sponsorship as any).addSponsor(user, beneficiaryId, dto);
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
  return (this.core as any).getTimelineEvents(beneficiaryId);
}

  addTimelineEvent(beneficiaryId: string, dto: any) {
  return (this.core as any).addTimelineEvent(beneficiaryId, dto);
}

  // ----------------------------
  // HEALTH
  // ----------------------------

  getMetrics(beneficiaryId: string) {
    return this.health.getMetrics(beneficiaryId);
  }

  addMetric(user: any, beneficiaryId: string, dto: any) {
  return (this.health as any).addMetric(user, beneficiaryId, dto);
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

   queueSponsorshipReminderEmail(id: string) {
    return this.reminders.queueSponsorshipReminderEmail(id);
  }
// ----------------------------
// HEALTH EVENTS
// ----------------------------

addHealthEvent(user: any, beneficiaryId: string, dto: any) {
  return this.health.addHealthEvent(user, beneficiaryId, dto);
}

sendHealthEventToSponsors(user: any, eventId: string) {
  return this.health.sendHealthEventToSponsors(user, eventId);
}

getHealthTimeline(beneficiaryId: string) {
  return this.health.getHealthTimeline(beneficiaryId);
}

exportHealthHistoryPdf(beneficiaryId: string) {
  return this.health.exportHealthHistoryPdf(beneficiaryId);
}


// ----------------------------
// DOCUMENTS
// ----------------------------

getDocumentById(user: any, docId: string) {
  return this.documents.getDocumentById(user, docId);
}


// ----------------------------
// REPORT CAMPAIGNS
// ----------------------------

queueReportCampaignEmails(user: any, campaignId: string) {
  return this.reports.queueReportCampaignEmails(user, campaignId);
}


// ----------------------------
// REMINDERS
// ----------------------------

getDueSponsorships(windowDays?: number) {
  return (this.reminders as any).getDueSponsorships(windowDays);

}
  // ----------------------------
// SPONSORSHIP MANAGEMENT
// ----------------------------

getSponsorshipSummary() {
  return this.sponsorship.getSponsorshipSummary();
}

updateSponsorship(user: any, id: string, dto: any) {
  return this.sponsorship.updateSponsorship(user, id, dto);
}

deleteSponsorship(id: string) {
  return this.sponsorship.deleteSponsorship(id);
}

markSponsorshipPaid(user: any, id: string, body: any) {
  return (this.sponsorship as any).markSponsorshipPaid(user, id, body);
}
 sendSponsorshipReminderEmail(id: string) {
  return this.reminders.queueSponsorshipReminderEmail(id);
}
skipSponsorshipMonth(user: any, id: string) {
  return (this.sponsorship as any).skipSponsorshipMonth(user, id);
}

getSponsorshipHistory(id: string) {
  return this.sponsorship.getSponsorshipHistory(id);
}
// ----------------------------
// UPDATE DISPATCH / SPONSOR UPDATE HELPERS
// ----------------------------

getUpdateWithBeneficiary(id: string) {
  return this.updates.getUpdateWithBeneficiary(id);
}

getSponsorsForUpdate(beneficiaryId: string) {
  return this.sponsorship.getSponsors(beneficiaryId);
}

sendUpdateToSponsors(user: any, updateId: string) {
  return this.updates.sendUpdateToSponsors(user, updateId);
}
}
