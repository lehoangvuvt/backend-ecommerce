import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export default class CreateShippingMethodDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    SHIPPING_METHOD_NAME: string;

    @IsNotEmpty()
    @IsString()
    @MaxLength(50)
    DESCRIPTION: string;

    @IsNotEmpty()
    @IsNumber()
    FLAT_PRICE: number;
}