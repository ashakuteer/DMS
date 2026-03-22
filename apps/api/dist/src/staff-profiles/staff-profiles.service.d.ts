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
    }): Promise<({
        home: {
            name: string;
            id: string;
            address: string | null;
        };
    } & {
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.StaffStatus;
        homeId: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        designation: string;
        profilePhotoUrl: string | null;
        bloodGroup: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        emergencyContact1Name: string | null;
        emergencyContact1Phone: string | null;
        emergencyContact2Name: string | null;
        emergencyContact2Phone: string | null;
    })[]>;
    findOne(id: string): Promise<{
        home: {
            name: string;
            id: string;
            address: string | null;
        };
        documents: {
            id: string;
            createdAt: Date;
            type: import(".prisma/client").$Enums.StaffDocumentType;
            staffId: string;
            fileUrl: string;
        }[];
        bankDetails: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            staffId: string;
            bankName: string | null;
            accountHolderName: string | null;
            accountNumber: string | null;
            ifsc: string | null;
            branch: string | null;
        };
    } & {
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.StaffStatus;
        homeId: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        designation: string;
        profilePhotoUrl: string | null;
        bloodGroup: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        emergencyContact1Name: string | null;
        emergencyContact1Phone: string | null;
        emergencyContact2Name: string | null;
        emergencyContact2Phone: string | null;
    }>;
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
    }): Promise<{
        home: {
            name: string;
            id: string;
            address: string | null;
        };
    } & {
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.StaffStatus;
        homeId: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        designation: string;
        profilePhotoUrl: string | null;
        bloodGroup: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        emergencyContact1Name: string | null;
        emergencyContact1Phone: string | null;
        emergencyContact2Name: string | null;
        emergencyContact2Phone: string | null;
    }>;
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
    }>): Promise<{
        home: {
            name: string;
            id: string;
            address: string | null;
        };
        bankDetails: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            staffId: string;
            bankName: string | null;
            accountHolderName: string | null;
            accountNumber: string | null;
            ifsc: string | null;
            branch: string | null;
        };
    } & {
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.StaffStatus;
        homeId: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        designation: string;
        profilePhotoUrl: string | null;
        bloodGroup: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        emergencyContact1Name: string | null;
        emergencyContact1Phone: string | null;
        emergencyContact2Name: string | null;
        emergencyContact2Phone: string | null;
    }>;
    remove(id: string): Promise<{
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.StaffStatus;
        homeId: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        designation: string;
        profilePhotoUrl: string | null;
        bloodGroup: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        emergencyContact1Name: string | null;
        emergencyContact1Phone: string | null;
        emergencyContact2Name: string | null;
        emergencyContact2Phone: string | null;
    }>;
    uploadPhoto(staffId: string, file: Express.Multer.File): Promise<{
        id: string;
        profilePhotoUrl: string;
    }>;
    uploadDocument(staffId: string, file: Express.Multer.File, docType: string): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.StaffDocumentType;
        staffId: string;
        fileUrl: string;
    }>;
    getDocuments(staffId: string): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.StaffDocumentType;
        staffId: string;
        fileUrl: string;
    }[]>;
    deleteDocument(docId: string): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.StaffDocumentType;
        staffId: string;
        fileUrl: string;
    }>;
    getBankDetails(staffId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        staffId: string;
        bankName: string | null;
        accountHolderName: string | null;
        accountNumber: string | null;
        ifsc: string | null;
        branch: string | null;
    }>;
    upsertBankDetails(staffId: string, data: {
        bankName?: string;
        accountHolderName?: string;
        accountNumber?: string;
        ifsc?: string;
        branch?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        staffId: string;
        bankName: string | null;
        accountHolderName: string | null;
        accountNumber: string | null;
        ifsc: string | null;
        branch: string | null;
    }>;
    findAllHomes(): Promise<{
        name: string;
        id: string;
        address: string | null;
    }[]>;
    createHome(data: {
        name: string;
        address?: string;
    }): Promise<{
        name: string;
        id: string;
        address: string | null;
    }>;
}
