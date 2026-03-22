import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, TaskType, TaskPriority, PledgeStatus } from '@prisma/client';

@Injectable()
export class TaskSchedulerService {
  private readonly logger = new Logger(TaskSchedulerService.name);

  constructor(private prisma: PrismaService) {}

  @Cron('0 8 * * *')
  async runDailyTaskGeneration() {
    this.logger.log('Daily task generation started');
    const results = await Promise.allSettled([
      this.generateBirthdayTasks(),
      this.generatePledgeFollowUpTasks(),
      this.generateDonationFollowUpTasks(),
    ]);
    results.forEach((r, i) => {
      const names = ['birthday', 'pledge', 'donation'];
      if (r.status === 'rejected') {
        this.logger.error(`${names[i]} task generation failed: ${r.reason}`);
      }
    });
    this.logger.log('Daily task generation complete');
  }

  async generateBirthdayTasks(): Promise<number> {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const donors = await this.prisma.donor.findMany({
      where: { dobMonth: month, dobDay: day, isDeleted: false },
      select: { id: true, firstName: true, lastName: true },
    });

    let created = 0;
    for (const donor of donors) {
      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.BIRTHDAY,
          donorId: donor.id,
          dueDate: { gte: todayStart, lt: tomorrow },
        },
      });
      if (!existing) {
        await this.prisma.task.create({
          data: {
            title: `Wish ${donor.firstName} ${donor.lastName} happy birthday`,
            type: TaskType.BIRTHDAY,
            priority: TaskPriority.HIGH,
            status: TaskStatus.PENDING,
            dueDate: todayStart,
            donorId: donor.id,
          },
        });
        created++;
      }
    }

    this.logger.log(
      `Birthday tasks: ${created} created (${donors.length} donors have birthday today)`,
    );
    return created;
  }

  async generatePledgeFollowUpTasks(): Promise<number> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const pendingPledges = await this.prisma.pledge.findMany({
      where: { status: PledgeStatus.PENDING, isDeleted: false },
      select: { id: true, donorId: true },
    });

    let created = 0;
    for (const pledge of pendingPledges) {
      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.PLEDGE,
          donorId: pledge.donorId,
          createdAt: { gte: sevenDaysAgo },
        },
      });
      if (!existing) {
        await this.prisma.task.create({
          data: {
            title: `Follow up for pledge`,
            type: TaskType.PLEDGE,
            priority: TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            dueDate: todayStart,
            donorId: pledge.donorId,
          },
        });
        created++;
      }
    }

    this.logger.log(
      `Pledge follow-up tasks: ${created} created (${pendingPledges.length} pending pledges checked)`,
    );
    return created;
  }

  async generateDonationFollowUpTasks(): Promise<number> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(todayStart);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyOneDaysAgo = new Date(todayStart);
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

    const donations = await this.prisma.donation.findMany({
      where: {
        donationDate: { gte: thirtyOneDaysAgo, lt: thirtyDaysAgo },
        isDeleted: false,
      },
      select: { id: true, donorId: true },
    });

    let created = 0;
    for (const donation of donations) {
      const existing = await this.prisma.task.findFirst({
        where: {
          type: TaskType.FOLLOW_UP,
          donorId: donation.donorId,
          dueDate: { gte: thirtyDaysAgo },
        },
      });
      if (!existing) {
        await this.prisma.task.create({
          data: {
            title: `Call donor for feedback`,
            type: TaskType.FOLLOW_UP,
            priority: TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            dueDate: todayStart,
            donorId: donation.donorId,
          },
        });
        created++;
      }
    }

    this.logger.log(
      `Donation follow-up tasks: ${created} created (${donations.length} donations hit 30-day mark)`,
    );
    return created;
  }
}
