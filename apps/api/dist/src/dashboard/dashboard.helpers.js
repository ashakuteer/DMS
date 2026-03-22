"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentFY = getCurrentFY;
exports.getMonthRange = getMonthRange;
exports.formatHomeType = formatHomeType;
exports.formatMode = formatMode;
function getCurrentFY() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const fyStart = month >= 3 ? new Date(year, 3, 1) : new Date(year - 1, 3, 1);
    const fyEnd = month >= 3
        ? new Date(year + 1, 2, 31, 23, 59, 59)
        : new Date(year, 2, 31, 23, 59, 59);
    return { fyStart, fyEnd };
}
function getMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
}
function formatHomeType(homeType) {
    const map = {
        ORPHAN_GIRLS: "Girls Home",
        BLIND_BOYS: "Blind Boys Home",
        OLD_AGE: "Old Age Home",
    };
    return map[homeType || ""] || homeType || "N/A";
}
function formatMode(mode) {
    const map = {
        CASH: "Cash",
        UPI: "UPI",
        GPAY: "Google Pay",
        PHONEPE: "PhonePe",
        BANK_TRANSFER: "Bank Transfer",
        CHEQUE: "Cheque",
        ONLINE: "Online",
    };
    return map[mode || ""] || mode || "Other";
}
//# sourceMappingURL=dashboard.helpers.js.map