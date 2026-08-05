import Brand from '../models/Brand.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

// Helper function to generate auto brandId like b0001, b0002
const generateBrandId = async () => {
  const brands = await Brand.find({ brandId: { $regex: /^b\d+$/i } }).sort({ createdAt: -1 });
  let maxNum = 0;

  for (const b of brands) {
    if (b.brandId) {
      const match = b.brandId.match(/^b(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(4, '0');
  return `b${padded}`;
};

// GET all brands
export const getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find().sort({ createdAt: -1 });
    res.json(brands);
  } catch (error) {
    next(error);
  }
};

// GET next auto brand ID
export const getNextBrandId = async (req, res, next) => {
  try {
    const nextBrandId = await generateBrandId();
    res.json({ brandId: nextBrandId });
  } catch (error) {
    next(error);
  }
};

// CREATE brand
export const createBrand = async (req, res, next) => {
  try {
    const { name, phone, logo, description, itemsCount, isActive } = req.body;

    if (!name) {
      return next(new AppError('Brand name is required', 400));
    }

    const brandId = await generateBrandId();

    const brand = new Brand({
      brandId,
      name: name.trim(),
      phone: (phone || '').trim(),
      logo: logo || '/sky_rocket_box.png',
      description: (description || '').trim(),
      itemsCount: typeof itemsCount === 'number' ? itemsCount : 0,
      isActive: typeof isActive === 'boolean' ? isActive : true,
    });

    const savedBrand = await brand.save();
    logger.info(`Brand created: ${savedBrand.name} (${savedBrand.brandId})`, { reqId: req.id });
    res.status(201).json(savedBrand);
  } catch (error) {
    next(error);
  }
};

// UPDATE brand
export const updateBrand = async (req, res, next) => {
  try {
    const { name, phone, logo, description, itemsCount, isActive } = req.body;
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return next(new AppError('Brand not found', 404));
    }

    if (name) brand.name = name.trim();
    if (phone !== undefined) brand.phone = phone.trim();
    if (logo !== undefined) brand.logo = logo;
    if (description !== undefined) brand.description = description.trim();
    if (itemsCount !== undefined) brand.itemsCount = itemsCount;
    if (isActive !== undefined) brand.isActive = isActive;

    const updatedBrand = await brand.save();
    logger.info(`Brand updated: ${updatedBrand.name} (${updatedBrand.brandId})`, { reqId: req.id });
    res.json(updatedBrand);
  } catch (error) {
    next(error);
  }
};

// DELETE brand
export const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return next(new AppError('Brand not found', 404));
    }

    await brand.deleteOne();
    logger.info(`Brand deleted: ${brand.name} (${brand.brandId})`, { reqId: req.id });
    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    next(error);
  }
};
