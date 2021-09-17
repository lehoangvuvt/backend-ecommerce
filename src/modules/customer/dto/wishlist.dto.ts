import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator'
export class WishList {
    @ApiProperty()
    @IsNotEmpty()
    PRODUCT_SID: string;
}