import {
  Body,
  Controller,
  Get,
  Put,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiBody } from '@nestjs/swagger';
import RoleDTO from '../dto/role.dto';
import AuthService from '../services/auth.service';
import EditRoleDTO from '../dto/edit_role.dto';
import UserRolesDTO from '../dto/user_role.dto';
import RegisterDTO from '../dto/register.dto';

@Controller('permissions')
export default class RoleController {
  constructor(private readonly service: AuthService) {}

  //Create role
  @Post('roles/add-role')
  @ApiBody({ type: RoleDTO })
  async createRole(@Body() roleDTO: RoleDTO, @Res() res: Response) {
    const response = await this.service.createRole(roleDTO);
    if (response.error) return res.json({ error: { message: response.error } });
    return res.json({
      role: response.newRole,
    });
  }

  //Get Role by ID
  @Get('roles/role/:id')
  async getAllRolePermission(@Param('id') id, @Res() res: Response) {
    const response = await this.service.getRolePermissonsByID(id);
    if (response.error) return res.json({ error: { message: response.error } });
    return res.json({
      roles: response.role_info,
    });
  }

  @Get('roles')
  async getAllRole(@Res() res: Response) {
    const response = await this.service.getAllRole();
    return res.json({
      roles: response.roles,
    });
  }

  @Get('/roles/perm')
  async getAllRolePerm(@Res() res: Response) {
    const response = await this.service.getRolesPerm();
    return res.json({
      roles: response.roles,
    });
  }

  @Post('/roles/perm')
  @ApiBody({ type: EditRoleDTO })
  async createRolePerm(@Body() dto: EditRoleDTO, @Res() res: Response) {
    const response = await this.service.createRolePermission(dto);
    if (response.error)
      return res.status(404).json({
        error: { message: response.error },
      });
    return res.json({
      roles: response.created,
    });
  }

  @Put('/roles/perm')
  @ApiBody({ type: EditRoleDTO })
  async editRolePerm(@Body() dto: EditRoleDTO, @Res() res: Response) {
    const response = await this.service.editRolePermission(dto);
    return res.json({
      roles: response.updated,
    });
  }

  //Get Users
  @Get('/user/users')
  async getAllUsers(@Res() res: Response) {
    const response = await this.service.getAllUsers();
    return res.json({
      users: response.users_info,
    });
  }

  //Create User
  @Post('/user')
  @ApiBody({ type: RegisterDTO })
  async register(@Body() registerDTO: RegisterDTO, @Res() res: Response) {
    const response = await this.service.register(registerDTO);
    if (response.error) return res.json({ error: { message: response.error } });
    return res.json({
      response,
    });
  }

  //Add roles to user
  @Post('/user/roles')
  @ApiBody({ type: UserRolesDTO })
  async createUserRoles(@Body() dto: UserRolesDTO, @Res() res: Response) {
    const response = await this.service.createUserRoles(dto);
    return res.json({
      users: response.loop,
    });
  }

  //Resources
  @Get('/resources')
  async getAllResources(@Res() res: Response) {
    const response = await this.service.getAllResources();
    return res.json({
      resources: response.resources,
    });
  }
}
