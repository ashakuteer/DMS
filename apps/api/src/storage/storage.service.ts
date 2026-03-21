import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient | null = null;
  private donorBucketName = 'Donors';
  private beneficiaryBucketName = 'beneficiary-photos';
  private timeMachineBucketName = 'time-machine';

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('[StorageService] Initialized with', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service role key' : 'anon key');
    } else {
      console.warn('[StorageService] Supabase not configured — file uploads will be unavailable.');
    }
  }

  private requireSupabase(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Storage service is not configured. Please set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_ANON_KEY) environment variables.');
    }
    return this.supabase;
  }

  // Generic photo upload (used by beneficiaries)
  async uploadPhoto(
    id: string,
    buffer: Buffer,
    mimetype: string,
    originalname: string,
  ) {
    const supabase = this.requireSupabase();
    const fileExt = originalname.split('.').pop();
    const filePath = `beneficiaries/${id}.${fileExt}`;

    const { error } = await supabase.storage
      .from(this.beneficiaryBucketName)
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload photo: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
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
      const supabase = this.requireSupabase();
      await supabase.storage
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
    const supabase = this.requireSupabase();
    const fileExt = originalname.split('.').pop();
    const timestamp = Date.now();
    const filePath = `documents/${id}_${timestamp}.${fileExt}`;

    const { error } = await supabase.storage
      .from(this.donorBucketName)
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload document: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
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
    const supabase = this.requireSupabase();
    const fileExt = originalname.split('.').pop();
    const filePath = `donors/${donorId}.${fileExt}`;

    const { error } = await supabase.storage
      .from(this.donorBucketName)
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload donor photo: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(this.donorBucketName)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl };
  }

  async deleteDonorPhoto(url: string) {
    try {
      const supabase = this.requireSupabase();
      const filePath = url.split('/').slice(-2).join('/');
      await supabase.storage
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
    const supabase = this.requireSupabase();
    const fileExt = originalname.split('.').pop();
    const filePath = `beneficiaries/${beneficiaryId}.${fileExt}`;

    const { error } = await supabase.storage
      .from(this.beneficiaryBucketName)
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload beneficiary photo: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(this.beneficiaryBucketName)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl };
  }

  async deleteBeneficiaryPhoto(url: string) {
    try {
      const supabase = this.requireSupabase();
      const filePath = url.split('/').slice(-2).join('/');
      await supabase.storage
        .from(this.beneficiaryBucketName)
        .remove([filePath]);
    } catch (error) {
      console.error('Error deleting beneficiary photo:', error);
    }
  }

  // Time Machine-specific methods
  async uploadTimeMachinePhoto(
    entryId: string,
    buffer: Buffer,
    mimetype: string,
    originalname: string,
  ) {
    const supabase = this.requireSupabase();
    const fileExt = originalname.split('.').pop();
    const timestamp = Date.now();
    const filePath = `entries/${entryId}/${timestamp}.${fileExt}`;

    const { error } = await supabase.storage
      .from(this.timeMachineBucketName)
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload time machine photo: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(this.timeMachineBucketName)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl };
  }

  // Staff photo upload
  async uploadStaffPhoto(
    staffId: string,
    buffer: Buffer,
    mimetype: string,
    originalname: string,
  ) {
    const supabase = this.requireSupabase();
    const fileExt = originalname.split('.').pop();
    const filePath = `staff/${staffId}/photo.${fileExt}`;

    const { error } = await supabase.storage
      .from(this.donorBucketName)
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload staff photo: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(this.donorBucketName)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl };
  }

  // Staff document upload
  async uploadStaffDocument(
    staffId: string,
    buffer: Buffer,
    mimetype: string,
    originalname: string,
    docType: string,
  ) {
    const supabase = this.requireSupabase();
    const fileExt = originalname.split('.').pop();
    const timestamp = Date.now();
    const filePath = `staff/${staffId}/${docType}_${timestamp}.${fileExt}`;

    const { error } = await supabase.storage
      .from(this.donorBucketName)
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload staff document: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from(this.donorBucketName)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl };
  }

  async deleteTimeMachinePhoto(url: string) {
    try {
      const supabase = this.requireSupabase();
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split(`/object/public/${this.timeMachineBucketName}/`);
      if (pathParts.length < 2) return;
      const filePath = pathParts[1];
      await supabase.storage
        .from(this.timeMachineBucketName)
        .remove([filePath]);
    } catch (error) {
      console.error('Error deleting time machine photo:', error);
    }
  }
}
