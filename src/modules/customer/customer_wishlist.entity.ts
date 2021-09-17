import { v4 as uuid } from 'uuid'
import { Entity, BaseEntity, PrimaryColumn, Column, BeforeInsert, BeforeUpdate, ManyToOne, JoinColumn } from 'typeorm'
import Customer from './customer.entity'
import ProductInformation from '../product/product_information.entity';

@Entity()
class CustomerWishlist extends BaseEntity {
    @PrimaryColumn("uuid")
    SID: string;

    @Column('uuid')
    SID_CUSTOMER: string;

    @Column('uuid')
    SID_PRODUCT: string;

    @Column('datetime')
    CREATED_DATETIME: Date;

    @Column('datetime', { nullable: true })
    MODIFIED_DATETIME: Date;

    @ManyToOne(() => Customer, customer => customer.wishlists)
    @JoinColumn({ name: 'SID_CUSTOMER' })
    customer: Customer;

    @ManyToOne(() => ProductInformation, productInformation => productInformation.wishLists, { eager: true })
    @JoinColumn({ name: 'SID_PRODUCT' })
    productInformation: ProductInformation;

    @BeforeInsert()
    getSID() {
        this.SID = uuid();
    }

    @BeforeInsert()
    getCreatedDateTime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDateTime() {
        this.MODIFIED_DATETIME = new Date();
    }
}

export default CustomerWishlist;