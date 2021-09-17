import { CanActivate, ExecutionContext, Injectable, mixin } from "@nestjs/common";

export const RoleGuard = (role: string) => {
    class RoleGuardMixin implements CanActivate {
        canActivate(context: ExecutionContext) {
            const req = context.switchToHttp().getRequest();
            if (req.customer) {
                if (req.customer.ROLE !== role) return false;
                return true;
            } else {
                return false;
            }
        }
    }
    const guard = mixin(RoleGuardMixin);
    return guard;
}