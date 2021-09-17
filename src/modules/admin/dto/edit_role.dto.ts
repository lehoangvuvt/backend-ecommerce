import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class EditRoleDTO {
  @ApiProperty()
  @IsNotEmpty()
  ROLE_ID: number;

  @IsNotEmpty()
  RESOUCRE_ID: number;

  @IsNotEmpty()
  RIGHT: string;
}
