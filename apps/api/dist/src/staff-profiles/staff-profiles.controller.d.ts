import { StaffProfilesService } from './staff-profiles.service';
export declare class StaffProfilesController {
    private readonly service;
    constructor(service: StaffProfilesService);
    findAllHomes(): Promise<{
        name: string;
        id: string;
        address: string | null;
    }[]>;
    createHome(body: {
        name: string;
        address?: string;
    }): Promise<{
        name: string;
        id: string;
        address: string | null;
    }>;
    findAll(homeId?: string, designation?: string, status?: string): Promise<({
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
    create(body: any): Promise<{
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
    uploadPhoto(file: Express.Multer.File, staffId: string): Promise<{
        id: string;
        profilePhotoUrl: string;
    }>;
    uploadDocument(file: Express.Multer.File, staffId: string, type: string): Promise<{
        id: string;
        createdAt: Date;
        type: import(".prisma/client").$Enums.StaffDocumentType;
        staffId: string;
        fileUrl: string;
    }>;
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
    update(id: string, body: any): Promise<{
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
    getDocuments(id: string): Promise<{
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
    getBankDetails(id: string): Promise<{
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
    upsertBankDetails(id: string, body: any): Promise<{
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
}
