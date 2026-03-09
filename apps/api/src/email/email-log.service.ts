import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { EmailStatus } from '@prisma/client'

@Injectable()
export class EmailLogService {

  private logger = new Logger(EmailLogService.name)

  constructor(private prisma: PrismaService){}

  async logEmail(
    donorId:string,
    toEmail:string,
    subject:string,
    success:boolean,
    messageId?:string,
    errorMessage?:string,
    metadata?:{
      subType?:string
      relatedId?:string
      offsetDays?:number | null
    }
  ){

    try{

      await this.prisma.emailLog.create({
        data:{
          donorId,
          toEmail,
          subject,
          status: success ? EmailStatus.SENT : EmailStatus.FAILED,
          messageId,
          errorMessage,
          subType: metadata?.subType,
          relatedId: metadata?.relatedId,
          offsetDays: metadata?.offsetDays
        }
      })

    }catch(error){
      this.logger.error(`Failed to log email ${error}`)
    }

  }

}
