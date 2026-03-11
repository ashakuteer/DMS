import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;
  private donorBucketName = 'Donors';
  private beneficiaryBucketName = 'beneficiary-photos';

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  }

  // Generic photo upload (used by beneficiaries)
  async uploadPhoto(
    id: string,
    buffer: Buffer,
    mimetype: string,
    originalname: string,
  ) {
    const fileExt = originalname.split('.').pop();
    const filePath = `beneficiaries/${id}.${fileExt}`;

    const { error } = await this.supabase.storage
      .from(this.beneficiaryBucketName)
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload photo: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(this.beneficiaryBucketName)
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: urlData.publicUrl,
    };
  }

  // Generic photo delete
  async deletePhoto(filePath: string) {
    try {
      await this.supabase.storage
        .from(this.beneficiaryBucketName)
        .remove([filePath]);
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  }

  // Document upload
  async uploadDocument(
    id: string,
    buffer: Buffer,
    mimetype: string,
    originalname: string,
  ) {
    const fileExt = originalname.split('.').pop();
    const timestamp = Date.now();
    const filePath = `documents/${id}_${timestamp}.${fileExt}`;

    const { error } = await this.supabase.storage
      .from(this.donorBucketName)
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload document: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(this.donorBucketName)
      .getPublicUrl(filePath);

    return {
      path: filePath,
      url: urlData.publicUrl,
    };
  }

  // Donor-specific methods
  async uploadDonorPhoto(
    donorId: string,
    buffer: Buffer,
    mimetype: string,
    originalname: string,
  ) {
    const fileExt = originalname.split('.').pop();
    const filePath = `donors/${donorId}.${fileExt}`;

    const { error } = await this.supabase.storage
      .from(this.donorBucketName)
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload donor photo: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(this.donorBucketName)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl };
  }

  async deleteDonorPhoto(url: string) {
    try {
      const filePath = url.split('/').slice(-2).join('/');
      await this.supabase.storage
        .from(this.donorBucketName)
        .remove([filePath]);
    } catch (error) {
      console.error('Error deleting donor photo:', error);
    }
  }

  // Beneficiary-specific methods
  async uploadBeneficiaryPhoto(
    beneficiaryId: string,
    buffer: Buffer,
    mimetype: string,
    originalname: string,
  ) {
    const fileExt = originalname.split('.').pop();
    const filePath = `beneficiaries/${beneficiaryId}.${fileExt}`;

    const { error } = await this.supabase.storage
      .from(this.beneficiaryBucketName)
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload beneficiary photo: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(this.beneficiaryBucketName)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl };
  }

  async deleteBeneficiaryPhoto(url: string) {
    try {
      const filePath = url.split('/').slice(-2).join('/');
      await this.supabase.storage
        .from(this.beneficiaryBucketName)
        .remove([filePath]);
    } catch (error) {
      console.error('Error deleting beneficiary photo:', error);
    }
  }
}
