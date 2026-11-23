import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
/** Unversioned so tooling can always hit /api/health. */
@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
