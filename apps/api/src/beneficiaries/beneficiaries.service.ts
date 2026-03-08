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


// --------------------------------------------------
// BENEFICIARY CORE
// --------------------------------------------------

findAll(user: any, options: any) {
  return this.core.findAll(options);
}

findById(id: string) {
  return this.core.findById(id);
}

create(user: any, dto: any) {
  return this.core.create(user, dto);
}

delete(user: any, id: string) {
  return this.core.delete(user, id);
}


// --------------------------------------------------
// SPONSORSHIPS
// --------------------------------------------------

getSponsors(beneficiaryId: string) {
  return this.sponsorship.getSponsors(beneficiaryId);
}

getSponsorshipHistory(id: string) {
  return this.sponsorship.getSponsorshipHistory(id);
}


// --------------------------------------------------
// UPDATES
// --------------------------------------------------

getUpdates(beneficiaryId: string) {
  return this.updates.getUpdates(beneficiaryId);
}

deleteUpdate(updateId: string) {
  return this.updates.deleteUpdate(updateId);
}


// --------------------------------------------------
// HEALTH
// --------------------------------------------------

getMetrics(beneficiaryId: string) {
  return this.health.getMetrics(beneficiaryId);
}

getHealthEvents(beneficiaryId: string) {
  return this.health.getHealthEvents(beneficiaryId);
}


// --------------------------------------------------
// EDUCATION
// --------------------------------------------------

getProgressCards(beneficiaryId: string) {
  return this.education.getProgressCards(beneficiaryId);
}


// --------------------------------------------------
// DOCUMENTS
// --------------------------------------------------

getDocuments(ownerType: string, ownerId?: string) {
  return this.documents.getDocuments(ownerType, ownerId);
}


// --------------------------------------------------
// REPORTS
// --------------------------------------------------

getReportCampaigns() {
  return this.reports.getReportCampaigns();
}


// --------------------------------------------------
// REMINDERS
// --------------------------------------------------

getDueSponsorships() {
  return this.reminders.getDueSponsorships();
}

}
