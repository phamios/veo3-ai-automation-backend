import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ErrorCodes } from '../../common/constants/error-codes';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

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

  async findOne(idOrSlug: string) {
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
      throw new NotFoundException({
        code: ErrorCodes.PACKAGE_NOT_FOUND,
        message: 'Package not found',
      });
    }

    return pkg;
  }
}
