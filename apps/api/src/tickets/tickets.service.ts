import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateTicketDto,
  SupportTicketDetail,
  SupportTicketSummary,
  TicketReplyDto,
} from '@kia-academy/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(userId: string): Promise<SupportTicketSummary[]> {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId },
      include: {
        course: { select: { id: true, slug: true, title: true } },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map((ticket) => this.toSummary(ticket));
  }

  async getMine(userId: string, id: string): Promise<SupportTicketDetail> {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, slug: true, title: true } },
        _count: { select: { replies: true } },
        replies: {
          include: { author: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket || ticket.userId !== userId) {
      throw new NotFoundException('Ticket not found');
    }

    return {
      ...this.toSummary(ticket),
      body: ticket.body,
      replies: ticket.replies.map((reply) => ({
        id: reply.id,
        body: reply.body,
        isStaff: reply.isStaff,
        authorName: reply.author.name || 'Kia',
        createdAt: reply.createdAt.toISOString(),
      })),
    };
  }

  async create(userId: string, dto: CreateTicketDto): Promise<SupportTicketDetail> {
    let courseId = dto.courseId ?? null;
    if (!courseId && dto.courseSlug) {
      const course = await this.prisma.course.findUnique({
        where: { slug: dto.courseSlug },
        select: { id: true },
      });
      if (!course) {
        throw new NotFoundException(`Course ${dto.courseSlug} not found`);
      }
      courseId = course.id;
    }

    if (courseId) {
      const enrolled = await this.prisma.enrollment.findFirst({
        where: { userId, courseId },
      });
      if (!enrolled) {
        throw new ForbiddenException('You must be enrolled to open a course ticket');
      }
    }

    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        courseId,
        subject: dto.subject.trim(),
        body: dto.body.trim(),
        priority: dto.priority ?? 'NORMAL',
      },
    });

    return this.getMine(userId, ticket.id);
  }

  async reply(userId: string, id: string, dto: TicketReplyDto): Promise<SupportTicketDetail> {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket || ticket.userId !== userId) {
      throw new NotFoundException('Ticket not found');
    }
    if (ticket.status === 'CLOSED') {
      throw new ForbiddenException('Ticket is closed');
    }

    await this.prisma.ticketReply.create({
      data: {
        ticketId: id,
        authorId: userId,
        body: dto.body.trim(),
        isStaff: false,
      },
    });

    if (ticket.status === 'RESOLVED') {
      await this.prisma.supportTicket.update({
        where: { id },
        data: { status: 'OPEN' },
      });
    }

    return this.getMine(userId, id);
  }

  private toSummary(ticket: {
    id: string;
    subject: string;
    status: SupportTicketSummary['status'];
    priority: SupportTicketSummary['priority'];
    courseId: string | null;
    createdAt: Date;
    updatedAt: Date;
    course?: { id: string; slug: string; title: string } | null;
    _count: { replies: number };
  }): SupportTicketSummary {
    return {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      courseId: ticket.courseId,
      courseSlug: ticket.course?.slug ?? null,
      courseTitle: ticket.course?.title ?? null,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      replyCount: ticket._count.replies,
    };
  }
}
