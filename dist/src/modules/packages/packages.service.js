"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const error_codes_1 = require("../../common/constants/error-codes");
let PackagesService = class PackagesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const packages = await this.prisma.package.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                durationMonths: true,
                originalPrice: true,
                salePrice: true,
                discountPercent: true,
                features: true,
                videosPerMonth: true,
                keywordsTracking: true,
                apiCallsPerMonth: true,
                maxDevices: true,
                isPopular: true,
            },
        });
        return packages;
    }
    async findOne(idOrSlug) {
        const pkg = await this.prisma.package.findFirst({
            where: {
                OR: [{ id: idOrSlug }, { slug: idOrSlug }],
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                durationMonths: true,
                originalPrice: true,
                salePrice: true,
                discountPercent: true,
                features: true,
                videosPerMonth: true,
                keywordsTracking: true,
                apiCallsPerMonth: true,
                maxDevices: true,
                isPopular: true,
            },
        });
        if (!pkg) {
            throw new common_1.NotFoundException({
                code: error_codes_1.ErrorCodes.PACKAGE_NOT_FOUND,
                message: 'Package not found',
            });
        }
        return pkg;
    }
};
exports.PackagesService = PackagesService;
exports.PackagesService = PackagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PackagesService);
//# sourceMappingURL=packages.service.js.map