import { Module } from '@nestjs/common';
import { WheelController } from './wheel.controller';
import { WheelService } from './wheel.service';
import { WheelImportController } from './wheel.import.controller';

@Module({
    controllers: [WheelController, WheelImportController],
    providers: [WheelService],
})
export class WheelModule { }


