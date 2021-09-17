import { NestMiddleware, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import { tokenConfig } from '../config/token.config';
import Permissions from '../modules/admin/entity/permission.entity';
import Roles from '../modules/admin/entity/role.entity';
import AuthService from '../modules/admin/services/auth.service';
import { Repository } from 'typeorm';

@Injectable()
export class PermissionMiddleware implements NestMiddleware {
  constructor(
    private readonly service: AuthService,
    private jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: Function) {
    const path = req.originalUrl.split('/')[1];
    //Check valid cookie
    if (!req.headers.cookie) {
      res.status(403).json({
        error: 'access denied',
      });
    } else {
      var cookie = req.headers.cookie.split(' ');
      var token = cookie[0]
        .split('=')[1]
        .substring(0, cookie[0].split('=')[1].length - 1);
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: tokenConfig.accesss_token_secret_key,
      });
      let permission = await this.service
        .getRolePermByPath(path)
        .then((res) => res.perm);
      //Check req path exist in Permissions or not
      //!If not 403
      if (!permission)
        res.status(403).json({
          error: 'access denied',
        });
      //Array of valid role ID
      let valid_role = [];
      permission.map((item) => {
        valid_role.push(item.ID);
      });
      //Compare array of ROLES in coookie with valid_role array return dupe elements
      // ex: [1,2] with [1,3,4] => 1
      var checkRole = valid_role.filter((val) => {
        return decoded.ROLES.indexOf(val) != -1;
      });
      //!If no dupes
      if ((checkRole.length = 0)) {
        res.status(403).json({
          error: 'access denied',
        });
      } else {
        //Array of permissions
        let PERM = [];
        const getUserPerm = decoded.ROLES.map(
          async (item) =>
            await this.service
              .getRolePermissonsByID(item)
              .then((res) => PERM.push(res.role_info)),
        );
        await Promise.all(getUserPerm);
        //Array of valid method to access req path
        var valid_methods = [];
        //Array of paths that users have permission to
        var valid_path = [];
        PERM.map((item) => {
          //Push path from Role's permission to valid_path
          item.rolePerm.map((path) => {
            valid_path.push(path.PATH);
          });
          //Find any get Permission from Role's Permission that have the same path as req path
          let data = item.rolePerm.find((item) => item.PATH == path);
          if (!data) return;
          if (data.RIGHTS.lenght > 1) {
            let arr = data.RIGHTS.split(',');
            valid_methods = [...valid_methods, ...arr];
          } else {
            let arr = data.RIGHTS;
            valid_methods = [...valid_methods, ...arr];
          }
        });
        //The whole point of upper map function is to find the valid method for the req path
        //and to check again if that role permissions have access to the req path
        if (
          valid_methods.indexOf(req.method) > -1 &&
          valid_path.indexOf(path) > -1
        ) {
          next();
        } else {
          res.status(403).json({
            error: 'access denied',
          });
        }
      }
    }
  }
}
