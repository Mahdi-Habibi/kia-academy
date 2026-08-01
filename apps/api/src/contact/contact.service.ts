import { Injectable } from '@nestjs/common';
import type { ContactFormDto, ContactFormResponse } from '@kia-academy/shared';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { SiteSettingsService } from '../site-settings/site-settings.service';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly siteSettings: SiteSettingsService,
  ) {}

  async submit(dto: ContactFormDto): Promise<ContactFormResponse> {
    await this.prisma.contactMessage.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        subject: dto.subject.trim(),
        message: dto.message.trim(),
      },
    });

    const settings = await this.siteSettings.get();
    await this.emailService.sendContactForm(settings.general.supportEmail, dto);

    return {
      ok: true,
      message: 'Message received',
    };
  }
}
