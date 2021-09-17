import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { v4 as uuid } from 'uuid';
import Order from "../order/order.entity";

@Entity()
class Store extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    STORE_ID: string;

    @Column("datetime", { nullable: false })
    CREATED_DATETIME: Date;

    @Column("datetime", { nullable: true })
    MODIFIED_DATETIME: Date;

    @Column("varchar", { length: 100, nullable: false, unique: false })
    NAME: string;

    @Column("varchar", { length: 20, nullable: false, unique: true })
    STORE_CODE: string;

    @Column("numeric", { precision: 10, scale: 8, default: 0 })
    LATITUDE: number;

    @Column("numeric", { precision: 11, scale: 8, default: 0 })
    LONGITUDE: number;

    @Column("varchar", { nullable: true })
    CITY: string;

    @Column("varchar", { nullable: true })
    DISTRICT: string;

    @Column("text", { nullable: true })
    ADDRESS: string;

    @Column("varchar", { nullable: true, length: 12 })
    PHONE: string;

    @OneToMany(() => Order, order => order.store)
    orders: Order[];

    @BeforeInsert()
    getStoreId() {
        this.STORE_ID = uuid();
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

export default Store;