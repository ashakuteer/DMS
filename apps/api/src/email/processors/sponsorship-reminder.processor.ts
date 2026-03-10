import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../../email/email.service";
import { getSponsorshipDueTemplate } from "../templates/sponsorship.template";

@Injectable()
export class SponsorshipReminderProcessor {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async process() {
    const result = { queued: 0, sent: 0, failed: 0, errors: [] as any[] };

    const sponsorships = await this.prisma.sponsorship.findMany({
      where: { isActive: true },
      include: { donor: true, beneficiary: true },
    });

    for (const s of sponsorships) {
      const donor = s.donor;
      const email = donor?.personalEmail || donor?.officialEmail;

      if (!email) continue;

      const home = "Home";

      const { subject, body } = getSponsorshipDueTemplate(
        donor.firstName,
        s.beneficiary?.fullName,
        String(s.amount),
        home,
        { name: "NGO" }
      );

      await this.emailService.sendEmail({
        to: email,
        subject,
        html: body,
      });

      result.sent++;
    }

    return result;
  }
}
