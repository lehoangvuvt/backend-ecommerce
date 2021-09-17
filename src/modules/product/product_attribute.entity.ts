import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import ProductAttributeGroup from "./product_attribute_group.entity";
import ProductAttributeSet from "./product_attribute_set.entity";
import ProductAttributeValue from "./product_attribute_value.entity";

@Entity()
class ProductAttribute extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID: number;

    @Column('varchar', { length: 50, nullable: false, unique: true })
    ATTRIBUTE_NAME: string;

    @Column('varchar', { length: 50, nullable: false })
    LABEL_TEXT: string;

    @Column('varchar', { length: 20, nullable: false, default: 'VARCHAR' })
    VALUE_TYPE: string;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @Column('datetime', { nullable: true })
    MODIFIED_DATETIME: Date;

    @OneToMany(() => ProductAttributeValue, productAttributeValue => productAttributeValue.productAttribute)
    productAttributeValues: ProductAttributeValue[];

    @OneToMany(() => ProductAttributeGroup, productAttributeGroup => productAttributeGroup.productAttribute)
    productAttributeGroups: ProductAttributeGroup[];

    @OneToMany(() => ProductAttributeSet, productAttributeSet => productAttributeSet.productAttribute1)
    productAttributeSets1: ProductAttributeSet[];

    @OneToMany(() => ProductAttributeSet, productAttributeSet => productAttributeSet.productAttribute2)
    productAttributeSets2: ProductAttributeSet[];

    @BeforeInsert()
    getCreatedDatetime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDatetime() {
        this.MODIFIED_DATETIME = new Date();
    }
}

export default ProductAttribute;