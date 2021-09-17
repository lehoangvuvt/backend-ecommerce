import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export default class UserRolesDTO {
  @ApiProperty()
  @IsNotEmpty()
  USER_ID: string;

  @IsNotEmpty()
  @IsNumber({}, { each: true })
  ROLE_IDS: [];

  @IsNumber({}, { each: true })
  DELETE_IDS: number[];
}
