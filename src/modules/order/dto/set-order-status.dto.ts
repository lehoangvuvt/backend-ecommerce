import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

class SetOrderStatusDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    orderId: number;

    @IsNotEmpty()
    note: string;

    @IsNotEmpty()
    @IsNumber()
    status: number;
}

export default SetOrderStatusDTO;