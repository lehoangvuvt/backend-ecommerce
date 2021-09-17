import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export default class RemoveFromCartDTO {
    @ApiProperty()
    @IsNotEmpty()
    SID_PRODUCT: string;
}