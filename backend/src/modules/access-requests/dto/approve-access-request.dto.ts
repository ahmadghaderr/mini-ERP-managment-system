import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { UserRole } from '../../../common/enums';

export class ApproveAccessRequestDto {
  @IsString()
  @IsNotEmpty()
  userName!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
