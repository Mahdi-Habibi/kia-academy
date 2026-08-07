import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type {
  AuthUser,
  SupportTicketDetail,
  SupportTicketSummary,
} from '@kia-academy/shared';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateTicketDto, TicketReplyDto } from './dto/ticket.dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<SupportTicketSummary[]> {
    return this.ticketsService.listMine(user.id);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<SupportTicketDetail> {
    return this.ticketsService.getMine(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTicketDto,
  ): Promise<SupportTicketDetail> {
    return this.ticketsService.create(user.id, dto);
  }

  @Post(':id/replies')
  reply(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: TicketReplyDto,
  ): Promise<SupportTicketDetail> {
    return this.ticketsService.reply(user.id, id, dto);
  }
}
