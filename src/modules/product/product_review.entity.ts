import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Customer from "../customer/customer.entity";
import ProductInformation from "./product_information.entity";


@Entity()
class ProductReview extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID: number;

    @Column('uuid', { nullable: false })
    SID_PRODUCT_INFORMATION: string;

    @Column('uuid', { nullable: false })
    CREATED_BY: string;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @Column('datetime', { nullable: true })
    MODIFIED_DATETIME: Date;

    @Column('varchar', { length: 150, nullable: false })
    CONTENT: string;

    @Column('int', { width: 1, nullable: false })
    RATING: number;

    @ManyToOne(() => ProductInformation, productInformation => productInformation.productReviews)
    @JoinColumn({ name: 'SID_PRODUCT_INFORMATION' })
    productInformation: ProductInformation;

    @ManyToOne(() => Customer, customer => customer.productReviews)
    @JoinColumn({ name: 'CREATED_BY' })
    createdBy: Customer;

    @BeforeInsert()
    getCreatedDatetime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDatetime() {
        this.MODIFIED_DATETIME = new Date();
    }
}

export default ProductReview;