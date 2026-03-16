import { z } from "zod";

// Zod schemas for forms that map to our OpenAPI definitions
// Using z.coerce for robust form value parsing

export const donorSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  donorType: z.enum(["Individual", "Organization", "Corporate", "Foundation"]),
  status: z.enum(["Active", "Inactive", "Prospect"]),
  notes: z.string().optional().or(z.literal("")),
});

export const donationSchema = z.object({
  donorId: z.string().min(1, "Donor is required"),
  amount: z.coerce.number().min(1, "Amount must be positive"),
  currency: z.string().min(1, "Currency is required"),
  donationDate: z.string().min(1, "Date is required"),
  paymentMethod: z.string().optional().or(z.literal("")),
  purpose: z.string().optional().or(z.literal("")),
  receiptNumber: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const beneficiarySchema = z.object({
  name: z.string().min(2, "Name is required"),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  home: z.enum(["Girls Home - Uppal", "Blind Home - Begumpet", "Old Age Home - Peerzadiguda"]),
  status: z.enum(["Active", "Graduated", "Transferred", "Deceased"]),
  medicalInfo: z.string().optional().or(z.literal("")),
  educationInfo: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const sponsorshipSchema = z.object({
  donorId: z.string().min(1, "Donor is required"),
  beneficiaryId: z.string().min(1, "Beneficiary is required"),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().optional().or(z.literal("")),
  monthlyAmount: z.coerce.number().min(1, "Amount must be positive"),
  currency: z.string().min(1, "Currency is required"),
  status: z.enum(["Active", "Paused", "Ended"]),
  notes: z.string().optional().or(z.literal("")),
});

export const communicationSchema = z.object({
  donorId: z.string().optional().or(z.literal("")),
  subject: z.string().min(2, "Subject is required"),
  body: z.string().min(2, "Message body is required"),
  type: z.enum(["Email", "Letter", "Phone", "SMS", "Meeting"]),
  sentAt: z.string().optional().or(z.literal("")),
});

export const timeMachineSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(5, "Description is required"),
  category: z.enum([
    "Success Story", "Inspiring Story", "Recognition", "Donor Support", 
    "Event by Kids", "Visitor Visit", "Challenge / Problem", "General Update"
  ]),
  home: z.enum([
    "All Homes", "Girls Home - Uppal", "Blind Home - Begumpet", "Old Age Home - Peerzadiguda"
  ]),
  eventDate: z.string().min(1, "Event Date is required"),
});
