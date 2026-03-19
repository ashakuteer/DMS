import { 
  PrismaClient, 
  Role, 
  DonorCategory, 
  Gender, 
  IncomeSpectrum,
  DonationMethod,
  DonationFrequency,
  DonationType,
  DonationMode,
  SourceOfDonor,
  OccasionType,
  FamilyRelationType,
  PledgeType,
  PledgeStatus,
  CampaignStatus,
  TemplateType,
  HomeType,
  SponsorshipType,
  SponsorshipFrequency,
  BeneficiaryStatus,
  BeneficiaryEventType,
  MessageChannel,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function generateDonorCode(index: number): string {
  return `AKF-DNR-${String(index).padStart(6, '0')}`;
}

async function main() {
  console.log('Seeding database...');

  // Create users
  const founderPassword = await bcrypt.hash('StrongPassword123', 10);
  const founder = await prisma.user.upsert({
    where: { email: 'founder@ngo.org' },
    update: {},
    create: {
      email: 'founder@ngo.org',
      password: founderPassword,
      name: 'Asha Kuteer Founder',
      role: Role.FOUNDER,
      isActive: true,
    },
  });
  console.log(`Created founder user: ${founder.email}`);

  const adminPassword = await bcrypt.hash('Admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ngo.org' },
    update: {},
    create: {
      email: 'admin@ngo.org',
      password: adminPassword,
      name: 'System Admin',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  const staffPassword = await bcrypt.hash('Staff123', 10);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@ngo.org' },
    update: {},
    create: {
      email: 'staff@ngo.org',
      password: staffPassword,
      name: 'Staff Member',
      role: Role.STAFF,
      isActive: true,
    },
  });
  console.log(`Created staff user: ${staff.email}`);

  // Clear existing donors and related data for clean reseed
  await prisma.donation.deleteMany({});
  await prisma.pledge.deleteMany({});
  await prisma.donorFamilyMember.deleteMany({});
  await prisma.donorSpecialOccasion.deleteMany({});
  await prisma.donor.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.beneficiary.deleteMany({});

  // Clear sponsorships, updates, and timeline events before beneficiaries
  await prisma.sponsorship.deleteMany({});
  await prisma.beneficiaryUpdate.deleteMany({});
  await prisma.beneficiaryTimelineEvent.deleteMany({});

  // Create individual beneficiaries
  const beneficiary1 = await prisma.beneficiary.create({
    data: {
      code: 'AKF-BEN-000001',
      fullName: 'Lakshmi Devi',
      homeType: HomeType.OLD_AGE,
      gender: 'FEMALE',
      approxAge: 72,
      background: 'Lakshmi Devi was abandoned by her family after her husband passed away. She has been with us for 5 years.',
      healthNotes: 'Diabetes, requires daily medication',
      hobbies: 'Knitting, storytelling',
      additionalNotes: 'Very kind and helps with younger residents',
      protectPrivacy: false,
      status: BeneficiaryStatus.ACTIVE,
      createdById: admin.id,
    },
  });

  const beneficiary2 = await prisma.beneficiary.create({
    data: {
      code: 'AKF-BEN-000002',
      fullName: 'Priya Kumari',
      homeType: HomeType.ORPHAN_GIRLS,
      gender: 'FEMALE',
      dobMonth: 6,
      dobDay: 15,
      educationClassOrRole: '8th Class',
      schoolOrCollege: 'Kendriya Vidyalaya',
      background: 'Priya lost both parents in an accident and has been with us since age 5.',
      dreamCareer: 'Doctor',
      favouriteSubject: 'Biology',
      favouriteGame: 'Badminton',
      bestFriend: 'Meena',
      funFact: 'Can solve Rubiks cube in under 2 minutes',
      protectPrivacy: false,
      status: BeneficiaryStatus.ACTIVE,
      createdById: admin.id,
    },
  });

  const beneficiary3 = await prisma.beneficiary.create({
    data: {
      code: 'AKF-BEN-000003',
      fullName: 'Ramesh Kumar',
      homeType: HomeType.BLIND_BOYS,
      gender: 'MALE',
      dobMonth: 3,
      dobDay: 22,
      educationClassOrRole: '10th Class',
      schoolOrCollege: 'School for the Blind, Secunderabad',
      background: 'Ramesh has been visually impaired since birth. His family could not afford special education.',
      dreamCareer: 'Music Teacher',
      hobbies: 'Playing harmonium, singing',
      favouriteSubject: 'Music',
      protectPrivacy: false,
      status: BeneficiaryStatus.ACTIVE,
      createdById: admin.id,
    },
  });

  const beneficiary4 = await prisma.beneficiary.create({
    data: {
      code: 'AKF-BEN-000004',
      fullName: 'Suresh Babu',
      homeType: HomeType.OLD_AGE,
      gender: 'MALE',
      approxAge: 78,
      background: 'Retired government employee, no family to care for him.',
      healthNotes: 'Blood pressure issues, mild arthritis',
      hobbies: 'Reading newspapers, playing chess',
      protectPrivacy: false,
      status: BeneficiaryStatus.ACTIVE,
      createdById: admin.id,
    },
  });

  const beneficiary5 = await prisma.beneficiary.create({
    data: {
      code: 'AKF-BEN-000005',
      fullName: 'Meena',
      homeType: HomeType.ORPHAN_GIRLS,
      gender: 'FEMALE',
      dobMonth: 11,
      dobDay: 8,
      educationClassOrRole: '8th Class',
      schoolOrCollege: 'Kendriya Vidyalaya',
      background: 'Meena was found at a railway station at age 3. She has been raised in our home.',
      dreamCareer: 'Teacher',
      favouriteSubject: 'Mathematics',
      favouriteGame: 'Chess',
      bestFriend: 'Priya',
      protectPrivacy: false,
      status: BeneficiaryStatus.ACTIVE,
      createdById: admin.id,
    },
  });

  console.log('Created 5 individual beneficiaries');

  // Create sample campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Diwali Food Drive 2026',
      description: 'Annual Diwali food distribution campaign',
      startDate: new Date('2026-10-15'),
      endDate: new Date('2026-11-15'),
      goalAmount: 500000,
      status: CampaignStatus.ACTIVE,
      createdById: admin.id,
    },
  });
  console.log('Created campaign');

  // Create sample donors
  const donor1 = await prisma.donor.create({
    data: {
      donorCode: generateDonorCode(1),
      firstName: 'Rajesh',
      middleName: 'Kumar',
      lastName: 'Sharma',
      primaryPhone: '9700700700',
      primaryPhoneCode: '+91',
      whatsappPhone: '9700700700',
      whatsappPhoneCode: '+91',
      personalEmail: 'rajesh.sharma@gmail.com',
      address: '45 Green Park',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      profession: 'Business Owner',
      approximateAge: 45,
      gender: Gender.MALE,
      incomeSpectrum: IncomeSpectrum.UPPER_MIDDLE,
      religion: 'Hindu',
      donationMethods: [DonationMethod.UPI, DonationMethod.BANK_TRANSFER],
      donationFrequency: DonationFrequency.MONTHLY,
      notes: 'Regular donor, prefers to donate on festivals',
      prefEmail: true,
      prefWhatsapp: true,
      prefReminders: true,
      category: DonorCategory.INDIVIDUAL,
      sourceOfDonor: SourceOfDonor.REFERRAL,
      pan: 'ABCDE1234F',
      dobDay: new Date().getDate(),
      dobMonth: new Date().getMonth() + 1,
      assignedToUserId: staff.id,
      createdById: admin.id,
    },
  });

  const donor2 = await prisma.donor.create({
    data: {
      donorCode: generateDonorCode(2),
      firstName: 'Priya',
      lastName: 'Patel',
      primaryPhone: '9988776655',
      primaryPhoneCode: '+91',
      personalEmail: 'priya.patel@yahoo.com',
      officialEmail: 'priya@techcorp.com',
      city: 'Bangalore',
      state: 'Karnataka',
      profession: 'Software Engineer',
      approximateAge: 32,
      gender: Gender.FEMALE,
      incomeSpectrum: IncomeSpectrum.HIGH,
      donationMethods: [DonationMethod.GPAY],
      donationFrequency: DonationFrequency.QUARTERLY,
      category: DonorCategory.INDIVIDUAL,
      sourceOfDonor: SourceOfDonor.SOCIAL_MEDIA,
      isSingleParent: true,
      dobDay: Math.min(new Date().getDate() + 3, 28),
      dobMonth: new Date().getMonth() + 1,
      assignedToUserId: staff.id,
      createdById: staff.id,
    },
  });

  const donor3 = await prisma.donor.create({
    data: {
      donorCode: generateDonorCode(3),
      firstName: 'ABC',
      lastName: 'Foundation',
      primaryPhone: '9123456789',
      primaryPhoneCode: '+91',
      officialEmail: 'donations@abcfoundation.org',
      address: '100 Corporate Park',
      city: 'Hyderabad',
      state: 'Telangana',
      category: DonorCategory.CSR_REP,
      sourceOfDonor: SourceOfDonor.WEBSITE,
      donationMethods: [DonationMethod.BANK_TRANSFER, DonationMethod.CHEQUE],
      donationFrequency: DonationFrequency.YEARLY,
      notes: 'CSR representative from ABC Corp',
      createdById: admin.id,
    },
  });

  const donor4 = await prisma.donor.create({
    data: {
      donorCode: generateDonorCode(4),
      firstName: 'Mohammed',
      lastName: 'Ali',
      primaryPhone: '9555444333',
      whatsappPhone: '9555444333',
      city: 'Chennai',
      state: 'Tamil Nadu',
      approximateAge: 68,
      gender: Gender.MALE,
      category: DonorCategory.INDIVIDUAL,
      isSeniorCitizen: true,
      sourceOfDonor: SourceOfDonor.WALK_IN,
      donationFrequency: DonationFrequency.OCCASIONAL,
      createdById: staff.id,
      assignedToUserId: staff.id,
    },
  });

  const donor5 = await prisma.donor.create({
    data: {
      donorCode: generateDonorCode(5),
      firstName: 'Wellness',
      middleName: 'WhatsApp',
      lastName: 'Group',
      whatsappPhone: '9000011111',
      category: DonorCategory.WHATSAPP_GROUP,
      sourceOfDonor: SourceOfDonor.SOCIAL_MEDIA,
      notes: 'WhatsApp group with 200+ members interested in donations',
      createdById: staff.id,
    },
  });
  console.log('Created donors');

  // Create special occasions for donor1 (month/day only, no year)
  await prisma.donorSpecialOccasion.createMany({
    data: [
      {
        donorId: donor1.id,
        type: OccasionType.DOB_SELF,
        month: 3,
        day: 15,
      },
      {
        donorId: donor1.id,
        type: OccasionType.ANNIVERSARY,
        month: 12,
        day: 10,
        relatedPersonName: 'Wedding Anniversary',
      },
      {
        donorId: donor1.id,
        type: OccasionType.DOB_SPOUSE,
        month: 7,
        day: 22,
        relatedPersonName: 'Sunita Sharma',
      },
    ],
  });

  await prisma.donorSpecialOccasion.create({
    data: {
      donorId: donor2.id,
      type: OccasionType.DOB_SELF,
      month: 8,
      day: 5,
    },
  });
  console.log('Created special occasions');

  // Create sponsorships linking donors to beneficiaries
  await prisma.sponsorship.create({
    data: {
      donorId: donor1.id,
      beneficiaryId: beneficiary2.id,
      sponsorshipType: SponsorshipType.EDUCATION,
      amount: 5000,
      currency: 'INR',
      frequency: SponsorshipFrequency.MONTHLY,
      startDate: new Date('2025-01-01'),
      isActive: true,
      notes: 'Sponsoring education for Priya',
    },
  });

  await prisma.sponsorship.create({
    data: {
      donorId: donor1.id,
      beneficiaryId: beneficiary1.id,
      sponsorshipType: SponsorshipType.FOOD,
      amount: 3000,
      currency: 'INR',
      frequency: SponsorshipFrequency.MONTHLY,
      startDate: new Date('2025-02-15'),
      isActive: true,
      notes: 'Monthly food support for elderly care',
    },
  });

  await prisma.sponsorship.create({
    data: {
      donorId: donor2.id,
      beneficiaryId: beneficiary3.id,
      sponsorshipType: SponsorshipType.FULL,
      amount: 10000,
      currency: 'INR',
      frequency: SponsorshipFrequency.MONTHLY,
      startDate: new Date('2024-06-01'),
      isActive: true,
      notes: 'Full sponsorship for Ramesh music education',
    },
  });

  await prisma.sponsorship.create({
    data: {
      donorId: donor3.id,
      beneficiaryId: beneficiary5.id,
      sponsorshipType: SponsorshipType.EDUCATION,
      amount: 5000,
      currency: 'INR',
      frequency: SponsorshipFrequency.QUARTERLY,
      startDate: new Date('2025-03-01'),
      isActive: true,
      notes: 'Education support',
    },
  });
  console.log('Created sponsorships');

  // Create beneficiary updates
  await prisma.beneficiaryUpdate.create({
    data: {
      beneficiaryId: beneficiary2.id,
      title: 'Outstanding Performance in Exams',
      content: 'Priya scored 95% in her mid-term exams, ranking first in her class!',
      createdById: admin.id,
    },
  });

  await prisma.beneficiaryUpdate.create({
    data: {
      beneficiaryId: beneficiary3.id,
      title: 'Music Competition Winner',
      content: 'Ramesh won first place in the inter-school classical music competition.',
      createdById: staff.id,
    },
  });

  await prisma.beneficiaryUpdate.create({
    data: {
      beneficiaryId: beneficiary1.id,
      title: 'Health Checkup Completed',
      content: 'Lakshmi Devi had her quarterly health checkup. All vitals are stable.',
      createdById: staff.id,
    },
  });
  console.log('Created beneficiary updates');

  // Create beneficiary timeline events
  await prisma.beneficiaryTimelineEvent.create({
    data: {
      beneficiaryId: beneficiary2.id,
      eventType: BeneficiaryEventType.ACHIEVEMENT,
      eventDate: new Date('2025-12-15'),
      description: 'Won first prize in Science Fair',
    },
  });

  await prisma.beneficiaryTimelineEvent.create({
    data: {
      beneficiaryId: beneficiary2.id,
      eventType: BeneficiaryEventType.EDUCATION,
      eventDate: new Date('2025-04-01'),
      description: 'Promoted to 9th standard',
    },
  });

  await prisma.beneficiaryTimelineEvent.create({
    data: {
      beneficiaryId: beneficiary3.id,
      eventType: BeneficiaryEventType.JOINED,
      eventDate: new Date('2020-07-15'),
      description: 'Joined our institution',
    },
  });
  console.log('Created beneficiary timeline events');

  // Create family members for donor1 (birthMonth/birthDay only, no year)
  await prisma.donorFamilyMember.createMany({
    data: [
      {
        donorId: donor1.id,
        relationType: FamilyRelationType.SPOUSE,
        name: 'Sunita Sharma',
        birthMonth: 7,
        birthDay: 22,
      },
      {
        donorId: donor1.id,
        relationType: FamilyRelationType.CHILD,
        name: 'Amit Sharma',
        birthMonth: 1,
        birthDay: 10,
      },
      {
        donorId: donor1.id,
        relationType: FamilyRelationType.CHILD,
        name: 'Anjali Sharma',
        birthMonth: 5,
        birthDay: 18,
      },
    ],
  });
  console.log('Created family members');

  // Create donations
  const currentYear = new Date().getFullYear();
  const financialYear = `${currentYear - 1}-${currentYear}`;

  await prisma.donation.createMany({
    data: [
      {
        donorId: donor1.id,
        donationDate: new Date('2025-10-20'),
        donationAmount: 25000,
        donationType: DonationType.CASH,
        donationMode: DonationMode.BANK_TRANSFER,
        transactionId: 'TXN001234567',
        remarks: 'Diwali contribution',
        homeId: beneficiary1.id,
        visitedHome: true,
        servedFood: true,
        receiptNumber: '001',
        financialYear: financialYear,
        createdById: staff.id,
        campaignId: campaign.id,
      },
      {
        donorId: donor1.id,
        donationDate: new Date('2025-12-25'),
        donationAmount: 15000,
        donationType: DonationType.GROCERY,
        donationMode: DonationMode.UPI,
        transactionId: 'UPI987654321',
        remarks: 'Christmas grocery donation',
        homeId: beneficiary2.id,
        visitedHome: false,
        receiptNumber: '002',
        financialYear: financialYear,
        createdById: staff.id,
      },
      {
        donorId: donor2.id,
        donationDate: new Date('2026-01-15'),
        donationAmount: 10000,
        donationType: DonationType.CASH,
        donationMode: DonationMode.GPAY,
        transactionId: 'GPAY112233',
        receiptNumber: '003',
        financialYear: financialYear,
        createdById: staff.id,
      },
      {
        donorId: donor3.id,
        donationDate: new Date('2025-11-01'),
        donationAmount: 100000,
        donationType: DonationType.CASH,
        donationMode: DonationMode.BANK_TRANSFER,
        transactionId: 'NEFT20251101ABC',
        remarks: 'CSR quarterly contribution Q3',
        receiptNumber: '004',
        financialYear: financialYear,
        createdById: staff.id,
        campaignId: campaign.id,
      },
      {
        donorId: donor4.id,
        donationDate: new Date('2026-01-10'),
        donationAmount: 5000,
        donationType: DonationType.CASH,
        donationMode: DonationMode.CASH,
        remarks: 'Walk-in cash donation',
        homeId: beneficiary1.id,
        visitedHome: true,
        servedFood: true,
        receiptNumber: '005',
        financialYear: financialYear,
        createdById: staff.id,
      },
    ],
  });
  console.log('Created donations');

  // Create pledges
  await prisma.pledge.createMany({
    data: [
      {
        donorId: donor1.id,
        pledgeType: PledgeType.MONEY,
        amount: 50000,
        expectedFulfillmentDate: new Date('2026-04-01'),
        status: PledgeStatus.PENDING,
        notes: 'Annual pledge for FY 2026-27',
        createdById: staff.id,
      },
      {
        donorId: donor3.id,
        pledgeType: PledgeType.MONEY,
        amount: 500000,
        expectedFulfillmentDate: new Date('2026-03-31'),
        status: PledgeStatus.PENDING,
        notes: 'CSR budget allocation for 2026',
        createdById: admin.id,
      },
      {
        donorId: donor2.id,
        pledgeType: PledgeType.RICE,
        quantity: '25kg monthly',
        expectedFulfillmentDate: new Date('2026-02-15'),
        status: PledgeStatus.PENDING,
        notes: 'Monthly rice donation starting Feb',
        createdById: staff.id,
      },
      {
        donorId: donor1.id,
        pledgeType: PledgeType.MEAL_SPONSOR,
        quantity: '1 meal event',
        expectedFulfillmentDate: new Date('2026-03-01'),
        status: PledgeStatus.PENDING,
        notes: 'Promised to sponsor a meal event',
        createdById: admin.id,
      },
    ],
  });
  console.log('Created pledges');

  // Seed default communication templates
  await prisma.communicationTemplate.deleteMany({});
  
  const defaultTemplates = [
    {
      type: TemplateType.THANK_YOU,
      name: 'Thank You (Donation Received)',
      description: 'Sent after receiving a donation',
      whatsappMessage: `Dear {{donor_name}},

Thank you for your generous donation of Rs. {{amount}} received on {{donation_date}}.

Your support helps us continue our mission to serve those in need. Receipt #{{receipt_number}} has been generated.

With gratitude,
Asha Kuteer Foundation`,
      emailSubject: 'Thank You for Your Donation - Receipt #{{receipt_number}}',
      emailBody: `Dear {{donor_name}},

We are deeply grateful for your generous donation of Rs. {{amount}} received on {{donation_date}}.

Your contribution towards {{program_name}} helps us continue our mission to support and uplift the lives of those in need.

Your receipt number is: {{receipt_number}}

Thank you for being a valued supporter of Asha Kuteer Foundation.

With warm regards,
Asha Kuteer Foundation Team`,
      createdById: admin.id,
    },
    {
      type: TemplateType.GENTLE_FOLLOWUP,
      name: 'Gentle Follow-up',
      description: 'For follow-up with donors who have not donated recently',
      whatsappMessage: `Dear {{donor_name}},

Hope you are doing well! We wanted to share some updates from Asha Kuteer Foundation.

Your past support has made a real difference. If you'd like to continue supporting our cause, we would be grateful for any contribution.

Warm regards,
Asha Kuteer Foundation`,
      emailSubject: 'We Miss Your Support - Asha Kuteer Foundation',
      emailBody: `Dear {{donor_name}},

We hope this message finds you in good health and spirits.

We wanted to reach out and share some recent developments at Asha Kuteer Foundation. Your past contributions have helped us make a significant impact in the lives of many.

As we continue our mission, we would be grateful if you could consider supporting us once again. Every contribution, big or small, makes a difference.

Thank you for being part of our journey.

Warm regards,
Asha Kuteer Foundation Team`,
      createdById: admin.id,
    },
    {
      type: TemplateType.MONTHLY_REMINDER,
      name: 'Monthly Donor Reminder',
      description: 'Monthly reminder for regular donors',
      whatsappMessage: `Dear {{donor_name}},

This is a friendly reminder for your monthly contribution to Asha Kuteer Foundation.

Your regular support helps us plan and sustain our programs effectively. Thank you for your continued generosity!

Asha Kuteer Foundation`,
      emailSubject: 'Monthly Contribution Reminder - Asha Kuteer Foundation',
      emailBody: `Dear {{donor_name}},

We hope you're doing well!

This is a gentle reminder regarding your monthly contribution to Asha Kuteer Foundation. Your consistent support enables us to plan our programs effectively and create lasting impact.

If you have any questions or need assistance, please don't hesitate to reach out.

Thank you for your continued generosity!

Warm regards,
Asha Kuteer Foundation Team`,
      createdById: admin.id,
    },
    {
      type: TemplateType.FESTIVAL_GREETING,
      name: 'Festival Greeting',
      description: 'Festival wishes to donors',
      whatsappMessage: `Dear {{donor_name}},

Wishing you and your family a joyous festival season filled with happiness and prosperity!

Thank you for being a valued supporter of Asha Kuteer Foundation. May this festive season bring you peace and joy.

Warm wishes,
Asha Kuteer Foundation`,
      emailSubject: 'Festival Greetings from Asha Kuteer Foundation',
      emailBody: `Dear {{donor_name}},

As we celebrate this festive season, we want to extend our warmest wishes to you and your family.

May this time bring you joy, peace, and prosperity. We are grateful to have supporters like you who make our mission possible.

Thank you for your kindness and generosity throughout the year.

With warm festive wishes,
Asha Kuteer Foundation Team`,
      createdById: admin.id,
    },
    {
      type: TemplateType.RECEIPT_RESEND,
      name: 'Receipt Re-send',
      description: 'When a donor requests their receipt again',
      whatsappMessage: `Dear {{donor_name}},

As requested, here is a reminder of your donation details:
Amount: Rs. {{amount}}
Date: {{donation_date}}
Receipt: #{{receipt_number}}

Please let us know if you need any further assistance.

Asha Kuteer Foundation`,
      emailSubject: 'Your Donation Receipt - #{{receipt_number}}',
      emailBody: `Dear {{donor_name}},

As per your request, please find below the details of your donation:

Donation Amount: Rs. {{amount}}
Donation Date: {{donation_date}}
Receipt Number: {{receipt_number}}
Program: {{program_name}}

If you need the original receipt document, please reply to this email and we will send it to you.

Thank you for your support!

Warm regards,
Asha Kuteer Foundation Team`,
      createdById: admin.id,
    },
    {
      type: TemplateType.BIRTHDAY_ANNIVERSARY,
      name: 'Birthday / Anniversary Wish',
      description: 'Special occasion greetings',
      whatsappMessage: `Dear {{donor_name}},

Wishing you a wonderful day filled with joy and happiness!

Thank you for being a valued member of the Asha Kuteer Foundation family. May this special day bring you blessings and joy.

Warm wishes,
Asha Kuteer Foundation`,
      emailSubject: 'Warm Wishes from Asha Kuteer Foundation',
      emailBody: `Dear {{donor_name}},

On this special day, we want to extend our warmest wishes to you!

May this occasion bring you joy, good health, and happiness. We are grateful to have you as part of the Asha Kuteer Foundation family.

Thank you for your continued support and kindness.

With warm wishes,
Asha Kuteer Foundation Team`,
      createdById: admin.id,
    },
  ];

  for (const template of defaultTemplates) {
    await prisma.communicationTemplate.create({ data: template });
  }
  console.log('Created default communication templates');

  await prisma.messageTemplate.upsert({
    where: { key_channel: { key: 'DONOR_BIRTHDAY_WISH', channel: MessageChannel.WHATSAPP } },
    update: {},
    create: {
      key: 'DONOR_BIRTHDAY_WISH',
      channel: MessageChannel.WHATSAPP,
      body: `Dear {{donor_name}},

Happy Birthday! On this special day, {{org_name}} thanks you for your generous support.
{{beneficiary_line}}
Wishing you a wonderful year ahead filled with joy and good health.

With gratitude,
{{org_name}}`,
    },
  });

  await prisma.messageTemplate.upsert({
    where: { key_channel: { key: 'DONOR_BIRTHDAY_WISH', channel: MessageChannel.EMAIL } },
    update: {},
    create: {
      key: 'DONOR_BIRTHDAY_WISH',
      channel: MessageChannel.EMAIL,
      subject: 'Happy Birthday, {{donor_name}}! - {{org_name}}',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<p>Dear <strong>{{donor_name}}</strong>,</p>

<p>Wishing you a very <strong>Happy Birthday!</strong></p>

<p>On this special day, <strong>{{org_name}}</strong> wants to express our heartfelt gratitude for your incredible generosity and continued support.</p>

<p>{{beneficiary_line}}</p>

{{image_block}}

<p>May this new year of your life bring you abundant joy, good health, and happiness.</p>

<p>With warm regards,<br/>
<strong>{{org_name}}</strong></p>
</div>`,
    },
  });
  console.log('Created birthday wish message templates');

  // BENEFICIARY_BIRTHDAY_WISH templates
  await prisma.messageTemplate.upsert({
    where: { key_channel: { key: 'BENEFICIARY_BIRTHDAY_WISH', channel: MessageChannel.WHATSAPP } },
    update: {},
    create: {
      key: 'BENEFICIARY_BIRTHDAY_WISH',
      channel: MessageChannel.WHATSAPP,
      body: `Dear {{donor_name}},

{{birthday_intro}}

{{beneficiary_name}} from {{home_name}} {{update_snippet}}.

Thank you for being a wonderful sponsor. Your kindness means the world to them.

With warm regards,
{{org_name}}`,
    },
  });

  await prisma.messageTemplate.upsert({
    where: { key_channel: { key: 'BENEFICIARY_BIRTHDAY_WISH', channel: MessageChannel.EMAIL } },
    update: {},
    create: {
      key: 'BENEFICIARY_BIRTHDAY_WISH',
      channel: MessageChannel.EMAIL,
      subject: `{{beneficiary_name}}'s Birthday - {{org_name}}`,
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<p>Dear <strong>{{donor_name}}</strong>,</p>
{{birthday_intro}}
<p>Your generous support has made a real difference in their life. Here's a recent update: <em>{{update_snippet}}</em></p>
<p>Thank you for being a part of <strong>{{beneficiary_name}}</strong>'s journey with <strong>{{org_name}}</strong>. Your kindness and compassion continue to bring hope and joy.</p>
<p>Warm regards,<br/><strong>{{org_name}}</strong></p>
</div>`,
    },
  });
  console.log('Created beneficiary birthday wish message templates');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
