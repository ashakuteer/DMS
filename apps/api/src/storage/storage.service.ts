import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient | null = null;
  private readonly bucketName = 'beneficiary-photos';

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase storage client initialized');
    } else {
      this.logger.warn('Supabase credentials not configured - photo upload disabled');
    }
  }

  isConfigured(): boolean {
    return this.supabase !== null;
  }

  async ensureBucketExists(): Promise<void> {
    if (!this.supabase) return;

    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const exists = buckets?.some(b => b.name === this.bucketName);
      if (!exists) {
        await this.supabase.storage.createBucket(this.bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        });
        this.logger.log(`Created storage bucket: ${this.bucketName}`);
      }
    } catch (error) {
      this.logger.error('Failed to ensure bucket exists', error);
    }
  }

  async uploadPhoto(
    beneficiaryId: string,
    fileBuffer: Buffer,
    mimeType: string,
    originalName: string,
  ): Promise<{ path: string; url: string }> {
    if (!this.supabase) {
      throw new BadRequestException('Storage not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }

    await this.ensureBucketExists();

    const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
    if (!allowedExts.includes(ext)) {
      throw new BadRequestException('Only JPG, PNG, and WebP images are allowed');
    }

    const timestamp = Date.now();
    const storagePath = `${beneficiaryId}/profile-${timestamp}.${ext}`;

    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Upload failed: ${error.message}`, error);
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(storagePath);

    return {
      path: storagePath,
      url: urlData.publicUrl,
    };
  }

  async deletePhoto(storagePath: string): Promise<void> {
    if (!this.supabase || !storagePath) return;

    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([storagePath]);

      if (error) {
        this.logger.error(`Delete failed: ${error.message}`, error);
      }
    } catch (error) {
      this.logger.error('Failed to delete photo', error);
    }
  }
}
