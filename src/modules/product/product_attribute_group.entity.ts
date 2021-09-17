import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import ProductAttribute from "./product_attribute.entity";
import ProductAttributeValue from "./product_attribute_value.entity";
import ProductInformation from "./product_information.entity";

@Entity()
class ProductAttributeGroup extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID: number;

    @Column('uuid')
    PRODUCT_INFORMATION_SID: string;

    @Column('int')
    GROUP_ATTRIBUTE_ID: number;

    @Column('varchar', { nullable: true })
    GROUP_VALUE_VARCHAR: string;

    @Column('int', { nullable: true })
    GROUP_VALUE_INT: number;

    @Column('numeric', { precision: 11, scale: 2, nullable: true })
    GROUP_VALUE_DECIMAL: number;

    @Column('datetime', { nullable: true })
    GROUP_VALUE_DATETIME: Date;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @Column('datetime', { nullable: true })
    MODIFIED_DATETIME: Date;

    @OneToMany(() => ProductAttributeValue, productAttributeValue => productAttributeValue.productAttributeGroup, { eager: true, cascade: true })
    productAttributeValues: ProductAttributeValue[];

    @ManyToOne(() => ProductInformation, productInformation => productInformation.productAttributeGroups, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'PRODUCT_INFORMATION_SID' })
    productInformation: ProductInformation;

    @ManyToOne(() => ProductAttribute, productAttribute => productAttribute.productAttributeGroups, { eager: true })
    @JoinColumn({ name: 'GROUP_ATTRIBUTE_ID' })
    productAttribute: ProductAttribute;

    @BeforeInsert()
    getCreatedDatetime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDatetime() {
        this.MODIFIED_DATETIME = new Date();
    }

}

export default ProductAttributeGroup;