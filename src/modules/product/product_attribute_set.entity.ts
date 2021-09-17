import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import ProductAttribute from "./product_attribute.entity";

@Entity()
class ProductAttributeSet extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID: number;

    @Column('varchar', { length: 50, unique: true, nullable: false })
    SET_NAME: string;

    @Column('int')
    ID_ATTRIBUTE_1: number;

    @Column('int')
    ID_ATTRIBUTE_2: number;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @Column('datetime', { nullable: true })
    MODIFIED_DATETIME: Date;

    @BeforeInsert()
    getCreatedDatetime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDatetime() {
        this.MODIFIED_DATETIME = new Date();
    }

    @ManyToOne(() => ProductAttribute, productAttribute => productAttribute.productAttributeSets1, { eager: true })
    @JoinColumn({ name: 'ID_ATTRIBUTE_1' })
    productAttribute1: ProductAttribute;

    @ManyToOne(() => ProductAttribute, productAttribute => productAttribute.productAttributeSets2, { eager: true })
    @JoinColumn({ name: 'ID_ATTRIBUTE_2' })
    productAttribute2: ProductAttribute;
}

export default ProductAttributeSet;