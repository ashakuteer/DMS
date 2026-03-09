import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'

import { SpecialDaysProcessor } from './processors/special-days.processor'
import { PledgeRemindersProcessor } from './processors/pledge-reminders.processor'
import { BeneficiaryBirthdayProcessor } from './processors/beneficiary-birthday.processor'
import { SponsorshipReminderProcessor } from './processors/sponsorship-reminder.processor'

@Injectable()
export class AutoEmailReminderService {

  private readonly logger = new Logger(AutoEmailReminderService.name)

  constructor(
    private specialDays: SpecialDaysProcessor,
    private pledges: PledgeRemindersProcessor,
    private beneficiaryBirthdays: BeneficiaryBirthdayProcessor,
    private sponsorships: SponsorshipReminderProcessor
  ) {}

  @Cron('0 9 * * *', { timeZone: 'Asia/Kolkata' })
  async runDailyReminderJob() {

    this.logger.log('Starting daily reminder job')

    const result = {
      specialDaysQueued: 0,
      pledgesQueued: 0,
      sponsorshipsQueued: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    }

    try {

      const special = await this.specialDays.process()
      const pledges = await this.pledges.process()
      const birthdays = await this.beneficiaryBirthdays.process()
      const sponsorships = await this.sponsorships.process()

      result.specialDaysQueued = special.queued + birthdays.queued
      result.pledgesQueued = pledges.queued
      result.sponsorshipsQueued = sponsorships.queued

      result.sent =
        special.sent +
        pledges.sent +
        birthdays.sent +
        sponsorships.sent

      result.failed =
        special.failed +
        pledges.failed +
        birthdays.failed +
        sponsorships.failed

      result.errors.push(
        ...special.errors,
        ...pledges.errors,
        ...birthdays.errors,
        ...sponsorships.errors
      )

    } catch (error:any) {

      this.logger.error(error.message)
      result.errors.push(error.message)

    }

    return result

  }

}
