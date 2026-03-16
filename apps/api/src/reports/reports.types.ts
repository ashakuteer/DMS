export interface DateFilter {
  startDate?: string;
  endDate?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface DonorReportParams extends PaginationParams {
  sortBy?: 'lifetime' | 'fy' | 'lastDonation';
  sortOrder?: 'asc' | 'desc';
}

export interface ReceiptAuditParams extends PaginationParams {
  paymentMode?: string;
}

export type DonorHealth = 'HEALTHY' | 'AT_RISK' | 'DORMANT';
