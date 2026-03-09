import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../../email/email.service";
import { getPledgeTemplate } from "../templates/pledge.template";

@Injectable()
export class PledgeRemindersProcessor {

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async process() {

    const result = { queued:0, sent:0, failed:0, errors:[] };

    const pledges = await this.prisma.pledge.findMany({
      where: { status: "PENDING" },
      include: { donor: true }
    });

    for (const pledge of pledges) {

      const donor = pledge.donor;
      const email = donor.personalEmail || donor.officialEmail;
      if (!email) continue;

      const { subject, body } =
        getPledgeTemplate(donor.firstName, pledge, 0, { name: "NGO" });

      await this.emailService.sendEmail({
        to: email,
        subject,
        html: body
      });

      result.sent++;
    }

    return result;
  }
}
