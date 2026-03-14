import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { EmailService } from '../../email/email.service'

@Injectable()
export class SpecialDaysProcessor {

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ){}

  async process(){

    const result = {
      queued:0,
      sent:0,
      failed:0,
      errors:[] as string[]
    }

    const donors = await this.prisma.donor.findMany({
      where:{
        isDeleted:false,
        prefReminders:true,
        prefEmail:true
      },
      select:{
        id: true,
        firstName: true,
        lastName: true,
        personalEmail: true,
        officialEmail: true,
        specialOccasions: true,
      },
    })

    for(const donor of donors){

      const email =
        donor.personalEmail ||
        donor.officialEmail

      if(!email) continue

      // send email logic here

    }

    return result

  }

}
