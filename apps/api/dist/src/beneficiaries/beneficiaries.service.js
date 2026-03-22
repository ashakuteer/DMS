"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiariesService = void 0;
const common_1 = require("@nestjs/common");
const beneficiary_core_service_1 = require("./services/beneficiary-core.service");
const beneficiary_sponsorship_service_1 = require("./services/beneficiary-sponsorship.service");
const beneficiary_updates_service_1 = require("./services/beneficiary-updates.service");
const beneficiary_health_service_1 = require("./services/beneficiary-health.service");
const beneficiary_education_service_1 = require("./services/beneficiary-education.service");
const beneficiary_documents_service_1 = require("./services/beneficiary-documents.service");
const beneficiary_reports_service_1 = require("./services/beneficiary-reports.service");
const beneficiary_reminders_service_1 = require("./services/beneficiary-reminders.service");
let BeneficiariesService = class BeneficiariesService {
    constructor(core, sponsorship, updates, health, education, documents, reports, reminders) {
        this.core = core;
        this.sponsorship = sponsorship;
        this.updates = updates;
        this.health = health;
        this.education = education;
        this.documents = documents;
        this.reports = reports;
        this.reminders = reminders;
    }
    quickSearch(q) {
        return this.core.quickSearch(q);
    }
    findAll(user, options) {
        return this.core.findAll(options);
    }
    findById(id) {
        return this.core.findById(id);
    }
    create(user, dto) {
        return this.core.create(user, dto);
    }
    update(user, id, dto) {
        return this.core.update(user, id, dto);
    }
    delete(user, id, deleteReason) {
        return this.core.delete(user, id, deleteReason);
    }
    restore(user, id) {
        return this.core.restore(user, id);
    }
    findArchived(user, search, page, limit) {
        return this.core.findArchived(user, search, page, limit);
    }
    updatePhoto(id, url, path) {
        return this.core.updatePhoto(id, url, path);
    }
    getSponsors(beneficiaryId) {
        return this.sponsorship.getSponsors(beneficiaryId);
    }
    addSponsor(user, beneficiaryId, dto) {
        return this.sponsorship.addSponsor(user, beneficiaryId, dto);
    }
    getDonorSponsorships(donorId) {
        return this.sponsorship.getSponsorsByDonor(donorId);
    }
    getSponsorshipsByBeneficiary(beneficiaryId) {
        return this.sponsorship.getSponsorshipsByBeneficiary(beneficiaryId);
    }
    sendUpdateToSponsor(userId, sponsorshipId) {
        return this.sponsorship.sendUpdateToSponsor(userId, sponsorshipId);
    }
    createSponsorshipForDonor(user, dto) {
        return this.sponsorship.createSponsorshipForDonor(user, dto);
    }
    getUpdates(beneficiaryId) {
        return this.updates.getUpdates(beneficiaryId);
    }
    addUpdate(user, beneficiaryId, dto) {
        return this.updates.addUpdate(user, beneficiaryId, dto);
    }
    deleteUpdate(updateId) {
        return this.updates.deleteUpdate(updateId);
    }
    markDispatchCopied(id) {
        return this.updates.markDispatchCopied(id);
    }
    getTimelineEvents(beneficiaryId) {
        return this.core.getTimelineEvents(beneficiaryId);
    }
    addTimelineEvent(beneficiaryId, dto) {
        return this.core.addTimelineEvent(beneficiaryId, dto);
    }
    getMetrics(beneficiaryId) {
        return this.health.getMetrics(beneficiaryId);
    }
    addMetric(user, beneficiaryId, dto) {
        return this.health.addMetric(user, beneficiaryId, dto);
    }
    getHealthEvents(beneficiaryId) {
        return this.health.getHealthEvents(beneficiaryId);
    }
    getProgressCards(beneficiaryId) {
        return this.education.getProgressCards(beneficiaryId);
    }
    addProgressCard(user, beneficiaryId, dto) {
        return this.education.addProgressCard(user, beneficiaryId, dto);
    }
    getEducationTimeline(beneficiaryId) {
        return this.education.getEducationTimeline(beneficiaryId);
    }
    exportEducationSummaryPdf(beneficiaryId) {
        return this.education.exportEducationSummaryPdf(beneficiaryId);
    }
    getDocuments(user, ownerType, ownerId) {
        return this.documents.getDocuments(user, ownerType, ownerId);
    }
    createDocument(user, dto) {
        return this.documents.createDocument(user, dto);
    }
    exportToExcel(user) {
        return this.reports.exportToExcel(user);
    }
    getReportCampaigns() {
        return this.reports.getReportCampaigns();
    }
    createReportCampaign(user, dto) {
        return this.reports.createReportCampaign(user, dto);
    }
    queueSponsorshipReminderEmail(id) {
        return this.reminders.queueSponsorshipReminderEmail(id);
    }
    addHealthEvent(user, beneficiaryId, dto) {
        return this.health.addHealthEvent(user, beneficiaryId, dto);
    }
    sendHealthEventToSponsors(user, eventId) {
        return this.health.sendHealthEventToSponsors(user, eventId);
    }
    getHealthTimeline(beneficiaryId) {
        return this.health.getHealthTimeline(beneficiaryId);
    }
    exportHealthHistoryPdf(beneficiaryId) {
        return this.health.exportHealthHistoryPdf(beneficiaryId);
    }
    getDocumentById(user, docId) {
        return this.documents.getDocumentById(user, docId);
    }
    queueReportCampaignEmails(user, campaignId) {
        return this.reports.queueReportCampaignEmails(user, campaignId);
    }
    getDueSponsorships(windowDays) {
        return this.reminders.getDueSponsorships(windowDays);
    }
    getSponsorshipSummary() {
        return this.sponsorship.getSponsorshipSummary();
    }
    updateSponsorship(user, id, dto) {
        return this.sponsorship.updateSponsorship(user, id, dto);
    }
    deleteSponsorship(id) {
        return this.sponsorship.deleteSponsorship(id);
    }
    markSponsorshipPaid(user, id, body) {
        return this.sponsorship.markSponsorshipPaid(user, id, body);
    }
    sendSponsorshipReminderEmail(id) {
        return this.reminders.queueSponsorshipReminderEmail(id);
    }
    skipSponsorshipMonth(user, id) {
        return this.sponsorship.skipSponsorshipMonth(user, id);
    }
    getSponsorshipHistory(id) {
        return this.sponsorship.getSponsorshipHistory(id);
    }
    getUpdateWithBeneficiary(id) {
        return this.updates.getUpdateWithBeneficiary(id);
    }
    getSponsorsForUpdate(beneficiaryId) {
        return this.sponsorship.getSponsors(beneficiaryId);
    }
    sendUpdateToSponsors(user, updateId) {
        return this.updates.sendUpdateToSponsors(user, updateId);
    }
};
exports.BeneficiariesService = BeneficiariesService;
exports.BeneficiariesService = BeneficiariesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [beneficiary_core_service_1.BeneficiaryCoreService,
        beneficiary_sponsorship_service_1.BeneficiarySponsorshipService,
        beneficiary_updates_service_1.BeneficiaryUpdatesService,
        beneficiary_health_service_1.BeneficiaryHealthService,
        beneficiary_education_service_1.BeneficiaryEducationService,
        beneficiary_documents_service_1.BeneficiaryDocumentsService,
        beneficiary_reports_service_1.BeneficiaryReportsService,
        beneficiary_reminders_service_1.BeneficiaryRemindersService])
], BeneficiariesService);
//# sourceMappingURL=beneficiaries.service.js.map