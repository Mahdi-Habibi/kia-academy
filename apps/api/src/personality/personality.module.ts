import { Module } from '@nestjs/common';
import { ProfileCompleteGuard } from '../common/guards/profile-complete.guard';
import { PersonalityController } from './personality.controller';
import { PersonalityService } from './personality.service';

@Module({
  controllers: [PersonalityController],
  providers: [PersonalityService, ProfileCompleteGuard],
  exports: [PersonalityService],
})
export class PersonalityModule {}
