import Category from "../category/category.entity";
import { BaseEntity, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import Product from "./product.entity";
import ProductInformation from "./product_information.entity";

@Entity()
export default class ProductCategory extends BaseEntity {
    @PrimaryColumn("uuid")
    SID_PRODUCT: string;

    @PrimaryColumn("uuid")
    SID_CATEGORY: string;

    @ManyToOne(() => ProductInformation, productInformation => productInformation.categoryConnections, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "SID_PRODUCT" })
    productInformation: Product;

    @ManyToOne(() => Category, category => category.productConnections, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: "SID_CATEGORY" })
    category: Category;
}