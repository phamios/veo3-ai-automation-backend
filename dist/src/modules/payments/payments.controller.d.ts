import { PaymentsService } from './payments.service';
declare class GenerateQRDto {
    amount: number;
    transferContent: string;
}
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    getMethods(): {
        id: string;
        name: string;
        label: string;
        enabled: boolean;
        description: string;
    }[];
    getBankInfo(): {
        bankId: string;
        bankName: string;
        accountNumber: string | undefined;
        accountName: string | undefined;
    };
    generateQR(dto: GenerateQRDto): Promise<{
        qrCode: any;
        bankInfo: {
            bankName: string;
            accountNumber: string | undefined;
            accountName: string | undefined;
        };
        amount: number;
        transferContent: string;
        vietQRUrl: string;
    }>;
}
export {};
