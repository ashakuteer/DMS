import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EmailService } from "../../email/email.service";
import { getBeneficiaryBirthdayTemplate } from "../templates/beneficiary-birthday.template";

@Injectable()
export class BeneficiaryBirthdayProcessor {

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async process() {

    const result = { queued:0, sent:0, failed:0, errors:[] };

    const beneficiaries = await this.prisma.beneficiary.findMany({
      select: {
        id: true,
        fullName: true,
        dobMonth: true,
        dobDay: true,
        homeType: true,
        isDeleted: true,
        status: true,
        sponsorships: {
          select: {
            id: true,
            isActive: true,
            status: true,
            donor: {
              select: {
                id: true,
                firstName: true,
                personalEmail: true,
                officialEmail: true,
              },
            },
          },
        },
      },
    });

    for (const beneficiary of beneficiaries) {

      for (const sponsorship of beneficiary.sponsorships) {

        const donor = sponsorship.donor;
        const email = donor.personalEmail || donor.officialEmail;
        if (!email) continue;

        const { subject, body } =
          getBeneficiaryBirthdayTemplate(
            donor.firstName,
            beneficiary.fullName,
            "Home",
            "Doing well",
            0,
            { name: "NGO" }
          );

        await this.emailService.sendEmail({
          to: email,
          subject,
          html: body
        });

        result.sent++;
      }
    }

    return result;
  }
}
