import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import type { RegisterDto as RegisterDtoType } from '@kia-academy/shared';

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export class RegisterDto implements RegisterDtoType {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Matches(PASSWORD_PATTERN, {
    message: 'Password must be at least 8 characters and contain a letter and a number',
  })
  password!: string;
}
