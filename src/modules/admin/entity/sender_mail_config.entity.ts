import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export default class SenderMailConfig extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID: number;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @Column('datetime', { nullable: true })
    MODIFIED_DATETIME: Date;

    @Column('varchar', { length: 30, nullable: false, unique: true })
    EMAIL_ADDRESS: string;

    @Column('text', { nullable: false })
    HASH_PASSWORD_1: string;

    @Column('text', { nullable: false })
    HASH_PASSWORD_2: string;

    @Column('varchar', { length: 20, nullable: false })
    SERVICE_NAME: string;

    @BeforeInsert()
    getCreatedDateTime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDateTime() {
        this.MODIFIED_DATETIME = new Date();
    }
}