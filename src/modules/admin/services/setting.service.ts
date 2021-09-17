import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import Customer from "../../../modules/customer/customer.entity";
import {
    getConnection,
    Repository
} from "typeorm";
import MailSetting from "../entity/mail_setting.entity";
import MailTemplate from "../entity/mail_template.entity";
import UpdateMailTemplateDetailsDTO from "../dto/update_mail_template.dto";
import CreateSenderMailDTO from "../dto/create_sender_mail.dto";
import SenderMailConfig from "../entity/sender_mail_config.entity";
import {
    hashSync,
    compareSync
} from 'bcrypt';
import {
    decrypt,
    encrypt
} from '../../../utils/crypto.utils';

@Injectable()
export default class SettingService {
    constructor(
        @InjectRepository(MailSetting) private mailSettingRepository: Repository<MailSetting>,
        @InjectRepository(MailTemplate) private mailTemplateRepository: Repository<MailTemplate>,
        @InjectRepository(SenderMailConfig) private senderMailConfigRepository: Repository<SenderMailConfig>,
        @InjectRepository(Customer) private customerRepository: Repository<Customer>,
    ) { }

    async getAllMailSettings() {
        const mailSettings = await this.mailSettingRepository.find();
        return { mailSettings };
    }

    async getMailSettingsDetails(ID: number) {
        const mailSetting = await this.mailSettingRepository.findOne({ where: { ID } });
        return { mailSetting };
    }

    async getTemplateDetails(ID: number) {
        const connection = getConnection();
        const templateDetails = await this.mailTemplateRepository.findOne({ where: { ID } });
        const columnsMetaData = connection.getMetadata(templateDetails.REF_TABLE).columns;
        let columns: Array<string> = [];
        if (templateDetails.MAIL_SETTING_ID === 1) {
            columns.push('ACTIVE_LINK');
        }
        const getColumns = columnsMetaData.map(column => {
            columns.push(column.propertyName);
            return columns;
        })
        await Promise.all(getColumns);
        return {
            templateDetails,
            columns
        };
    }

    async updateMailTemplateDetails(ID: number, updateMailTemplateDetailsDTO: UpdateMailTemplateDetailsDTO) {
        const { MAIL_CONTENTS, MAIL_SUBJECT } = updateMailTemplateDetailsDTO;
        try {
            const mailTemplateToUpdate = await this.mailTemplateRepository.findOne({ where: { ID } });
            mailTemplateToUpdate.MAIL_CONTENTS = MAIL_CONTENTS;
            mailTemplateToUpdate.MAIL_SUBJECT = MAIL_SUBJECT;
            await mailTemplateToUpdate.save();
            return { mailTemplate: mailTemplateToUpdate };
        } catch (error) {
            console.log(error);
            return { error };
        }
    }

    async createNewSenderMail(createSenderMailDTO: CreateSenderMailDTO) {
        try {
            const { EMAIL_ADDRESS, PASSWORD, SERVICE_NAME } = createSenderMailDTO;
            const encrypted = encrypt(PASSWORD);
            const HASH_PASSWORD_1 = encrypted.iv;
            const HASH_PASSWORD_2 = encrypted.content;
            const existedEmail = await this.senderMailConfigRepository.findOne({ where: { EMAIL_ADDRESS } });
            if (!existedEmail) {
                const newSenderMail = this.senderMailConfigRepository.create({
                    EMAIL_ADDRESS,
                    HASH_PASSWORD_1,
                    HASH_PASSWORD_2,
                    SERVICE_NAME
                });
                await newSenderMail.save();
                delete newSenderMail.HASH_PASSWORD_1;
                delete newSenderMail.HASH_PASSWORD_2;
                return { newSenderMail: newSenderMail };
            } else {
                return { error: 'This email address is already existed' };
            }
        } catch (error) {
            return { error };
        }
    }

    async updateSenderMail(updateSenderMailDTO: CreateSenderMailDTO) {
        const { EMAIL_ADDRESS, PASSWORD, SERVICE_NAME } = updateSenderMailDTO;
        try {
            const currentSenderMail = await this.senderMailConfigRepository.findOne();
            currentSenderMail.EMAIL_ADDRESS = EMAIL_ADDRESS;
            const encrypted = encrypt(PASSWORD);
            const HASH_PASSWORD_1 = encrypted.iv;
            const HASH_PASSWORD_2 = encrypted.content;
            currentSenderMail.HASH_PASSWORD_1 = HASH_PASSWORD_1;
            currentSenderMail.HASH_PASSWORD_2 = HASH_PASSWORD_2;
            currentSenderMail.SERVICE_NAME = SERVICE_NAME;
            await currentSenderMail.save();
            return {
                senderMail: currentSenderMail,
            };
        } catch (error) {
            return { error }
        }
    }

    async getSenderMail() {
        const senderMail = await this.senderMailConfigRepository.findOne();
        const decryptedPassword = decrypt({
            iv: senderMail.HASH_PASSWORD_1,
            content: senderMail.HASH_PASSWORD_2
        })
        let encrypedSenderMail: any = senderMail;
        delete encrypedSenderMail.HASH_PASSWORD_1;
        delete encrypedSenderMail.HASH_PASSWORD_2;
        encrypedSenderMail.PASSWORD = decryptedPassword;
        return { senderMail: encrypedSenderMail };
    }
}