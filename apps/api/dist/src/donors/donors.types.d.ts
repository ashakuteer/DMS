import { Role } from '@prisma/client';
export interface UserContext {
    id: string;
    email: string;
    role: Role;
    name?: string;
}
export interface DonorQueryOptions {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    category?: string;
    city?: string;
    country?: string;
    religion?: string;
    assignedToUserId?: string;
    donationFrequency?: string;
    healthStatus?: string;
    supportPreferences?: string;
    locationCategory?: string;
}
export declare enum HealthStatus {
    GREEN = "GREEN",
    YELLOW = "YELLOW",
    RED = "RED"
}
export interface EngagementResult {
    score: number;
    status: HealthStatus;
    reasons: string[];
}
