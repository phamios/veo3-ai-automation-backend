import { Controller, Get, Param } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { Public } from '../../common/decorators';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Public()
  @Get()
  async findAll() {
    return this.packagesService.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.packagesService.findOne(id);
  }
}
