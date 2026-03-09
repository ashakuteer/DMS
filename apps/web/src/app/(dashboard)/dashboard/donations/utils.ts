export const formatAmount = (amount: string, currency = "INR") => {
  const num = parseFloat(amount)
  if (isNaN(num)) return "-"

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num)
}

export const getDonorName = (donor: any) => {
  return [donor.firstName, donor.lastName].filter(Boolean).join(" ")
}

export const getDonationTypeBadgeColor = (type: string) => {
  switch (type) {
    case "CASH":
      return "bg-green-100 text-green-800"
    case "GROCERIES":
      return "bg-orange-100 text-orange-800"
    case "MEDICINES":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}
