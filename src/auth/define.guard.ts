import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { tokenConfig } from '../config/token.config';

@Injectable()
export class DefineGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }
    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        if (request.cookies && request.cookies['access_token']) {
            const access_token = request.cookies['access_token'];
            try {
                const decoded = await this.jwtService.verifyAsync(access_token, { secret: tokenConfig.accesss_token_secret_key })
                if (!decoded) {
                    return true;
                } else {
                    request.customer = {
                        SID: decoded.SID,
                        ROLE: 'admin'
                    };
                }
                return true;
            } catch (error) {
                return true;
            }
        } else if (!request.cookies['access_token']) {
            return true;
        }
    }
}