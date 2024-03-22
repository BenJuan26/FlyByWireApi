import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { Session } from './session.entity';
import { AuthService } from './auth.service';

@Module({
    imports: [TypeOrmModule.forFeature([Session]), HttpModule],
    providers: [AuthService],
    controllers: [AuthController],
})
export class ChartfoxModule {}
