import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @Length(3, 160)
  subject!: string;

  @IsString()
  @Length(10, 5000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  courseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  courseSlug?: string;

  @IsOptional()
  @IsIn(['LOW', 'NORMAL', 'HIGH'])
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
}

export class TicketReplyDto {
  @IsString()
  @Length(1, 5000)
  body!: string;
}
