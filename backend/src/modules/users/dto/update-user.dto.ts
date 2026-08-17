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

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  userName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  userEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
