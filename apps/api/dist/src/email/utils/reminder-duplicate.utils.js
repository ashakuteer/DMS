"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDuplicate = checkDuplicate;
const client_1 = require("@prisma/client");
async function checkDuplicate(prisma, donorId, type, relatedId, offsetDays) {
    const existing = await prisma.emailLog.findFirst({
        where: {
            donorId,
            subType: { contains: type },
            relatedId,
            offsetDays,
            status: client_1.EmailStatus.SENT
        }
    });
    return !!existing;
}
//# sourceMappingURL=reminder-duplicate.utils.js.map