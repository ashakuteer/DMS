import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function resolveDbUrl(): string {
  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE, DATABASE_URL } = process.env;

  if (PGHOST && PGUSER && PGPASSWORD && PGDATABASE) {
    const port = PGPORT || '5432';
    const url = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${port}/${PGDATABASE}`;
    return url;
  }

  if (DATABASE_URL) {
    return DATABASE_URL;
  }

  throw new Error('No database connection configured. Set PGHOST/PGUSER/PGPASSWORD/PGDATABASE or DATABASE_URL.');
}

function appendPoolParams(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  const params: string[] = [];

  if (!url.includes('connection_limit')) {
    params.push('connection_limit=5');
  }
  if (url.includes('6543') && !url.includes('pgbouncer')) {
    params.push('pgbouncer=true');
  }

  if (params.length === 0) return url;
  return `${url}${separator}${params.join('&')}`;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const rawUrl = resolveDbUrl();
    const url = appendPoolParams(rawUrl);
    super({ datasources: { db: { url } } });
    const safeUrl = url.replace(/\/\/.*@/, '//***@');
    this.logger.log(`Database target: ${safeUrl}`);
  }

  async onModuleInit() {
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Database connected successfully');
        return;
      } catch (err) {
        this.logger.warn(`DB connect attempt ${attempt}/${maxRetries} failed: ${(err as Error).message}`);
        if (attempt === maxRetries) throw err;
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
