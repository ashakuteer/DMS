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

async update(user: any, id: string, dto: any) {
  const existing = await this.prisma.beneficiary.findFirst({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new NotFoundException("Beneficiary not found");

  const data: any = {};
  if (dto.fullName !== undefined) data.fullName = dto.fullName;
  if (dto.homeType !== undefined) data.homeType = dto.homeType;
  if (dto.status !== undefined) data.status = dto.status;
  if (dto.gender !== undefined) data.gender = dto.gender || null;
  if (dto.dobDay !== undefined) data.dobDay = dto.dobDay ?? null;
  if (dto.dobMonth !== undefined) data.dobMonth = dto.dobMonth ?? null;
  if (dto.dobYear !== undefined) data.dobYear = dto.dobYear ?? null;
  if (dto.approxAge !== undefined) data.approxAge = dto.approxAge ?? null;
  if (dto.joinDate !== undefined) data.joinDate = dto.joinDate ? new Date(dto.joinDate) : null;
  if (dto.heightCmAtJoin !== undefined) data.heightCmAtJoin = dto.heightCmAtJoin ?? null;
  if (dto.weightKgAtJoin !== undefined) data.weightKgAtJoin = dto.weightKgAtJoin ?? null;
  if (dto.educationClassOrRole !== undefined) data.educationClassOrRole = dto.educationClassOrRole || null;
  if (dto.schoolOrCollege !== undefined) data.schoolOrCollege = dto.schoolOrCollege || null;
  if (dto.healthNotes !== undefined) data.healthNotes = dto.healthNotes || null;
  if (dto.currentHealthStatus !== undefined) data.currentHealthStatus = dto.currentHealthStatus || null;
  if (dto.background !== undefined) data.background = dto.background || null;
  if (dto.hobbies !== undefined) data.hobbies = dto.hobbies || null;
  if (dto.dreamCareer !== undefined) data.dreamCareer = dto.dreamCareer || null;
  if (dto.favouriteSubject !== undefined) data.favouriteSubject = dto.favouriteSubject || null;
  if (dto.favouriteGame !== undefined) data.favouriteGame = dto.favouriteGame || null;
  if (dto.favouriteActivityAtHome !== undefined) data.favouriteActivityAtHome = dto.favouriteActivityAtHome || null;
  if (dto.bestFriend !== undefined) data.bestFriend = dto.bestFriend || null;
  if (dto.sourceOfPrideOrHappiness !== undefined) data.sourceOfPrideOrHappiness = dto.sourceOfPrideOrHappiness || null;
  if (dto.funFact !== undefined) data.funFact = dto.funFact || null;
  if (dto.additionalNotes !== undefined) data.additionalNotes = dto.additionalNotes || null;

  return this.prisma.beneficiary.update({ where: { id }, data });
}

async updatePhoto(id: string, url: string | null, path: string | null) {
  const existing = await this.prisma.beneficiary.findFirst({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new NotFoundException("Beneficiary not found");

  return this.prisma.beneficiary.update({
    where: { id },
    data: { photoUrl: url, photoPath: path },
  });
}

async getTimelineEvents(beneficiaryId: string) {
  return this.prisma.beneficiaryTimelineEvent.findMany({
    where: { beneficiaryId },
    orderBy: { eventDate: "desc" },
  });
}

async addTimelineEvent(beneficiaryId: string, dto: any) {
  const existing = await this.prisma.beneficiary.findFirst({
    where: { id: beneficiaryId, isDeleted: false },
  });
  if (!existing) throw new NotFoundException("Beneficiary not found");

  return this.prisma.beneficiaryTimelineEvent.create({
    data: {
      beneficiaryId,
      eventType: dto.eventType as BeneficiaryEventType,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : new Date(),
      description: dto.description || "",
    },
  });
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
