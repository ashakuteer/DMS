import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient | null = null;
  private beneficiaryBucket: string = 'beneficiary-photos';
  private donorBucket: string = 'donor-photos';
  private readonly uploadsBucket: string = 'uploads';
  private initializedBuckets = new Set<string>();
  private clientInitialized = false;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    console.log("ENV CHECK:");
    console.log("SUPABASE_URL exists:", !!supabaseUrl, "length:", supabaseUrl?.length);
    console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!serviceKey, "length:", serviceKey?.length);
    console.log("SUPABASE_BENEFICIARY_BUCKET:", process.env.SUPABASE_BENEFICIARY_BUCKET);
    console.log("SUPABASE_DONOR_BUCKET:", process.env.SUPABASE_DONOR_BUCKET);

    this.beneficiaryBucket = (process.env.SUPABASE_BENEFICIARY_BUCKET || 'beneficiary-photos').trim();
    this.donorBucket = (process.env.SUPABASE_DONOR_BUCKET || 'donor-photos').trim();

    if (!supabaseUrl || !serviceKey) {
      console.error("Supabase credentials missing at runtime");
      return;
    }

    this.supabase = createClient(supabaseUrl, serviceKey);
    this.clientInitialized = true;
    this.logger.log('Supabase client initialized successfully');
  }

  private getClient(): SupabaseClient | null {
    if (!this.clientInitialized) {
      this.initClient();
    }
    return this.supabase;
  }

  isConfigured(): boolean {
    return this.getClient() !== null;
  }

  private async ensureBucketExists(bucketName: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;
    if (this.initializedBuckets.has(bucketName)) return;

    try {
      const { data: buckets, error: listError } = await client.storage.listBuckets();
      if (listError) {
        this.logger.error(`Failed to list buckets: ${listError.message}`);
        return;
      }
      const exists = buckets?.some(b => b.name === bucketName);
      if (!exists) {
        const { error: createError } = await client.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        });
        if (createError) {
          this.logger.error(`Failed to create bucket ${bucketName}: ${createError.message}`);
        } else {
          this.logger.log(`Created storage bucket: ${bucketName}`);
        }
      }
      this.initializedBuckets.add(bucketName);
    } catch (error) {
      this.logger.error(`Failed to ensure bucket ${bucketName} exists`, error);
    }
  }

  private async ensureDocBucketExists(bucketName: string): Promise<void> {
    const client = this.getClient();
    if (!client) return;
    if (this.initializedBuckets.has(bucketName)) return;

    try {
      const { data: buckets } = await client.storage.listBuckets();
      const exists = buckets?.some(b => b.name === bucketName);
      if (!exists) {
        const { error: createError } = await client.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10 * 1024 * 1024,
        });
        if (createError) {
          this.logger.error(`Failed to create doc bucket ${bucketName}: ${createError.message}`);
        } else {
          this.logger.log(`Created doc bucket: ${bucketName}`);
        }
      }
      this.initializedBuckets.add(bucketName);
    } catch (error) {
      this.logger.error(`Failed to ensure doc bucket ${bucketName} exists`, error);
    }
  }

  async uploadPhoto(
    entityId: string,
    fileBuffer: Buffer,
    mimeType: string,
    originalName: string,
    bucket?: string,
  ): Promise<{ path: string; url: string }> {
    const client = this.getClient();
    if (!client) {
      this.logger.error('Upload failed: Supabase client not initialized');
      throw new BadRequestException('Storage not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }

    const bucketName = bucket || this.beneficiaryBucket;
    this.logger.log(`Uploading photo to bucket=${bucketName}, entityId=${entityId}, mime=${mimeType}`);
    await this.ensureBucketExists(bucketName);

    const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
    if (!allowedExts.includes(ext)) {
      throw new BadRequestException('Only JPG, PNG, and WebP images are allowed');
    }

    const timestamp = Date.now();
    const storagePath = `${entityId}/profile-${timestamp}.${ext}`;

    this.logger.log(`Upload path: ${bucketName}/${storagePath}`);

    const { error } = await client.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Supabase upload failed: bucket=${bucketName}, path=${storagePath}, error=${error.message}`);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = client.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    this.logger.log(`Upload success: ${urlData.publicUrl}`);

    return {
      path: storagePath,
      url: urlData.publicUrl,
    };
  }

  async uploadDonorPhoto(
    donorId: string,
    fileBuffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<{ path: string; url: string }> {
    return this.uploadPhoto(donorId, fileBuffer, mimeType, originalName, this.donorBucket);
  }

  async uploadDocument(
    folder: string,
    fileBuffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<{ path: string; url: string }> {
    const client = this.getClient();
    if (!client) {
      this.logger.error('Document upload failed: Supabase client not initialized');
      throw new BadRequestException('Storage not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }

    const bucketName = this.uploadsBucket;
    this.logger.log(`Uploading document to bucket=${bucketName}, folder=${folder}, mime=${mimeType}`);
    await this.ensureDocBucketExists(bucketName);

    const fileName = `${folder}/${Date.now()}-${originalName}`;

    const { error } = await client.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Supabase doc upload failed: bucket=${bucketName}, path=${fileName}, error=${error.message}`);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = client.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    this.logger.log(`Document upload success: ${urlData.publicUrl}`);

    return {
      path: fileName,
      url: urlData.publicUrl,
    };
  }

  async deletePhoto(storagePath: string, bucket?: string): Promise<void> {
    const client = this.getClient();
    if (!client || !storagePath) return;

    const bucketName = bucket || this.beneficiaryBucket;
    try {
      const { error } = await client.storage
        .from(bucketName)
        .remove([storagePath]);

      if (error) {
        this.logger.error(`Delete failed: bucket=${bucketName}, path=${storagePath}, error=${error.message}`);
      }
    } catch (error) {
      this.logger.error('Failed to delete photo', error);
    }
  }

  async deleteDonorPhoto(storagePath: string): Promise<void> {
    return this.deletePhoto(storagePath, this.donorBucket);
  }
}
