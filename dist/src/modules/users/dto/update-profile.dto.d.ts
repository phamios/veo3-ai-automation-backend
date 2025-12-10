import { ContactMethod } from '@prisma/client';
export declare class UpdateProfileDto {
    name?: string;
    phone?: string;
    telegramContact?: string;
    zaloContact?: string;
    preferredContactMethod?: ContactMethod;
}
