import { IsString, Length } from 'class-validator';

export class CreateLearnerMessageDto {
  @IsString()
  @Length(1, 64)
  userId!: string;

  @IsString()
  @Length(3, 160)
  subject!: string;

  @IsString()
  @Length(1, 5000)
  body!: string;
}
