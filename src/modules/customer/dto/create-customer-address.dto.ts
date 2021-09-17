import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber } from "class-validator";

export default class CreateCustomerAddressDTO {
    @ApiProperty()
    @IsNotEmpty()
    STREET_ADDRESS: string;

    @IsNotEmpty()
    FIRST_NAME: string;

    @IsNotEmpty()
    LAST_NAME: string;

    @IsNotEmpty()
    COUNTRY: string;

    @IsNotEmpty()
    CITY: string;

    @IsNotEmpty()
    DISTRICT: string;

    @IsNotEmpty()
    PHONE: string;

    @IsBoolean()
    IS_DEFAULT_ADDRESS: boolean;
}