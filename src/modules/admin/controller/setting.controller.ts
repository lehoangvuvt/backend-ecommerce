import { Body, Controller, Get, Param, Post, Put, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import CreateSenderMailDTO from '../dto/create_sender_mail.dto';
import UpdateMailTemplateDetailsDTO from '../dto/update_mail_template.dto';
import SettingService from '../services/setting.service';

@Controller('setting')
export default class SettingController {
    constructor(
        private readonly service: SettingService,
    ) { }

    @Get('/mail-settings')
    async getAllMailSettings(
        @Res() res: Response,
    ) {
        const response = await this.service.getAllMailSettings();
        return res.json({
            mailSettings: response.mailSettings,
        })
    }

    @Get('/mail-settings/details/:ID')
    async getMailSettingsDetails(
        @Param('ID') ID: number,
        @Res() res: Response,
    ) {
        const response = await this.service.getMailSettingsDetails(ID);
        return res.json({
            mailSetting: response.mailSetting,
        })
    }

    @Get('/mail-settings/templates/:ID')
    async getTemplateDetails(
        @Param('ID') ID: number,
        @Res() res: Response,
    ) {
        const response = await this.service.getTemplateDetails(ID);
        return res.json({
            templateDetails: response.templateDetails,
            columns: response.columns,
        })
    }

    @Put('/mail-settings/templates/:ID')
    async updateTemplateDetails(
        @Param('ID') ID: number,
        @Body() updateMailTemplateDetailsDTO: UpdateMailTemplateDetailsDTO,
        @Res() res: Response,
    ) {
        const response = await this.service.updateMailTemplateDetails(ID, updateMailTemplateDetailsDTO);
        if (response.error) return res.json({ error: response.error });
        return res.json({ mailTemplate: response.mailTemplate });
    }

    @Post('/mail-settings/sender-mail')
    async createNewSenderMail(
        @Body() createSenderMailDTO: CreateSenderMailDTO,
        @Res() res: Response,
    ) {
        const response = await this.service.createNewSenderMail(createSenderMailDTO);
        if (response.error) return res.json({ error: response.error });
        return res.json({
            newSenderMail: response.newSenderMail,
        })
    }

    @Get('/mail-settings/sender-mail')
    async getSenderMailConfig(
        @Res() res: Response,
    ) {
        const response = await this.service.getSenderMail();
        return res.json({ senderMail: response.senderMail });
    }

    @Put('/mail-settings/sender-mail/update')
    async updateSenderMailConfig(
        @Body() updateSenderMailDTO: CreateSenderMailDTO,
        @Res() res: Response,
    ) {
        const response = await this.service.updateSenderMail(updateSenderMailDTO);
        if (response.error) return res.json({ error: response.error });
        return res.json({ senderMail: response.senderMail });
    }
}
