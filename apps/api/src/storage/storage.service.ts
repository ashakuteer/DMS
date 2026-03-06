import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private bucketName = 'photos';

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
  }

  async uploadDonorPhoto(
    donorId: string,
    buffer: Buffer,
    mimetype: string,
    originalname: string,
  ) {
    const fileExt = originalname.split('.').pop();
    const fileName = `donors/${donorId}.${fileExt}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, buffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload photo: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl };
  }

  async deleteDonorPhoto(url: string) {
    try {
      const fileName = url.split('/').slice(-2).join('/');
      await this.supabase.storage.from(this.bucketName).remove([fileName]);
    } catch (error) {
      console.error('Error deleting donor photo:', error);
    }
  }

  async uploadBeneficiaryPhoto(
    beneficiaryId: string,
    buffer: Buffer,
    mimetype: string,
    originalname: string,
  ) {
    const fileExt = originalname.split('.').pop();
    const fileName = `beneficiaries/${beneficiaryId}.${fileExt}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, buffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload photo: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl };
  }

  async deleteBeneficiaryPhoto(url: string) {
    try {
      const fileName = url.split('/').slice(-2).join('/');
      await this.supabase.storage.from(this.bucketName).remove([fileName]);
    } catch (error) {
      console.error('Error deleting beneficiary photo:', error);
    }
  }
}
