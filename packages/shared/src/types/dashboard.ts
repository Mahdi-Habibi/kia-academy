export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH';

export interface CreateTicketDto {
  subject: string;
  body: string;
  courseId?: string;
  courseSlug?: string;
  priority?: TicketPriority;
}

export interface TicketReplyDto {
  body: string;
}

export interface SupportTicketSummary {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  courseId: string | null;
  courseSlug: string | null;
  courseTitle: string | null;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
}

export interface SupportTicketDetail extends SupportTicketSummary {
  body: string;
  replies: Array<{
    id: string;
    body: string;
    isStaff: boolean;
    authorName: string;
    createdAt: string;
  }>;
}

export interface LearnerMessageDto {
  id: string;
  subject: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export interface CreateLearnerMessageDto {
  userId: string;
  subject: string;
  body: string;
}

export interface LearnerTodoDto {
  id: string;
  title: string;
  done: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoDto {
  title: string;
}

export interface UpdateTodoDto {
  title?: string;
  done?: boolean;
  sortOrder?: number;
}

export interface CompetitionSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  registered: boolean;
}

export interface CourseAttachmentDto {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes: number | null;
  sortOrder: number;
  createdAt: string;
}

export interface LearnerProgressPoint {
  label: string;
  value: number;
  kind: 'course' | 'exam' | 'bootcamp';
}

export interface LearnerProgressSummary {
  courses: Array<{
    slug: string;
    title: string;
    progressPct: number;
  }>;
  examAverage: number | null;
  bootcampPoints: number;
  points: LearnerProgressPoint[];
}

export interface ProfileDetails {
  firstName: string;
  lastName: string;
  city: string;
  email: string | null;
  phone: string | null;
  name: string;
}
