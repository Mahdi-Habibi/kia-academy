import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser, PaymentResponse } from '@kia-academy/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CheckoutBodyDto } from './dto/checkout.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutBodyDto): Promise<PaymentResponse> {
    return this.paymentsService.createCheckout(user.id, dto);
  }

  @Post('confirm/:id')
  @UseGuards(JwtAuthGuard)
  confirm(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<PaymentResponse> {
    return this.paymentsService.confirmPayment(user.id, id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMy(@CurrentUser() user: AuthUser): Promise<PaymentResponse[]> {
    return this.paymentsService.getMyPayments(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<PaymentResponse> {
    return this.paymentsService.getPaymentForUser(user.id, id);
  }

  @Post('webhook')
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ): Promise<{ received: true }> {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new Error('Raw body is required for Stripe webhook verification');
    }
    return this.paymentsService.handleStripeWebhook(rawBody, signature);
  }
}
