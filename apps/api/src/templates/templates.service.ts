import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TemplateType } from "@prisma/client";
import { OrganizationProfileService } from "../organization-profile/organization-profile.service";

export interface CreateTemplateDto {
  type: TemplateType;
  name: string;
  description?: string;
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
}

export interface UpdateTemplateDto {
  name?: string;
  description?: string;
  whatsappMessage?: string;
  emailSubject?: string;
  emailBody?: string;
  isActive?: boolean;
}

@Injectable()
export class TemplatesService {
  constructor(
    private prisma: PrismaService,
    private orgProfileService: OrganizationProfileService,
  ) {}

  async findAll() {
    return this.prisma.communicationTemplate.findMany({
      orderBy: { type: "asc" },
      include: {
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.communicationTemplate.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
      },
    });
    if (!template) {
      throw new NotFoundException("Template not found");
    }
    return template;
  }

  async findByType(type: TemplateType) {
    const template = await this.prisma.communicationTemplate.findUnique({
      where: { type },
    });
    return template;
  }

  async create(dto: CreateTemplateDto, userId: string) {
    const existing = await this.prisma.communicationTemplate.findUnique({
      where: { type: dto.type },
    });
    if (existing) {
      throw new ConflictException(
        `Template for type ${dto.type} already exists`,
      );
    }

    return this.prisma.communicationTemplate.create({
      data: {
        ...dto,
        createdById: userId,
      },
    });
  }

  async update(id: string, dto: UpdateTemplateDto, userId: string) {
    const template = await this.prisma.communicationTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException("Template not found");
    }

    return this.prisma.communicationTemplate.update({
      where: { id },
      data: {
        ...dto,
        updatedById: userId,
      },
    });
  }

  async delete(id: string) {
    const template = await this.prisma.communicationTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException("Template not found");
    }

    await this.prisma.communicationTemplate.delete({
      where: { id },
    });
    return { success: true };
  }

  resolvePlaceholders(
    template: string,
    data: {
      donorName?: string;
      amount?: string;
      donationDate?: string;
      programName?: string;
      receiptNumber?: string;
    },
  ): string {
    let result = template;
    result = result.replace(/\{\{donor_name\}\}/g, data.donorName || "");
    result = result.replace(/\{\{amount\}\}/g, data.amount || "");
    result = result.replace(/\{\{donation_date\}\}/g, data.donationDate || "");
    result = result.replace(
      /\{\{program_name\}\}/g,
      data.programName || "General Fund",
    );
    result = result.replace(
      /\{\{receipt_number\}\}/g,
      data.receiptNumber || "",
    );
    return result;
  }

  async resolveWithOrgProfile(
    template: string,
    data: {
      donorName?: string;
      amount?: string;
      donationDate?: string;
      programName?: string;
      receiptNumber?: string;
    },
  ): Promise<string> {
    const org = await this.orgProfileService.getProfile();
    let result = this.resolvePlaceholders(template, data);

    result = result.replace(/\{\{org_name\}\}/g, org.name);
    result = result.replace(
      /\{\{org_phone\}\}/g,
      `${org.phone1} / ${org.phone2}`,
    );
    result = result.replace(/\{\{org_email\}\}/g, org.email);
    result = result.replace(/\{\{org_website\}\}/g, org.website);
    result = result.replace(/\{\{org_tagline\}\}/g, org.tagline1);

    result = result.replace(/Asha Kuteer Foundation/g, org.name);

    return result;
  }

  async seedDefaultTemplates(userId: string) {
    const templates: CreateTemplateDto[] = [
      {
        type: TemplateType.THANK_YOU,
        name: "Thank You (Donation Received)",
        description: "Sent after receiving a donation",
        whatsappMessage: `Dear {{donor_name}},

Thank you for your generous donation of Rs. {{amount}} received on {{donation_date}}.

Your support helps us continue our mission to serve those in need. Receipt #{{receipt_number}} has been generated.

With gratitude,
Asha Kuteer Foundation`,
        emailSubject:
          "Thank You for Your Donation - Receipt #{{receipt_number}}",
        emailBody: `Dear {{donor_name}},

We are deeply grateful for your generous donation of Rs. {{amount}} received on {{donation_date}}.

Your contribution towards {{program_name}} helps us continue our mission to support and uplift the lives of those in need.

Your receipt number is: {{receipt_number}}

Thank you for being a valued supporter of Asha Kuteer Foundation.

With warm regards,
Asha Kuteer Foundation Team`,
      },
      {
        type: TemplateType.GENTLE_FOLLOWUP,
        name: "Gentle Follow-up",
        description: "For follow-up with donors who have not donated recently",
        whatsappMessage: `Dear {{donor_name}},

Hope you are doing well! We wanted to share some updates from Asha Kuteer Foundation.

Your past support has made a real difference. If you'd like to continue supporting our cause, we would be grateful for any contribution.

Warm regards,
Asha Kuteer Foundation`,
        emailSubject: "We Miss Your Support - Asha Kuteer Foundation",
        emailBody: `Dear {{donor_name}},

We hope this message finds you in good health and spirits.

We wanted to reach out and share some recent developments at Asha Kuteer Foundation. Your past contributions have helped us make a significant impact in the lives of many.

As we continue our mission, we would be grateful if you could consider supporting us once again. Every contribution, big or small, makes a difference.

Thank you for being part of our journey.

Warm regards,
Asha Kuteer Foundation Team`,
      },
      {
        type: TemplateType.MONTHLY_REMINDER,
        name: "Monthly Donor Reminder",
        description: "Monthly reminder for regular donors",
        whatsappMessage: `Dear {{donor_name}},

This is a friendly reminder for your monthly contribution to Asha Kuteer Foundation.

Your regular support helps us plan and sustain our programs effectively. Thank you for your continued generosity!

Asha Kuteer Foundation`,
        emailSubject: "Monthly Contribution Reminder - Asha Kuteer Foundation",
        emailBody: `Dear {{donor_name}},

We hope you're doing well!

This is a gentle reminder regarding your monthly contribution to Asha Kuteer Foundation. Your consistent support enables us to plan our programs effectively and create lasting impact.

If you have any questions or need assistance, please don't hesitate to reach out.

Thank you for your continued generosity!

Warm regards,
Asha Kuteer Foundation Team`,
      },
      {
        type: TemplateType.FESTIVAL_GREETING,
        name: "Festival Greeting",
        description: "Festival wishes to donors",
        whatsappMessage: `Dear {{donor_name}},

Wishing you and your family a joyous festival season filled with happiness and prosperity!

Thank you for being a valued supporter of Asha Kuteer Foundation. May this festive season bring you peace and joy.

Warm wishes,
Asha Kuteer Foundation`,
        emailSubject: "Festival Greetings from Asha Kuteer Foundation",
        emailBody: `Dear {{donor_name}},

As we celebrate this festive season, we want to extend our warmest wishes to you and your family.

May this time bring you joy, peace, and prosperity. We are grateful to have supporters like you who make our mission possible.

Thank you for your kindness and generosity throughout the year.

With warm festive wishes,
Asha Kuteer Foundation Team`,
      },
      {
        type: TemplateType.RECEIPT_RESEND,
        name: "Receipt Re-send",
        description: "When a donor requests their receipt again",
        whatsappMessage: `Dear {{donor_name}},

As requested, here is a reminder of your donation details:
Amount: Rs. {{amount}}
Date: {{donation_date}}
Receipt: #{{receipt_number}}

Please let us know if you need any further assistance.

Asha Kuteer Foundation`,
        emailSubject: "Your Donation Receipt - #{{receipt_number}}",
        emailBody: `Dear {{donor_name}},

As per your request, please find below the details of your donation:

Donation Amount: Rs. {{amount}}
Donation Date: {{donation_date}}
Receipt Number: {{receipt_number}}
Program: {{program_name}}

If you need the original receipt document, please reply to this email and we will send it to you.

Thank you for your support!

Warm regards,
Asha Kuteer Foundation Team`,
      },
      {
        type: TemplateType.BIRTHDAY_ANNIVERSARY,
        name: "Birthday / Anniversary Wish",
        description: "Special occasion greetings",
        whatsappMessage: `Dear {{donor_name}},

Wishing you a wonderful day filled with joy and happiness!

Thank you for being a valued member of the Asha Kuteer Foundation family. May this special day bring you blessings and joy.

Warm wishes,
Asha Kuteer Foundation`,
        emailSubject: "Warm Wishes from Asha Kuteer Foundation",
        emailBody: `Dear {{donor_name}},

On this special day, we want to extend our warmest wishes to you!

May this occasion bring you joy, good health, and happiness. We are grateful to have you as part of the Asha Kuteer Foundation family.

Thank you for your continued support and kindness.

With warm wishes,
Asha Kuteer Foundation Team`,
      },
      {
        type: TemplateType.BIRTHDAY,
        name: "Birthday Greeting",
        description: "Birthday wishes for donors",
        whatsappMessage: `Dear {{donor_name}},

Warm birthday wishes from {{org_name}}! 🎂

May this special day bring you joy, happiness, and all the blessings you deserve. We are deeply grateful for your continued support and generosity.

Wishing you a wonderful year ahead!

With warm regards,
{{org_name}}
📞 {{org_phone}}
📧 {{org_email}}
🌐 {{org_website}}`,
        emailSubject: "Happy Birthday from {{org_name}}!",
        emailBody: `Dear {{donor_name}},

On behalf of everyone at {{org_name}}, we wish you a very Happy Birthday!

May this special day be filled with joy, laughter, and wonderful moments with your loved ones. We are truly grateful for your continued support and partnership in our mission.

Your generosity has helped us serve countless lives, and we are honored to have you as part of our family.

Wishing you a year filled with good health, happiness, and success!

With warm birthday wishes,
{{org_name}} Team
📞 {{org_phone}} | 📧 {{org_email}}`,
      },
      {
        type: TemplateType.ANNIVERSARY,
        name: "Anniversary Greeting",
        description: "Anniversary wishes for donors",
        whatsappMessage: `Dear {{donor_name}},

Warm anniversary wishes from {{org_name}}! 💐

May your journey together continue to be blessed with love, joy, and togetherness. We appreciate your support and wish you many more years of happiness.

With heartfelt regards,
{{org_name}}
📞 {{org_phone}}
📧 {{org_email}}`,
        emailSubject: "Happy Anniversary from {{org_name}}!",
        emailBody: `Dear {{donor_name}},

We are delighted to wish you a very Happy Anniversary!

May this special occasion mark another beautiful milestone in your journey together. May your bond continue to grow stronger with each passing year, filled with love, understanding, and shared happiness.

Thank you for being a valued supporter of {{org_name}}. Your generosity and kindness inspire us every day.

Wishing you a wonderful anniversary celebration!

With warm regards,
{{org_name}} Team
📞 {{org_phone}} | 📧 {{org_email}}`,
      },
      {
        type: TemplateType.MEMORIAL,
        name: "Memorial / Death Anniversary",
        description: "Respectful remembrance message",
        whatsappMessage: `Dear {{donor_name}},

We remember {{related_person}} with respect and prayers on this day. 🙏

Our thoughts and prayers are with you and your family. May the cherished memories bring you comfort and peace.

With deepest condolences,
{{org_name}}
📞 {{org_phone}}`,
        emailSubject: "In Loving Memory - {{org_name}}",
        emailBody: `Dear {{donor_name}},

On this day of remembrance, we join you in honoring the memory of your loved one.

May the beautiful memories you shared bring you comfort and peace during this time. Please know that our thoughts and prayers are with you and your family.

If there is anything we can do to support you, please do not hesitate to reach out.

With deepest condolences and respect,
{{org_name}} Team
📞 {{org_phone}} | 📧 {{org_email}}`,
      },
      {
        type: TemplateType.FOLLOWUP,
        name: "Follow-up Reminder",
        description: "General follow-up with donors",
        whatsappMessage: `Dear {{donor_name}},

Hope you are doing well! This is a gentle reminder about your upcoming contribution.

Your support means the world to us at {{org_name}}. We would be grateful if you could take a moment to consider continuing your support.

Warm regards,
{{org_name}}
📞 {{org_phone}}
📧 {{org_email}}
🌐 {{org_website}}`,
        emailSubject: "A Gentle Reminder from {{org_name}}",
        emailBody: `Dear {{donor_name}},

We hope this message finds you well!

We wanted to reach out with a gentle reminder regarding your valuable support to {{org_name}}.

Your past contributions have made a significant difference in the lives of many. As we continue our mission, we would be honored to have your continued partnership.

If you have any questions or would like to discuss how you can support our cause, please don't hesitate to contact us.

Thank you for considering our request.

Warm regards,
{{org_name}} Team
📞 {{org_phone}} | 📧 {{org_email}}`,
      },
      {
        type: TemplateType.PLEDGE_DUE,
        name: "Pledge Due Reminder",
        description: "Reminder for pledges coming due",
        whatsappMessage: `Dear {{donor_name}},

This is a gentle reminder about your pledge to support {{org_name}}.

Pledge Details:
📋 {{pledge_item}}
📅 Expected: {{due_date}}
💰 Amount: {{pledge_amount}}

Your commitment means the world to us. Please reach out when you are ready to fulfill your pledge.

Thank you for your generosity!

{{org_name}}
📞 {{org_phone}}`,
        emailSubject: "Pledge Reminder - {{org_name}}",
        emailBody: `Dear {{donor_name}},

We hope this message finds you well!

This is a friendly reminder about your pledge to support {{org_name}}.

Pledge Details:
- Item: {{pledge_item}}
- Expected Date: {{due_date}}
- Amount: {{pledge_amount}}

Your commitment to our cause is deeply appreciated. When you are ready to fulfill your pledge, please reach out to us and we will assist you with the process.

If your circumstances have changed or you have any questions, please don't hesitate to contact us.

Thank you for your generosity and continued support!

Warm regards,
{{org_name}} Team
📞 {{org_phone}} | 📧 {{org_email}}`,
      },
    ];

    for (const t of templates) {
      const existing = await this.prisma.communicationTemplate.findUnique({
        where: { type: t.type },
      });
      if (!existing) {
        await this.prisma.communicationTemplate.create({
          data: { ...t, createdById: userId },
        });
      }
    }

    return { success: true, message: "Default templates seeded" };
  }
}
