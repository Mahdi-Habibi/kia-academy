import { Module } from '@nestjs/common';
import { ProfileCompleteGuard } from '../common/guards/profile-complete.guard';
import { EmailModule } from '../email/email.module';
import { SiteSettingsModule } from '../site-settings/site-settings.module';
import { TestBanksModule } from '../test-banks/test-banks.module';
import { ReadinessController } from './readiness.controller';
import { ReadinessService } from './readiness.service';

@Module({
  imports: [EmailModule, SiteSettingsModule, TestBanksModule],
  controllers: [ReadinessController],
  providers: [ReadinessService, ProfileCompleteGuard],
  exports: [ReadinessService],
})
export class ReadinessModule {}
