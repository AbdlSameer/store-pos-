import { Request, Response, NextFunction } from 'express';
import { createBillSchema, scanSchema } from '@toystore/shared';
import * as posService from './pos.service';
import { successResponse } from '../../utils/pagination';

export async function scanQr(req: Request, res: Response, next: NextFunction) {
  try {
    const { payload, signature } = scanSchema.parse(req.body);
    const product = await posService.scanProduct(payload, signature);
    res.json(successResponse(product, 'Product scanned successfully'));
  } catch (err) {
    next(err);
  }
}

export async function createBill(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createBillSchema.parse(req.body);
    const bill = await posService.createBill(data, req.user!.userId);
    res.status(201).json(successResponse(bill, 'Bill created successfully'));
  } catch (err) {
    next(err);
  }
}

export async function getBills(req: Request, res: Response, next: NextFunction) {
  try {
    const bills = await posService.getBills();
    res.json(successResponse(bills));
  } catch (err) {
    next(err);
  }
}

export async function getBill(req: Request, res: Response, next: NextFunction) {
  try {
    const bill = await posService.getBillById(req.params.id);
    res.json(successResponse(bill));
  } catch (err) {
    next(err);
  }
}
