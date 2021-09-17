import { BaseEntity, Column, PrimaryGeneratedColumn } from "typeorm";

class CustomerSegment extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID: number;

    @Column('varchar', { length: 30, nullable: false, unique: true })
    SEGMENT_NAME: string;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    
}

export default CustomerSegment;