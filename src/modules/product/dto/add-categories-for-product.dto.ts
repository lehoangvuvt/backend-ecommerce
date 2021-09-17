import { ApiProperty } from "@nestjs/swagger";

export default class AddCategoriesForProductDTO {
    @ApiProperty()
    CATEGORY_ID_ARRAY: string[];
    SID_PRODUCT: string;
}