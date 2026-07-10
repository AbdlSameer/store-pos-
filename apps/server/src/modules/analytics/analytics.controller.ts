import { Request, Response, NextFunction } from 'express';
import * as analyticsService from './analytics.service';
import { successResponse } from '../../utils/pagination';

export async function getDashboardSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await analyticsService.getDashboardSummary();
    res.json(successResponse(summary));
  } catch (err) { next(err); }
}

export async function getTopProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const products = await analyticsService.getTopProducts();
    res.json(successResponse(products));
  } catch (err) { next(err); }
}

export async function getDeadStock(req: Request, res: Response, next: NextFunction) {
  try {
    const products = await analyticsService.getDeadStock();
    res.json(successResponse(products));
  } catch (err) { next(err); }
}
