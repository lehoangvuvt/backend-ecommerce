import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsUUID } from "class-validator";

export default class AddToCartDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    SID_PRODUCT: string;

    @IsNumber()
    QTY: number;
}