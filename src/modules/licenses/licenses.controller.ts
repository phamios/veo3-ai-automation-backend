import { Controller, Get, Param } from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { Public } from '../../common/decorators';

@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  @Public()
  @Get(':key/validate')
  async validate(@Param('key') key: string) {
    return this.licensesService.validateLicense(key);
  }
}
