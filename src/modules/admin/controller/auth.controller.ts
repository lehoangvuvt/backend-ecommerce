import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import Users from '../entity/users.entity';
import LoginDTO from '../dto/login.dto';
import { tokenConfig } from '../../../config/token.config';
import AuthService from '../services/auth.service';
import { TokenGuard } from '../../../auth/token.guard';

@Controller('auth')
export default class AuthController {
  constructor(
    private readonly service: AuthService,
    private jwtService: JwtService,
  ) {}

  @Post('/login')
  @ApiBody({ type: [LoginDTO] })
  @ApiResponse({ type: Users })
  async login(@Body() loginDTO: LoginDTO, @Res() res: Response) {
    const response = await this.service.login(loginDTO);
    let ROLE_ID = [];
    if (response.error) return res.json({ message: response.error });
    const getUserRole = response.user_info.userRole.map((item) =>
      ROLE_ID.push(item.ROLE_ID),
    );
    await Promise.all(getUserRole);
    const acesss_token = await this.jwtService.signAsync(
      { SID: response.user_info.SID, ROLES: ROLE_ID },
      {
        secret: tokenConfig.accesss_token_secret_key,
        expiresIn: tokenConfig.access_token_duration,
      },
    );
    const refresh_token = await this.jwtService.signAsync(
      { SID: response.user_info.SID, ROLES: ROLE_ID },
      {
        secret: tokenConfig.refresh_token_secret_key,
        expiresIn: tokenConfig.refresh_token_duration,
      },
    );
    res.cookie('access_token', acesss_token, { httpOnly: true });
    res.cookie('refresh_token', refresh_token, { httpOnly: true });
    return res.status(200).json({
      user_info: response.user_info,
    });
  }

  @Get('/logout')
  @UseGuards(TokenGuard)
  async logout(@Res() res: Response, @Req() req: Request) {
    res.cookie('access_token', null, { maxAge: 0 });
    res.cookie('refresh_token', null, { maxAge: 0 });
    return res.status(200).json({
      message: 'Log out successfully',
    });
  }
}
