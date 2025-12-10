"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLicenseKey = generateLicenseKey;
exports.isValidLicenseKeyFormat = isValidLicenseKeyFormat;
function generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];
    for (let i = 0; i < 4; i++) {
        let segment = '';
        for (let j = 0; j < 4; j++) {
            segment += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        segments.push(segment);
    }
    return segments.join('-');
}
function isValidLicenseKeyFormat(key) {
    const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return pattern.test(key);
}
//# sourceMappingURL=generate-license-key.js.map