import { OccasionType, ReminderTaskType } from '@prisma/client';

export function mapOccasionTypeToReminderType(occasionType: OccasionType): ReminderTaskType {
  switch (occasionType) {
    case OccasionType.DOB_SELF:
    case OccasionType.DOB_SPOUSE:
    case OccasionType.DOB_CHILD:
      return ReminderTaskType.BIRTHDAY;
    case OccasionType.ANNIVERSARY:
      return ReminderTaskType.ANNIVERSARY;
    case OccasionType.DEATH_ANNIVERSARY:
      return ReminderTaskType.MEMORIAL;
    default:
      return ReminderTaskType.FOLLOW_UP;
  }
}

export function getOffsetText(offset: number): string {
  switch (offset) {
    case 30: return 'in 30 days';
    case 15: return 'in 15 days';
    case 7: return 'in 7 days';
    case 2: return 'in 2 days';
    case 0: return 'Today';
    default: return `in ${offset} days`;
  }
}

export function getOccasionTitle(
  occasion: { type: OccasionType; relatedPersonName?: string | null },
  offset: number,
): string {
  const offsetText = getOffsetText(offset);
  const isSameDay = offset === 0;

  switch (occasion.type) {
    case OccasionType.DOB_SELF:
      return isSameDay ? 'Birthday Today' : `Birthday ${offsetText}`;
    case OccasionType.DOB_SPOUSE:
      return isSameDay
        ? `${occasion.relatedPersonName || 'Spouse'}'s Birthday Today`
        : `${occasion.relatedPersonName || 'Spouse'}'s Birthday ${offsetText}`;
    case OccasionType.DOB_CHILD:
      return isSameDay
        ? `${occasion.relatedPersonName || 'Child'}'s Birthday Today`
        : `${occasion.relatedPersonName || 'Child'}'s Birthday ${offsetText}`;
    case OccasionType.ANNIVERSARY:
      return isSameDay ? 'Anniversary Today' : `Anniversary ${offsetText}`;
    case OccasionType.DEATH_ANNIVERSARY:
      return isSameDay ? 'Memorial Today' : `Memorial ${offsetText}`;
    default:
      return isSameDay ? 'Special Occasion Today' : `Special Occasion ${offsetText}`;
  }
}

export function getFamilyBirthdayTitle(
  familyMember: { name: string; relationType: string },
  offset: number,
): string {
  const offsetText = getOffsetText(offset);
  const isSameDay = offset === 0;
  return isSameDay
    ? `${familyMember.name}'s Birthday Today`
    : `${familyMember.name}'s Birthday ${offsetText}`;
}

export function calculateNextOccurrence(month: number, day: number, targetYear?: number): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = targetYear || today.getFullYear();
  let nextDate = new Date(year, month - 1, day);
  nextDate.setHours(0, 0, 0, 0);

  if (nextDate < today && !targetYear) {
    nextDate = new Date(year + 1, month - 1, day);
    nextDate.setHours(0, 0, 0, 0);
  }

  return nextDate;
}

export function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}
