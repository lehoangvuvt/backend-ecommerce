import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import ProductAttribute from "./product_attribute.entity";
import Product from "./product.entity";
import ProductAttributeGroup from "./product_attribute_group.entity";

@Entity()
class ProductAttributeValue extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID: number;

    @Column('uuid', { nullable: false })
    SID_PRODUCT: string;

    @Column('int', { nullable: false })
    PRODUCT_ATTRIBUTE_ID: number;

    @Column('int', { nullable: false })
    PRODUCT_ATTRIBUTE_GROUP_ID: number;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @Column('datetime', { nullable: true })
    MODIFIED_DATETIME: Date;

    @Column('varchar', { nullable: true })
    VALUE_VARCHAR: string;

    @Column('int', { nullable: true })
    VALUE_INT: number;

    @Column('numeric', { precision: 11, scale: 2, nullable: true })
    VALUE_DECIMAL: number;

    @Column('datetime', { nullable: true })
    VALUE_DATETIME: Date;

    @ManyToOne(() => Product, product => product.productAttributeValues, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'SID_PRODUCT' })
    product: Product;

    @ManyToOne(() => ProductAttribute, productAttribute => productAttribute.productAttributeValues, { eager: true })
    @JoinColumn({ name: 'PRODUCT_ATTRIBUTE_ID' })
    productAttribute: ProductAttribute;

    @ManyToOne(() => ProductAttributeGroup, productAttributeGroup => productAttributeGroup.productAttributeValues, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'PRODUCT_ATTRIBUTE_GROUP_ID' })
    productAttributeGroup: ProductAttributeGroup;

    @BeforeInsert()
    getCreatedDatetime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDatetime() {
        this.MODIFIED_DATETIME = new Date();
    }
}

export default ProductAttributeValue;