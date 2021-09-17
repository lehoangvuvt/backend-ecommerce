import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsNumber } from "class-validator";

export default class DiminishFromCartDTO {
    @ApiProperty()
    @IsNotEmpty()
    SID_PRODUCT: string;

    @IsNumber()
    QTY: number;
}