import { Request, Response, NextFunction } from 'express';
import { createBillSchema, scanSchema, voidBillSchema } from '@toystore/shared';
import * as posService from './pos.service';
import { successResponse, buildPaginatedResponse } from '../../utils/pagination';

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

export async function deleteBill(req: Request, res: Response, next: NextFunction) {
  try {
    await posService.deleteBill(req.params.id);
    res.json(successResponse(null, 'Bill deleted successfully'));
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { bills, total, page, limit } = await posService.getHistory(req.query as Record<string, unknown>);
    res.json(buildPaginatedResponse(bills, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function voidBillController(req: Request, res: Response, next: NextFunction) {
  try {
    const input = voidBillSchema.parse(req.body);
    const result = await posService.voidBill(req.params.id, req.user!, input);

    // If the approver has 2FA enabled, signal the client to collect the OTP
    if ('requiresTwoFactor' in result) {
      res.json({ success: true, data: { requiresTwoFactor: true }, message: 'Enter approver 2FA code' });
      return;
    }

    res.json({ success: true, data: result, message: 'Bill voided successfully' });
  } catch (err) {
    next(err);
  }
}
