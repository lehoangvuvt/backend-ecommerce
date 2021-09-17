import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export default class CreateStoreDTO {
    @ApiProperty()
    @IsNotEmpty()
    NAME: string;

    @IsNotEmpty()
    STORE_CODE: string;

    @IsOptional()
    @IsNumber()
    LATITUDE: number;

    @IsOptional()
    @IsNumber()
    LONGITUDE: number;

    @IsOptional()
    CITY: string;

    @IsOptional()
    DISTRICT: string;

    @IsOptional()
    ADDRESS: string;

    @IsOptional()
    PHONE: string;
}