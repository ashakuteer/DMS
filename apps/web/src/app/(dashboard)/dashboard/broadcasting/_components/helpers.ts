import { BroadcastFilters } from "./types";

export const SUPPORT_PREFERENCES = [
  "GROCERIES",
  "EDUCATION",
  "MEDICINES",
  "TOILETRIES",
  "SPONSORSHIP",
  "GENERAL",
];

export const DEFAULT_FILTERS: BroadcastFilters = {
  country: "India",
  supportPreferences: [],
};
