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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
let StorageService = class StorageService {
    constructor() {
        this.supabase = null;
        this.donorBucketName = 'Donors';
        this.beneficiaryBucketName = 'beneficiary-photos';
        this.timeMachineBucketName = 'time-machine';
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
            process.env.SUPABASE_KEY ||
            process.env.SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
            this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
            console.log('[StorageService] Initialized with', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service role key' : 'anon key');
        }
        else {
            console.warn('[StorageService] Supabase not configured — file uploads will be unavailable.');
        }
    }
    requireSupabase() {
        if (!this.supabase) {
            throw new Error('Storage service is not configured. Please set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_ANON_KEY) environment variables.');
        }
        return this.supabase;
    }
    async uploadPhoto(id, buffer, mimetype, originalname) {
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
    async deletePhoto(filePath) {
        try {
            const supabase = this.requireSupabase();
            await supabase.storage
                .from(this.beneficiaryBucketName)
                .remove([filePath]);
        }
        catch (error) {
            console.error('Error deleting photo:', error);
        }
    }
    async uploadDocument(id, buffer, mimetype, originalname) {
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
    async uploadDonorPhoto(donorId, buffer, mimetype, originalname) {
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
    async deleteDonorPhoto(url) {
        try {
            const supabase = this.requireSupabase();
            const filePath = url.split('/').slice(-2).join('/');
            await supabase.storage
                .from(this.donorBucketName)
                .remove([filePath]);
        }
        catch (error) {
            console.error('Error deleting donor photo:', error);
        }
    }
    async uploadBeneficiaryPhoto(beneficiaryId, buffer, mimetype, originalname) {
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
    async deleteBeneficiaryPhoto(url) {
        try {
            const supabase = this.requireSupabase();
            const filePath = url.split('/').slice(-2).join('/');
            await supabase.storage
                .from(this.beneficiaryBucketName)
                .remove([filePath]);
        }
        catch (error) {
            console.error('Error deleting beneficiary photo:', error);
        }
    }
    async uploadTimeMachinePhoto(entryId, buffer, mimetype, originalname) {
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
    async uploadStaffPhoto(staffId, buffer, mimetype, originalname) {
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
    async uploadStaffDocument(staffId, buffer, mimetype, originalname, docType) {
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
    async deleteTimeMachinePhoto(url) {
        try {
            const supabase = this.requireSupabase();
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split(`/object/public/${this.timeMachineBucketName}/`);
            if (pathParts.length < 2)
                return;
            const filePath = pathParts[1];
            await supabase.storage
                .from(this.timeMachineBucketName)
                .remove([filePath]);
        }
        catch (error) {
            console.error('Error deleting time machine photo:', error);
        }
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StorageService);
//# sourceMappingURL=storage.service.js.map