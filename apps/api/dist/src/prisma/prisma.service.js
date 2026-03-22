"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
function resolveDbUrl() {
    const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE, DATABASE_URL, SUPABASE_DATABASE_URL, } = process.env;
    if (SUPABASE_DATABASE_URL?.trim()) {
        return SUPABASE_DATABASE_URL.trim();
    }
    if (DATABASE_URL?.trim()) {
        return DATABASE_URL.trim();
    }
    if (PGHOST && PGUSER && PGPASSWORD && PGDATABASE) {
        const port = PGPORT || '5432';
        return `postgresql://${encodeURIComponent(PGUSER)}:${encodeURIComponent(PGPASSWORD)}@${PGHOST}:${port}/${PGDATABASE}`;
    }
    throw new Error('No database connection configured. Set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE.');
}
function appendPoolParams(rawUrl) {
    const url = new URL(rawUrl);
    if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '15');
    }
    const isSupabasePoolerPort = url.port === '6543';
    if (isSupabasePoolerPort && !url.searchParams.has('pgbouncer')) {
        url.searchParams.set('pgbouncer', 'true');
    }
    return url.toString();
}
function maskDbUrl(rawUrl) {
    try {
        const url = new URL(rawUrl);
        if (url.username) {
            url.username = '***';
        }
        if (url.password) {
            url.password = '***';
        }
        return url.toString();
    }
    catch {
        return rawUrl.replace(/\/\/(.*?)(:.*)?@/, '//***:***@');
    }
}
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor() {
        const rawUrl = resolveDbUrl();
        const url = appendPoolParams(rawUrl);
        const prismaOptions = {
            datasources: {
                db: { url },
            },
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']
                : ['error'],
        };
        super(prismaOptions);
        this.logger = new common_1.Logger(PrismaService_1.name);
        this.isConnected = false;
        this.logger.log(`Database target: ${maskDbUrl(url)}`);
    }
    async onModuleInit() {
        if (this.isConnected) {
            return;
        }
        const maxRetries = 5;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.$connect();
                this.isConnected = true;
                this.logger.log('Database connected successfully');
                return;
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown database connection error';
                this.logger.warn(`DB connect attempt ${attempt}/${maxRetries} failed: ${message}`);
                if (attempt === maxRetries) {
                    this.logger.error('Database connection failed after maximum retries');
                    throw error;
                }
                const delayMs = attempt * 2000;
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }
    async onModuleDestroy() {
        if (!this.isConnected) {
            return;
        }
        await this.$disconnect();
        this.isConnected = false;
        this.logger.log('Database disconnected');
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map