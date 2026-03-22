"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDaysUntil = calculateDaysUntil;
exports.getDaysInMonth = getDaysInMonth;
exports.calculateNextOccurrence = calculateNextOccurrence;
function calculateDaysUntil(from, to) {
    return Math.floor((to.getTime() - from.getTime()) /
        (1000 * 60 * 60 * 24));
}
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}
function calculateNextOccurrence(month, day) {
    const today = new Date();
    const year = today.getFullYear();
    let date = new Date(year, month - 1, day);
    if (date < today) {
        date = new Date(year + 1, month - 1, day);
    }
    return date;
}
//# sourceMappingURL=reminder-date.utils.js.map