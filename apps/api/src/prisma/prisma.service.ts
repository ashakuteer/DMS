import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

function resolveDbUrl(): string {
  const {
    PGHOST,
    PGPORT,
    PGUSER,
    PGPASSWORD,
    PGDATABASE,
    DATABASE_URL,
    SUPABASE_DATABASE_URL,
  } = process.env;

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

  throw new Error(
    'No database connection configured. Set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE.',
  );
}

function appendPoolParams(rawUrl: string): string {
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

function maskDbUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (url.username) {
      url.username = '***';
    }
    if (url.password) {
      url.password = '***';
    }
    return url.toString();
  } catch {
    return rawUrl.replace(/\/\/(.*?)(:.*)?@/, '//***:***@');
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor() {
    const rawUrl = resolveDbUrl();
    const url = appendPoolParams(rawUrl);

    const prismaOptions: Prisma.PrismaClientOptions = {
      datasources: {
        db: { url },
      },
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    };

    super(prismaOptions);

    this.logger.log(`Database target: ${maskDbUrl(url)}`);
  }

  async onModuleInit(): Promise<void> {
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
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown database connection error';

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

  async onModuleDestroy(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    await this.$disconnect();
    this.isConnected = false;
    this.logger.log('Database disconnected');
  }
}
