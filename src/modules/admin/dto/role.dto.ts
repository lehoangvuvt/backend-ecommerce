import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class RoleDTO {
  @ApiProperty()
  @IsNotEmpty()
  ROLE_NAME: string;
}
