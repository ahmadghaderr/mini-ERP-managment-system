import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
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

  @IsEnum(UserRole)
  role!: UserRole;
}
