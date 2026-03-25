import { StaffProfilesService } from './staff-profiles.service';
export declare class StaffProfilesController {
    private readonly service;
    constructor(service: StaffProfilesService);
    findAllHomes(): Promise<any>;
    createHome(body: {
        name: string;
        address?: string;
    }): Promise<any>;
    findAll(homeId?: string, designation?: string, status?: string): Promise<any>;
    create(body: any): Promise<any>;
    uploadPhoto(file: Express.Multer.File, staffId: string): Promise<any>;
    uploadDocument(file: Express.Multer.File, staffId: string, type: string): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, body: any): Promise<any>;
    remove(id: string): Promise<any>;
    getDocuments(id: string): Promise<any>;
    deleteDocument(docId: string): Promise<any>;
    getBankDetails(id: string): Promise<any>;
    upsertBankDetails(id: string, body: any): Promise<any>;
}
