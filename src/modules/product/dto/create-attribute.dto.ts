import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

class CreateAttributeDTO {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    ATTRIBUTE_NAME: string;

    @IsNotEmpty()
    @IsString()
    LABEL_TEXT: string;

    @IsNotEmpty()
    @IsString()
    VALUE_TYPE: string;
}

export default CreateAttributeDTO;