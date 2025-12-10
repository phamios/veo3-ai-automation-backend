import { PaymentMethod, ContactMethod } from '@prisma/client';
export declare class CreateOrderDto {
    packageId: string;
    paymentMethod?: PaymentMethod;
    deliveryMethod?: ContactMethod;
    deliveryContact?: string;
}
