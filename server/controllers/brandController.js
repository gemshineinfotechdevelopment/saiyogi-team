import Brand from '../models/Brand.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import { uploadToBoth } from '../utils/upload-manager.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// Helper to handle logo upload to Cloudinary (from req.file or base64 string)
const processLogoUpload = async (req, fallbackLogo = '/sky_rocket_box.png') => {
  if (req.file) {
    const uploadResult = await uploadToBoth(req.file, 'brands');
    return uploadResult.url;
  }
  
  if (req.body.logo && typeof req.body.logo === 'string' && req.body.logo.startsWith('data:image')) {
    const matches = req.body.logo.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1] || 'png';
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `brand_${Date.now()}.${ext}`;
      const uploadResult = await uploadToCloudinary(buffer, filename, 'brands');
      return uploadResult.url;
    }
  }

  return req.body.logo || fallbackLogo;
};

// Helper function to generate auto brandId like B0001, B0002
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
  return `B${padded}`;
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
    const { name, phone, description, itemsCount, isActive } = req.body;

    if (!name) {
      return next(new AppError('Brand name is required', 400));
    }

    // Case-insensitive duplicate check: prevent "coronation" if "Coronation" already exists
    const existing = await Brand.findOne({ name: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (existing) {
      return next(new AppError(`Brand '${existing.name}' already exists. Use the existing brand instead of creating a duplicate.`, 409));
    }

    const logoUrl = await processLogoUpload(req, '/sky_rocket_box.png');
    const brandId = await generateBrandId();

    const brand = new Brand({
      brandId,
      name: name.trim(),
      phone: (phone || '').trim(),
      logo: logoUrl,
      description: (description || '').trim(),
      itemsCount: typeof itemsCount === 'number' ? Number(itemsCount) : 0,
      isActive: typeof isActive === 'boolean' ? isActive : isActive !== 'false',
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
    const { name, phone, description, itemsCount, isActive } = req.body;
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return next(new AppError('Brand not found', 404));
    }

    if (req.file || (req.body.logo && req.body.logo !== brand.logo)) {
      brand.logo = await processLogoUpload(req, brand.logo);
    }

    if (name) brand.name = name.trim();
    if (phone !== undefined) brand.phone = phone.trim();
    if (description !== undefined) brand.description = description.trim();
    if (itemsCount !== undefined) brand.itemsCount = Number(itemsCount);
    if (isActive !== undefined) brand.isActive = typeof isActive === 'boolean' ? isActive : isActive !== 'false';

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
