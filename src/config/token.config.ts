import { config } from 'dotenv';

config();

export const tokenConfig = {
    refresh_token_duration: 1 * 24 * 60 * 60,
    access_token_duration: 1 * 60 * 60,
    recovery_password_token_duration: 24 * 60 * 60,
    active_account_token_duration: 1 * 60 * 60,
    prism_token_duration: 1 * 60 * 60,

    refresh_token_secret_key: process.env.REFRESH_TOKEN_SECRET_KEY,
    accesss_token_secret_key: process.env.ACCESS_TOKEN_SECRET_KEY,
    recovery_password_token_secret_key: process.env.RECOVERY_PASSWORD_TOKEN_SECRET_KEY,
    active_account_token_secret_key: process.env.ACTIVE_ACCOUNT_TOKEN_SECRET_KEY,
    prism_token_secret_key: process.env.PRISM_TOKEN_SECRET_KEY,
}