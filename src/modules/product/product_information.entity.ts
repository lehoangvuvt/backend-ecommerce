import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import { v4 as uuid } from 'uuid';
import Product from "./product.entity";
import ProductBrand from "./product_brand.entity";
import ProductCategory from "./product_category.entity";
import ProductPrice from "./product_price.entity";
import ProductReview from "./product_review.entity";
import CustomerWishlist from "../customer/customer_wishlist.entity";
import ProductAttributeGroup from "./product_attribute_group.entity";

@Entity()
class ProductInformation extends BaseEntity {
    @PrimaryColumn('uuid')
    SID: string;

    @Column('varchar', { nullable: false, length: 20, unique: true })
    SKU: string;

    @Column('uuid', { nullable: false })
    SID_BRAND: string;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @Column('datetime', { nullable: true })
    MODIFIED_DATETIME: Date;

    @Index({ fulltext: true })
    @Column('varchar', { length: 100, nullable: false })
    PRODUCT_NAME: string;

    @Index({ fulltext: true })
    @Column('text', { nullable: false })
    LONG_DESCRIPTION: string;

    @Index({ fulltext: true })
    @Column('varchar', { nullable: false, length: 200 })
    SHORT_DESCRIPTION: string;

    @Index({ fulltext: true })
    @Column('text', { nullable: true })
    LONG_DESCRIPTION_TEXT: string;

    @Column('varchar', { nullable: true, length: 200 })
    SHORT_DESCRIPTION_TEXT: string;

    @Column('int', { default: 0 })
    THRESHOLD: number;

    @Column('boolean', { default: false })
    CAN_PREORDER: boolean;

    @Column("enum", { enum: ['Men', 'Women', 'Both'], default: 'Both' })
    PRODUCT_GENDER: 'Men' | 'Women' | 'Both';

    @OneToMany(() => Product, product => product.productInformation, { eager: true, cascade: true })
    products: Product[];

    @OneToMany(() => ProductCategory, productCategory => productCategory.productInformation, { eager: true, cascade: true })
    categoryConnections: ProductCategory[];

    @ManyToOne(() => ProductBrand, productBrand => productBrand.products, { eager: true })
    @JoinColumn({ name: 'SID_BRAND' })
    productBrand: ProductBrand;

    @OneToMany(() => ProductReview, productReview => productReview.productInformation, { eager: true })
    productReviews: ProductReview[];

    @OneToMany(() => ProductPrice, productPrice => productPrice.productInformation, { eager: true, cascade: true })
    productPrices: ProductPrice[];

    @OneToMany(() => CustomerWishlist, customerWishlist => customerWishlist.productInformation)
    wishLists: CustomerWishlist[];

    @OneToMany(() => ProductAttributeGroup, productAttributeGroup => productAttributeGroup.productInformation, { eager: true, cascade: true })
    productAttributeGroups: ProductAttributeGroup[];

    @BeforeInsert()
    getSid() {
        this.SID = uuid();
    }

    @BeforeInsert()
    getCreatedDatetime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDatetime() {
        this.MODIFIED_DATETIME = new Date();
    }
}

export default ProductInformation;