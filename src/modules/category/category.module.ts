import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import ProductCategory from "../product/product_category.entity";
import CategoryController from "./category.cotroller";
import Category from "./category.entity";
import CategoryService from "./category.service";

@Module({
    imports: [TypeOrmModule.forFeature([
        Category,
        ProductCategory,
    ]),
    JwtModule.register({})],
    controllers: [CategoryController],
    providers: [CategoryService],
})

export class CategoryModule { }