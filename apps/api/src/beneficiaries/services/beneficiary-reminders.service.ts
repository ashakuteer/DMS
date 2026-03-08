import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BeneficiaryRemindersService {

constructor(private prisma: PrismaService) {}

async getDueSponsorships() {

return this.prisma.sponsorship.findMany({
where: {
isActive: true,
status: "ACTIVE",
},
include: {
donor: true,
beneficiary: true,
},
});

}

async queueSponsorshipReminderEmail(sponsorshipId: string) {

return {
success: true,
message: `Reminder queued for sponsorship ${sponsorshipId}`,
};

}

}
