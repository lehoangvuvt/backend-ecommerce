import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import MailTemplate from "./mail_template.entity";

@Entity()
export default class MailSetting extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID: number;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @Column('datetime', { nullable: true })
    MODIFIED_DATETIME: Date;

    @Column('varchar', { length: 20, nullable: false, unique: true })
    MAIL_FOR: string;

    @Column('varchar', { length: 100, nullable: false })
    DESCRIPTION: string;

    @OneToMany(() => MailTemplate, mailTemplate => mailTemplate.mailSetting, { eager: true })
    mailTemplates: MailTemplate[];

    @BeforeInsert()
    getCreatedDateTime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDateTime() {
        this.MODIFIED_DATETIME = new Date();
    }
}