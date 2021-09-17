import axios from 'axios';
import { config } from 'dotenv';

config();

export const getNodeMailerConfig = async () => {
    const response = await axios({
        url: "http://localhost:5035/setting/mail-settings/sender-mail",
        method: "GET",
        withCredentials: true
    })
    const data = response.data;
    if (data.senderMail) {
        return {
            service: data.senderMail.SERVICE_NAME,
            email: data.senderMail.EMAIL_ADDRESS,
            password: data.senderMail.PASSWORD
        }
    } else {
        return {
            service: 'Mail.ru',
            email: process.env.EMAIL,
            password: process.env.EMAIL_PASSWORD
        }
    }
}