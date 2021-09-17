
import { BaseEntity, BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import ProductInformation from "../product/product_information.entity";
import Customer from "./customer.entity";
import { ApiProperty } from "@nestjs/swagger";

@Entity()
class ViewHist extends BaseEntity {
    
    @PrimaryGeneratedColumn()
    ID: number;
    
    @Column('uuid', { nullable: true })
    SID_CUST: string;

    @Column('uuid', { nullable: true })
    SID_PRODUCT_INFORMATION: string;

    @Column("datetime", { nullable: false })
    CREATED_DATETIME: Date;

    
    // @ManyToOne(() => Customer, customer => customer.SID, { eager: true })
    // @JoinColumn({ name: "SID_CUST" })
    // customer: Customer;


    @ManyToOne(() => ProductInformation, productInformation => productInformation.SID)
    @JoinColumn({ name: 'SID_PRODUCT_INFORMATION' })
    productInformation: ProductInformation;


}
export default ViewHist;