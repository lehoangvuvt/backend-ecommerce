import { IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export default class CreateCategoryDTO {
    @IsNotEmpty()
    @MaxLength(40)
    CATEGORY_NAME: string;

    @IsOptional()
    @MaxLength(30)
    CATEGORY_CODE: string;

    @IsNotEmpty()
    @MaxLength(100)
    SHORT_DESCRIPTION: string;

    @IsNotEmpty()
    LONG_DESCRIPTION: string;
}