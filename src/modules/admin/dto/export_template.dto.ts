import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class ExportTemplateDTO {
    @ApiProperty()
    categories: Array<Object>;

    @ApiProperty()
    brands: Array<Object>;

    @ApiProperty()
    products: Array<Object>;
}
