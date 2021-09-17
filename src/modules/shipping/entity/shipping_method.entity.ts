import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class ShippingMethod extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID: number;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @Column('datetime', { nullable: true })
    MODIFIED_DATETIME: Date;

    @Column('varchar', { length: 50, nullable: false, unique: true })
    SHIPPING_METHOD_NAME: string;

    @Column('varchar', { length: 100, nullable: false })
    DESCRIPTION: string;

    @Column('numeric', { precision: 11, scale: 2, default: 0 })
    FLAT_PRICE: number;

    @BeforeInsert()
    getCreatedDatetime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDateTime() {
        this.MODIFIED_DATETIME = new Date();
    }
}