import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import MailSetting from "./mail_setting.entity";

@Entity()
export default class MailTemplate extends BaseEntity {
    @PrimaryGeneratedColumn()
    ID: number;

    @Column('number', { nullable: false, unique: true })
    MAIL_SETTING_ID: number;

    @Column('datetime', { nullable: false })
    CREATED_DATETIME: Date;

    @Column('datetime', { nullable: true })
    MODIFIED_DATETIME: Date;

    @Column('varchar', { length: 30, nullable: false, unique: true })
    TEMPLATE_NAME: string;

    @Column('varchar', { length: 30, nullable: false, unique: true })
    REF_TABLE: string;

    @Column('varchar', { length: 100, nullable: false })
    MAIL_SUBJECT: string;

    @Column('text', { nullable: false })
    MAIL_CONTENTS: string;

    @ManyToOne(() => MailSetting, mailSetting => mailSetting.mailTemplates)
    @JoinColumn({ name: 'MAIL_SETTING_ID' })
    mailSetting: MailSetting;

    @BeforeInsert()
    getCreatedDateTime() {
        this.CREATED_DATETIME = new Date();
    }

    @BeforeUpdate()
    getModifiedDateTime() {
        this.MODIFIED_DATETIME = new Date();
    }
}