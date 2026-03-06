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

  // Generic photo upload (used by beneficiaries) - 4 parameters
  async uploadPhoto(
    id: string,
    buffer: Buffer,
    mimetype: string,
    originalname: string,
  ) {
    const fileExt = originalname.split('.').pop();
    const fileName = `beneficiaries/${id}.${fileExt}`;

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

    return { 
      path: fileName,
      url: urlData.publicUrl 
    };
  }

  // Generic photo delete
  async deletePhoto(filePath: string) {
    try {
      await this.supabase.storage.from(this.bucketName).remove([filePath]);
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  }

  // Document upload (for reports, etc.) - 4 parameters
  async uploadDocument(
    id: string,
    buffer: Buffer,
    mimetype: string,
    originalname: string,
  ) {
    const fileExt = originalname.split('.').pop();
    const timestamp = Date.now();
    const fileName = `documents/${id}_${timestamp}.${fileExt}`;

    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(fileName, buffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload document: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    return { 
      path: fileName,
      url: urlData.publicUrl 
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

  // Beneficiary-specific methods
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
