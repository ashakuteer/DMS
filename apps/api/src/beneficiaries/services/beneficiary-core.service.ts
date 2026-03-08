import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../audit/audit.service";
import { RolePermissionsService } from "../../role-permissions/role-permissions.service";
import { BeneficiaryEventType, HomeType } from "@prisma/client";

@Injectable()
export class BeneficiaryCoreService {

constructor(
  private prisma: PrismaService,
  private auditService: AuditService,
  private rolePermissionsService: RolePermissionsService,
) {}

private async generateBeneficiaryCode(): Promise<string> {

  const lastBeneficiary = await this.prisma.beneficiary.findFirst({
    orderBy: { code: "desc" },
    select: { code: true }
  });

  let nextNum = 1;

  if (lastBeneficiary?.code) {
    const match = lastBeneficiary.code.match(/AKF-BEN-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }

  return `AKF-BEN-${String(nextNum).padStart(6,"0")}`;
}

async findAll(options:any){

  const { page = 1, limit = 20 } = options;

  const [beneficiaries,total] = await Promise.all([
    this.prisma.beneficiary.findMany({
      where:{ isDeleted:false },
      skip:(page-1)*limit,
      take:limit,
      orderBy:{ createdAt:"desc"}
    }),
    this.prisma.beneficiary.count({ where:{ isDeleted:false }})
  ])

  return { data:beneficiaries,total }
}

async findById(id:string){

  const beneficiary = await this.prisma.beneficiary.findFirst({
    where:{ id,isDeleted:false }
  })

  if(!beneficiary) throw new NotFoundException("Beneficiary not found")

  return beneficiary
}

async create(user:any,dto:any){

  if(!dto.fullName || !dto.homeType){
    throw new BadRequestException("Full name and home type required")
  }

  const code = await this.generateBeneficiaryCode()

  const beneficiary = await this.prisma.beneficiary.create({
    data:{
      code,
      fullName:dto.fullName,
      homeType:dto.homeType as HomeType,
      createdById:user.id
    }
  })

  await this.prisma.beneficiaryTimelineEvent.create({
    data:{
      beneficiaryId:beneficiary.id,
      eventType:BeneficiaryEventType.PROFILE_CREATED,
      eventDate:new Date(),
      description:`Profile created`
    }
  })

  await this.auditService.logBeneficiaryCreate(
    user.id,
    beneficiary.id,
    beneficiary as any
  )

  return beneficiary
}

async delete(user:any,id:string){

 const existing = await this.prisma.beneficiary.findFirst({
   where:{id,isDeleted:false}
 })

 if(!existing) throw new NotFoundException("Beneficiary not found")

 await this.prisma.beneficiary.update({
   where:{id},
   data:{ isDeleted:true, deletedAt:new Date()}
 })

 await this.auditService.logBeneficiaryDelete(user.id,id,existing as any)

 return { success:true }
}

}
