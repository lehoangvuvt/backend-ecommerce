import { BaseEntity, BeforeInsert, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { v4 as uuid } from 'uuid';
import Customer from "./customer.entity";

@Entity()
class RecoveryPassword extends BaseEntity {
    @PrimaryColumn("uuid")
    RECOVERY_ID: string;

    @Column("uuid")
    CUSTOMER_SID: string;

    @Column('text')
    RECOVERY_TOKEN: string;

    @Column('int', { default: 1, nullable: false, width: 1 }) //1 is  available, 0 is not available
    STATUS: number;

    @ManyToOne(() => Customer, customer => customer.recoveryLinks)
    @JoinColumn({ name: "CUSTOMER_SID" })
    customer: Customer;

    @BeforeInsert()
    getRecoveryId() {
        this.RECOVERY_ID = uuid();
    }
}

export default RecoveryPassword;