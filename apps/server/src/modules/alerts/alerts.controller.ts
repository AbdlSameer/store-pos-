import { Request, Response, NextFunction } from 'express';
import * as alertsService from './alerts.service';
import { successResponse } from '../../utils/pagination';

export async function getAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    const alerts = await alertsService.getActiveAlerts();
    res.json(successResponse(alerts));
  } catch (err) { next(err); }
}

export async function acknowledge(req: Request, res: Response, next: NextFunction) {
  try {
    const alert = await alertsService.acknowledgeAlert(req.params.id, req.user!.userId);
    res.json(successResponse(alert, 'Alert acknowledged'));
  } catch (err) { next(err); }
}
