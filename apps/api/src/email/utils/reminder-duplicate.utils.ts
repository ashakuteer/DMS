import { PrismaService } from '../../prisma/prisma.service'
import { EmailStatus } from '@prisma/client'

export async function checkDuplicate(
  prisma: PrismaService,
  donorId:string,
  type:string,
  relatedId:string,
  offsetDays:number
){

  const existing = await prisma.emailLog.findFirst({
    where:{
      donorId,
      subType:{ contains:type },
      relatedId,
      offsetDays,
      status: EmailStatus.SENT
    }
  })

  return !!existing

}
