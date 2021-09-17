import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import ProductAttribute from "./product_attribute.entity";
import ProductController from "./product.controller";
import Product from "./product.entity";
import ProductService from "./product.service";
import ProductAttributeValue from "./product_attribute_value.entity";
import ProductCategory from "./product_category.entity";
import ProductImage from "./product_image.entity";
import ProductInformation from "./product_information.entity";
import ProductPrice from "./product_price.entity";
import ProductReview from "./product_review.entity";
import SearchTerm from "./search_term.entity";
import ProductBrand from "./product_brand.entity";
import ProductAttributeGroup from "./product_attribute_group.entity";
import ProductAttributeSet from "./product_attribute_set.entity";
import InventoryHistory from "./inventory_history.entity";
import Category from "../category/category.entity";
import Order from "../order/order.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Product, ProductCategory, ProductImage,
        SearchTerm, ProductAttributeValue, ProductAttribute, ProductPrice,
        ProductReview, ProductInformation, ProductBrand, ProductAttributeGroup,
        ProductAttributeSet, ProductAttributeValue, InventoryHistory, Category, Order]),
    JwtModule.register({})],
    controllers: [ProductController],
    providers: [ProductService],
})

export class ProductModule { }
