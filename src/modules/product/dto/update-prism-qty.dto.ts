import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";

export default class UpdatePrismQtyDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsArray()
    products: Array<{
        UPC: string;
        QTY: number;
        TYPE: number;
    }>;
}