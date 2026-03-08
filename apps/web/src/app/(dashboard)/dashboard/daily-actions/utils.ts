export const pledgeTypeLabels: Record<string, string> = {
  MONEY: "Money",
  RICE: "Rice",
  GROCERIES: "Groceries",
  MEDICINES: "Medicines",
  MEAL_SPONSOR: "Meal Sponsor",
  VISIT: "Visit",
  OTHER: "Other",
}

export const typeLabels: Record<string, string> = {
  DOB_SELF: "Birthday",
  DOB_SPOUSE: "Spouse Birthday",
  DOB_CHILD: "Child Birthday",
  ANNIVERSARY: "Anniversary",
  DEATH_ANNIVERSARY: "Memorial",
  OTHER: "Special Day",
}

export const formatCurrency = (amount: number, currency = "INR") =>
  currency === "INR"
    ? `Rs. ${amount.toLocaleString("en-IN")}`
    : `${currency} ${amount.toLocaleString()}`
