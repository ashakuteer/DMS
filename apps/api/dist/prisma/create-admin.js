"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const email = 'admin@ashakuteer.org';
    const plainPassword = 'Admin@123';
    const name = 'System Admin';
    console.log(`Ensuring admin user: ${email}`);
    const hashed = await bcrypt.hash(plainPassword, 12);
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashed,
            name,
            role: client_1.Role.ADMIN,
            isActive: true,
        },
        create: {
            email,
            password: hashed,
            name,
            role: client_1.Role.ADMIN,
            isActive: true,
        },
        select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    console.log('Done:', JSON.stringify(user, null, 2));
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=create-admin.js.map