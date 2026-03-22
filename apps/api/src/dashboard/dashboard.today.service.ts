import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardTodayService {
  constructor(private readonly prisma: PrismaService) {}

  async getToday() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const todayMonth = now.getMonth() + 1;
    const todayDay = now.getDate();

    const [
      todayDonations,
      birthdayDonors,
      allTasks,
      reminders,
    ] = await Promise.all([
      this.prisma.donation.findMany({
        where: {
          deletedAt: null,
          donationDate: { gte: todayStart, lte: todayEnd },
        },
        select: {
          donationAmount: true,
          donor: { select: { id: true } },
        },
      }),
      this.prisma.donor.findMany({
        where: {
          deletedAt: null,
          dobMonth: todayMonth,
          dobDay: todayDay,
        },
        select: { id: true, firstName: true, lastName: true, primaryPhone: true, city: true },
        take: 50,
      }),
      this.prisma.task.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { lte: todayEnd },
        },
        select: {
          id: true,
          title: true,
          type: true,
          priority: true,
          dueDate: true,
          status: true,
          donor: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 50,
      }),
      this.prisma.reminder.findMany({
        where: {
          status: 'PENDING',
          dueDate: { gte: todayStart, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          donor: { select: { id: true, firstName: true, lastName: true, primaryPhone: true } },
        },
        take: 30,
      }),
    ]);

    const toNum = (v: any) => typeof v === 'object' ? v.toNumber() : Number(v || 0);

    const totalAmountToday = todayDonations.reduce((s, d) => s + toNum(d.donationAmount), 0);
    const uniqueDonorIds = new Set(todayDonations.map(d => d.donor.id));

    const todayStats = {
      totalDonationsToday: todayDonations.length,
      totalDonorsToday: uniqueDonorIds.size,
      totalAmountToday,
    };

    const todayEvents = {
      birthdays: birthdayDonors.map(d => ({
        id: d.id,
        name: `${d.firstName} ${d.lastName || ''}`.trim(),
        phone: d.primaryPhone || '-',
        city: d.city || '-',
      })),
      anniversaries: [],
      memorials: [],
      specialDays: [],
    };

    const followUps = allTasks.filter(t => t.type === 'FOLLOW_UP').map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      dueDate: t.dueDate,
      status: t.status,
      donorName: t.donor ? `${t.donor.firstName} ${t.donor.lastName || ''}`.trim() : null,
    }));

    const pledgeReminders = allTasks.filter(t => t.type === 'PLEDGE').map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      dueDate: t.dueDate,
      status: t.status,
      donorName: t.donor ? `${t.donor.firstName} ${t.donor.lastName || ''}`.trim() : null,
    }));

    const monthlyDonorReminders = reminders.map(r => ({
      id: r.id,
      title: r.title,
      dueDate: r.dueDate,
      donorName: r.donor ? `${r.donor.firstName} ${r.donor.lastName || ''}`.trim() : null,
      donorPhone: r.donor?.primaryPhone || null,
    }));

    const todayTasks = { followUps, pledgeReminders, monthlyDonorReminders };

    return { todayStats, todayEvents, todayTasks };
  }
}
