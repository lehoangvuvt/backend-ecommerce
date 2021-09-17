import { BaseEntity, BeforeInsert, Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import {v4 as uuid} from 'uuid';
@Entity()
class CustomerLoyaltyRate extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    ID: string;

    @Column("numeric")
    RATE: number;

    @BeforeInsert()
    getID() {
        this.ID = uuid();
    }
}

export default CustomerLoyaltyRate;