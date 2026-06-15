import { Request, Response, NextFunction } from 'express';
import { createProductSchema, updateProductSchema, stockAdjustmentSchema } from '@toystore/shared';
import * as productsService from './products.service';
import { buildPaginatedResponse, successResponse } from '../../utils/pagination';

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const { products, total, page, limit } = await productsService.listProducts(req.query as Record<string, unknown>);
    res.json(buildPaginatedResponse(products, total, page, limit));
  } catch (err) { next(err); }
}

export async function getProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productsService.getProductById(req.params.id);
    res.json(successResponse(product));
  } catch (err) { next(err); }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createProductSchema.parse(req.body);
    const imageUrl = req.body.imageUrl as string | undefined;
    const product = await productsService.createProduct(data, imageUrl, req.user!.userId);
    res.status(201).json(successResponse(product, 'Product created successfully'));
  } catch (err) { next(err); }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateProductSchema.parse(req.body);
    const product = await productsService.updateProduct(req.params.id, data);
    res.json(successResponse(product, 'Product updated successfully'));
  } catch (err) { next(err); }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction) {
  try {
    await productsService.deleteProduct(req.params.id);
    res.json(successResponse(null, 'Product deleted successfully'));
  } catch (err) { next(err); }
}

export async function adjustStock(req: Request, res: Response, next: NextFunction) {
  try {
    const { adjustment, reason } = stockAdjustmentSchema.parse(req.body);
    const product = await productsService.adjustStock(req.params.id, adjustment, reason);
    res.json(successResponse(product, 'Stock adjusted successfully'));
  } catch (err) { next(err); }
}
