import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const companyId = req.headers['x-company-id'] as string;
    if (companyId) {
      (req as any).companyId = companyId;
    }
    console.log('[TenantMiddleware] companyId:', companyId, 'path:', req.path);
    next();
  }
}
