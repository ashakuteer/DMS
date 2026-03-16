import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const beneficiariesTable = pgTable("beneficiaries", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
  gender: text("gender"),
  home: text("home").notNull(),
  admissionDate: timestamp("admission_date", { withTimezone: true }),
  status: text("status").notNull().default("Active"),
  photoUrl: text("photo_url"),
  medicalInfo: text("medical_info"),
  educationInfo: text("education_info"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBeneficiarySchema = createInsertSchema(beneficiariesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBeneficiary = z.infer<typeof insertBeneficiarySchema>;
export type Beneficiary = typeof beneficiariesTable.$inferSelect;
