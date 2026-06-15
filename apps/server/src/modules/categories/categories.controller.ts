import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';

export async function listCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, description, parentId } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const category = await prisma.category.create({
      data: { name, slug, description, parentId }
    });
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
}
