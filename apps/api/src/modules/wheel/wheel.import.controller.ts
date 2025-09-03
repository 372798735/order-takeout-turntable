import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WheelService } from './wheel.service';

@UseGuards(AuthGuard('jwt'))
@Controller('wheel-sets')
export class WheelImportController {
  constructor(private readonly wheel: WheelService) {}

  @Post('import')
  import(@Req() req: any, @Body() payload: any) {
    return this.wheel.importFromLocal(req.user.userId, payload);
  }
}
