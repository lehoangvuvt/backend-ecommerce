import { v4 as uuid } from 'uuid';
import Customer from "./customer.entity";
import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
class CustomerAddress extends BaseEntity {
    @PrimaryGeneratedColumn('increment')
    ID: string;

    @Column('uuid')
    SID_CUSTOMER: string;

    @Column('datetime')
    CREATED_DATETIME: Date;

    @Column("datetime", { nullable: true })
    MODIFIED_DATETIME: Date;

    @Column('nvarchar', { length: 100, nullable: true })
    FIRST_NAME: string;

    @Column('nvarchar', { length: 100, nullable: true })
    LAST_NAME: string;

    @Column('nvarchar', { length: 50, nullable: true })
    COMPANY: string;

    @Column('nvarchar', { length: 100, nullable: true })
    STREET_ADDRESS: string;

    @Column('nvarchar', { length: 30, nullable: true })
    COUNTRY: string;

    @Column('nvarchar', { length: 50, nullable: true })
    CITY: string;

    @Column('nvarchar', { length: 50, nullable: true })
    DISTRICT: string;

    @Column('varchar', { nullable: true, length: 11 })
    PHONE: string;

    @Column('varchar', { nullable: true, length: 20 })
    IP_ADDRESS: string;

    @Column('int')
    IS_DEFAULT_ADDRESS: number;

    @ManyToOne(() => Customer, customer => customer.addresses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'SID_CUSTOMER' })
    customer: Customer;

    @BeforeInsert()
    getCreatedDateTime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDateTime() {
        this.MODIFIED_DATETIME = new Date();
    }
}

export default CustomerAddress;