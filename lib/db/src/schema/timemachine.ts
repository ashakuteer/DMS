import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const timeMachineTable = pgTable("time_machine", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  home: text("home").notNull(),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  photos: text("photos").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTimeMachineSchema = createInsertSchema(timeMachineTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTimeMachine = z.infer<typeof insertTimeMachineSchema>;
export type TimeMachine = typeof timeMachineTable.$inferSelect;
