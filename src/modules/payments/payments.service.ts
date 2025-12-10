import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';

interface QRGenerateParams {
  amount: number;
  transferContent: string;
}

@Injectable()
export class PaymentsService {
  constructor(private configService: ConfigService) {}

  getMethods() {
    return [
      {
        id: 'VND_BANK_TRANSFER',
        name: 'Bank Transfer (VND)',
        label: 'Chuyển khoản ngân hàng',
        enabled: true,
        description: 'Transfer via Vietnamese bank account',
      },
      {
        id: 'USDT',
        name: 'USDT (Crypto)',
        label: 'Coming Soon',
        enabled: false,
        description: 'Pay with USDT cryptocurrency',
      },
    ];
  }

  getBankInfo() {
    return {
      bankId: this.configService.get<string>('BANK_ID', '970436'),
      bankName: this.configService.get<string>('BANK_NAME', 'Vietcombank'),
      accountNumber: this.configService.get<string>('BANK_ACCOUNT'),
      accountName: this.configService.get<string>('BANK_ACCOUNT_NAME'),
    };
  }

  async generateQR(params: QRGenerateParams) {
    const bankInfo = this.getBankInfo();

    // VietQR format: https://vietqr.net/
    // Format: BANK_ID|ACCOUNT_NUMBER|AMOUNT|CONTENT
    const vietQRUrl = this.buildVietQRUrl({
      bankId: bankInfo.bankId,
      accountNumber: bankInfo.accountNumber || '',
      amount: params.amount,
      content: params.transferContent,
      accountName: bankInfo.accountName || '',
    });

    // Generate QR code as base64
    const qrDataUrl = await QRCode.toDataURL(vietQRUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return {
      qrCode: qrDataUrl,
      bankInfo: {
        bankName: bankInfo.bankName,
        accountNumber: bankInfo.accountNumber,
        accountName: bankInfo.accountName,
      },
      amount: params.amount,
      transferContent: params.transferContent,
      vietQRUrl,
    };
  }

  private buildVietQRUrl(params: {
    bankId: string;
    accountNumber: string;
    amount: number;
    content: string;
    accountName: string;
  }): string {
    // VietQR Quick Link format
    const baseUrl = 'https://img.vietqr.io/image';
    const template = 'compact2';

    // Build URL with query params
    const url = new URL(
      `${baseUrl}/${params.bankId}-${params.accountNumber}-${template}.png`,
    );
    url.searchParams.append('amount', params.amount.toString());
    url.searchParams.append('addInfo', params.content);
    url.searchParams.append('accountName', params.accountName);

    return url.toString();
  }
}
