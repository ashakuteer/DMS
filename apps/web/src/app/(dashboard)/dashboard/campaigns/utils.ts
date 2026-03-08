export const HOME_LABELS: Record<string, string> = {
  ORPHAN_GIRLS: "Orphan Girls Home",
  BLIND_BOYS: "Blind Boys Home",
  OLD_AGE: "Old Age Home",
}

export const formatCurrency = (amount: number) => {
  return `Rs. ${amount.toLocaleString("en-IN")}`
}
