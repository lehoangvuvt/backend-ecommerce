import { BaseEntity, BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import ProductInformation from "./product_information.entity";

@Entity()
class ProductPrice extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID: number;

    @Column('uuid', { nullable: false })
    SID_PRODUCT_INFORMATION: string;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @Column('numeric', { precision: 11, scale: 2, default: 0 })
    UNIT_PRICE: number;

    @Column('numeric', { precision: 5, scale: 2, default: 0 })
    TAX: number;

    @Column('numeric', { precision: 5, scale: 2, default: 0 })
    DISCOUNT: number;

    @ManyToOne(() => ProductInformation, productInformation => productInformation.productPrices, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'SID_PRODUCT_INFORMATION' })
    productInformation: ProductInformation;

    @BeforeInsert()
    getCreatedDatetime() {
        this.CREATED_DATETIME = new Date();
    }
}

export default ProductPrice;