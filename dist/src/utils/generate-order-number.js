"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderNumber = generateOrderNumber;
exports.generateTransferContent = generateTransferContent;
function generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `VEO3-${dateStr}-${randomPart}`;
}
function generateTransferContent() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let content = 'VEO3';
    for (let i = 0; i < 8; i++) {
        content += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return content;
}
//# sourceMappingURL=generate-order-number.js.map