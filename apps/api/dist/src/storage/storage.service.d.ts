export declare class StorageService {
    private supabase;
    private donorBucketName;
    private beneficiaryBucketName;
    private timeMachineBucketName;
    constructor();
    private requireSupabase;
    uploadPhoto(id: string, buffer: Buffer, mimetype: string, originalname: string): Promise<{
        path: string;
        url: string;
    }>;
    deletePhoto(filePath: string): Promise<void>;
    uploadDocument(id: string, buffer: Buffer, mimetype: string, originalname: string): Promise<{
        path: string;
        url: string;
    }>;
    uploadDonorPhoto(donorId: string, buffer: Buffer, mimetype: string, originalname: string): Promise<{
        url: string;
    }>;
    deleteDonorPhoto(url: string): Promise<void>;
    uploadBeneficiaryPhoto(beneficiaryId: string, buffer: Buffer, mimetype: string, originalname: string): Promise<{
        url: string;
    }>;
    deleteBeneficiaryPhoto(url: string): Promise<void>;
    uploadTimeMachinePhoto(entryId: string, buffer: Buffer, mimetype: string, originalname: string): Promise<{
        url: string;
    }>;
    uploadStaffPhoto(staffId: string, buffer: Buffer, mimetype: string, originalname: string): Promise<{
        url: string;
    }>;
    uploadStaffDocument(staffId: string, buffer: Buffer, mimetype: string, originalname: string, docType: string): Promise<{
        url: string;
    }>;
    deleteTimeMachinePhoto(url: string): Promise<void>;
}
