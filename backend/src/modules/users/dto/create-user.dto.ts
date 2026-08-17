import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../../../common/enums';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  userName!: string;

  @IsEmail()
  @MaxLength(255)
  userEmail!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
