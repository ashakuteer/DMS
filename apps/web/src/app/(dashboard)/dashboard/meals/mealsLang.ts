export type MealsLang = "en" | "te";

const STORAGE_KEY = "mealsDisplayLang";
const LANG_EVENT = "meals-lang-change";

export function getMealsLang(): MealsLang {
  if (typeof window === "undefined") return "te";
  return (localStorage.getItem(STORAGE_KEY) as MealsLang) ?? "te";
}

export function setMealsLang(lang: MealsLang): void {
  localStorage.setItem(STORAGE_KEY, lang);
  window.dispatchEvent(new Event(LANG_EVENT));
}

export { LANG_EVENT };

// ─── Label maps (indexed by lang) ─────────────────────────────────────────────

export const SLOT_LANG: Record<MealsLang, Record<string, string>> = {
  en: {
    breakfast: "Breakfast",
    lunch: "Lunch",
    eveningSnacks: "Evening Snacks",
    dinner: "Dinner",
  },
  te: {
    breakfast: "అల్పాహారం (Breakfast)",
    lunch: "మధ్యాహ్న భోజనం (Lunch)",
    eveningSnacks: "సాయంత్రం అల్పాహారం (Snacks)",
    dinner: "రాత్రి భోజనం (Dinner)",
  },
};

export const HOME_LANG: Record<MealsLang, Record<string, string>> = {
  en: {
    GIRLS_HOME: "Girls Home",
    BLIND_BOYS_HOME: "Blind Boys Home",
    OLD_AGE_HOME: "Old Age Home",
  },
  te: {
    GIRLS_HOME: "బాలికల గృహం (Girls Home)",
    BLIND_BOYS_HOME: "అంధ బాలుర గృహం (Blind Boys Home)",
    OLD_AGE_HOME: "వృద్ధాశ్రమం (Old Age Home)",
  },
};

export const FOOD_TYPE_LANG: Record<MealsLang, Record<string, string>> = {
  en: { VEG: "🟢 Veg", NON_VEG: "🔴 Non-Veg" },
  te: { VEG: "🟢 వెజ్ (Veg)", NON_VEG: "🔴 నాన్ వెజ్ (Non-Veg)" },
};

export const BOOKING_STATUS_LANG: Record<MealsLang, Record<string, string>> = {
  en: {
    HOLD: "Hold",
    CONFIRMED: "Confirmed",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
  },
  te: {
    HOLD: "హోల్డ్ — చెల్లింపు లేదు (Hold)",
    CONFIRMED: "నిర్ధారించబడింది (Confirmed)",
    CANCELLED: "రద్దు చేయబడింది (Cancelled)",
    COMPLETED: "పూర్తయింది (Completed)",
  },
};

export const PAYMENT_STATUS_LANG: Record<MealsLang, Record<string, string>> = {
  en: {
    FULL: "Full",
    PARTIAL: "Partial",
    ADVANCE: "Advance",
    AFTER_SERVICE: "After Service",
    NOT_YET: "Not Yet Paid",
  },
  te: {
    FULL: "పూర్తి (Full)",
    PARTIAL: "పాక్షిక (Partial)",
    ADVANCE: "అడ్వాన్స్ (Advance)",
    AFTER_SERVICE: "సేవ తర్వాత (After Service)",
    NOT_YET: "చెల్లింపు లేదు (Not Yet Paid)",
  },
};

export const DONOR_VISIT_LANG: Record<MealsLang, { photo: string; visit: string; label: string }> = {
  en: { photo: "📷 Photo / Video only", visit: "✅ Visit", label: "Donor Visit Expected?" },
  te: { photo: "📷 ఫోటో మాత్రమే (Photo only)", visit: "✅ సందర్శన (Visit)", label: "దాత సందర్శన ఆశించబడుతుందా? (Donor Visit Expected?)" },
};

export const TELECALLER_LANG: Record<MealsLang, string> = {
  en: "Telecaller",
  te: "కాల్ బాధ్యుడు (Telecaller)",
};

export const LEGEND_LANG: Record<MealsLang, {
  paid: string; balance: string; hold: string; conflict: string; completed: string; available: string;
}> = {
  en: {
    paid: "Paid",
    balance: "Balance",
    hold: "Hold",
    conflict: "⚠ Conflict",
    completed: "Completed",
    available: "Available",
  },
  te: {
    paid: "పూర్తి చెల్లింపు (Paid)",
    balance: "బ్యాలెన్స్ (Balance)",
    hold: "హోల్డ్ (Hold)",
    conflict: "⚠ వివాదం (Conflict)",
    completed: "పూర్తయింది (Completed)",
    available: "అందుబాటులో (Available)",
  },
};

// Menu item translations (English key → Telugu display label)
export const MENU_LABEL_MAP: Record<string, string> = {
  "Idly": "ఇడ్లీ (Idly)",
  "Vada": "వడ (Vada)",
  "Bonda / Mysore Bajji": "బొండా / మైసూర్ బజ్జి",
  "Semiya Upma": "సేమియా ఉప్మా",
  "Own Preparation": "స్వీయ తయారీ",
  "Boiled Egg": "ఉడికించిన గుడ్డు",
  "Bread": "బ్రెడ్",
  "Fruit": "పండ్లు",
  "Milk": "పాలు",
  "Flavoured Rice (Pulihora / Jeera Rice / Tomato Rice)": "పులిహోర / జీరా రైస్ / టమోటా రైస్",
  "Kichidi": "ఖిచిడి",
  "Poori": "పూరీ",
  "Noodles": "నూడుల్స్",
  "Bagara Rice": "బగారా రైస్",
  "White Rice": "సాధారణ అన్నం",
  "Vegetable Curry": "కూర",
  "Vegetable Biryani": "వెజ్ బిర్యానీ",
  "Dal": "పప్పు",
  "Sambar": "సాంబార్",
  "Sweet": "స్వీట్",
  "Curd": "పెరుగు",
  "Papad": "అప్పడం",
  "Aloo Kurma": "ఆలూ కుర్మా",
  "Raitha / Curd Chutney": "రైతా / పెరుగు చట్నీ",
  "Masala Brinjal": "గుత్తి వంకాయ",
  "Chutney": "చట్నీ",
  "Panner Curry": "పనీర్ కర్రీ",
  "Chicken Biryani": "చికెన్ బిర్యానీ",
  "Mutton Curry": "మటన్ కర్రీ",
  "Fish Curry": "చేప కూర",
  "Fish Fry": "చేప వేపుడు",
  "Chicken Fry": "చికెన్ ఫ్రై",
  "Panner Curry & Boiled Egg": "పనీర్ + గుడ్డు",
  "Samosa": "సమోసా",
  "Biscuits": "బిస్కెట్లు",
  "Chips": "చిప్స్",
  "Puff": "పఫ్",
  "Ice Cream": "ఐస్ క్రీమ్",
  "Fruit Juice": "ఫ్రూట్ జ్యూస్",
  "Burger": "బర్గర్",
  "Pakodi / Pakora": "పకోడీ",
  "Pizza": "పిజ్జా",
  "Mirchi Bujji": "మిర్చి బజ్జి",
  "Chicken Curry": "చికెన్ కర్రీ",
  "Ice Cream (Multiple Flavors)": "ఐస్ క్రీమ్",
};

export function getMenuLabel(item: string, lang: MealsLang): string {
  if (lang === "en") return item;
  return MENU_LABEL_MAP[item] ?? item;
}
