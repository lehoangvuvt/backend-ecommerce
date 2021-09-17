import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber } from "class-validator";

export default class CreateOrderItemDTO {
    @ApiProperty()
    @IsNotEmpty()
    SID_PRODUCT: string;

    @IsNotEmpty()
    @IsNumber()
    QUANTITY: number;
}