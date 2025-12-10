import { ConfigService } from '@nestjs/config';
interface QRGenerateParams {
    amount: number;
    transferContent: string;
}
export declare class PaymentsService {
    private configService;
    constructor(configService: ConfigService);
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
    generateQR(params: QRGenerateParams): Promise<{
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
    private buildVietQRUrl;
}
export {};
