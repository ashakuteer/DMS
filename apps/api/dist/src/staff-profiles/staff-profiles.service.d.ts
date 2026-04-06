import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { StaffStatus } from '@prisma/client';
export declare class StaffProfilesService {
    private prisma;
    private storage;
    constructor(prisma: PrismaService, storage: StorageService);
    findAll(params: {
        homeId?: string;
        designation?: string;
        status?: string;
    }): Promise<any>;
    findOne(id: string): Promise<any>;
    create(data: {
        name: string;
        phone?: string;
        email?: string;
        designation: string;
        homeId?: string;
        status?: StaffStatus;
        profilePhotoUrl?: string;
        bloodGroup?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        pincode?: string;
        emergencyContact1Name?: string;
        emergencyContact1Phone?: string;
        emergencyContact2Name?: string;
        emergencyContact2Phone?: string;
    }): Promise<any>;
    update(id: string, data: Partial<{
        name: string;
        phone: string;
        email: string;
        designation: string;
        homeId: string;
        status: StaffStatus;
        profilePhotoUrl: string;
        bloodGroup: string;
        addressLine1: string;
        addressLine2: string;
        city: string;
        state: string;
        pincode: string;
        emergencyContact1Name: string;
        emergencyContact1Phone: string;
        emergencyContact2Name: string;
        emergencyContact2Phone: string;
    }>): Promise<any>;
    remove(id: string): Promise<any>;
    uploadPhoto(staffId: string, file: Express.Multer.File): Promise<any>;
    uploadDocument(staffId: string, file: Express.Multer.File, docType: string): Promise<any>;
    getDocuments(staffId: string): Promise<any>;
    deleteDocument(docId: string): Promise<any>;
    getBankDetails(staffId: string): Promise<any>;
    upsertBankDetails(staffId: string, data: {
        bankName?: string;
        accountHolderName?: string;
        accountNumber?: string;
        ifsc?: string;
        branch?: string;
    }): Promise<any>;
    findAllHomes(): Promise<any>;
    createHome(data: {
        name: string;
        address?: string;
    }): Promise<any>;
}
