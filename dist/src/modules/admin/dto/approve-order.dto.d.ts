import { ContactMethod } from '@prisma/client';
export declare class ApproveOrderDto {
    maxDevices?: number;
    deliveryMethod?: ContactMethod;
    deliveryContact?: string;
    adminNotes?: string;
}
