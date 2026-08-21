import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadToBoth, deleteFromBoth } from '../utils/upload-manager.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1 });
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat._id, isActive: true });
        const obj = cat.toObject();
        obj.productCount = count;
        return obj;
      })
    );
    res.json(categoriesWithCount);
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Category not found', 404));
    }
    const category = await Category.findById(id);
    if (!category) {
      return next(new AppError('Category not found', 404));
    }
    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, icon, description, displayOrder } = req.body;
    let imageUrl = req.body.image || '';

    if (req.file) {
      try {
        const uploadResult = await uploadToBoth(req.file, 'categories');
        imageUrl = uploadResult.url;
      } catch (uploadError) {
        return next(new AppError(`Image upload failed: ${uploadError.message}`, 500));
      }
    } else if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('data:image')) {
      try {
        const matches = imageUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] || 'png';
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const filename = `category_${Date.now()}.${ext}`;
          const uploadResult = await uploadToCloudinary(buffer, filename, 'categories');
          imageUrl = uploadResult.url;
        }
      } catch (uploadError) {
        return next(new AppError(`Image upload failed: ${uploadError.message}`, 500));
      }
    }

    const existing = await Category.findOne({ name: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (existing) {
      return next(new AppError(`Category '${existing.name}' already exists`, 400));
    }

    let categoryCode = req.body.categoryCode;
    if (!categoryCode) {
      try {
        const allCategories = await Category.find({}, 'categoryCode');
        let maxCode = 90;
        for (const cat of allCategories) {
          if (cat.categoryCode) {
            const currentCode = parseInt(cat.categoryCode, 10);
            if (!isNaN(currentCode) && currentCode > maxCode) {
              maxCode = currentCode;
            }
          }
        }
        categoryCode = (maxCode + 10).toString();
      } catch (err) {
        console.error('Error generating categoryCode', err);
        categoryCode = '100';
      }
    }

    const newCategory = new Category({
      name,
      categoryCode,
      icon: icon || '',
      image: imageUrl,
      description: description || '',
      displayOrder: displayOrder || 0,
      isActive: true
    });

    const savedCategory = await newCategory.save();

    res.status(201).json({
      message: 'Category created successfully',
      category: savedCategory
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, icon, description, displayOrder } = req.body;
    let imageUrl = req.body.image;

    if (req.file) {
      try {
        const uploadResult = await uploadToBoth(req.file, 'categories');
        imageUrl = uploadResult.url;
      } catch (uploadError) {
        return next(new AppError(`Image upload failed: ${uploadError.message}`, 500));
      }
    } else if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('data:image')) {
      try {
        const matches = imageUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] || 'png';
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          const filename = `category_${Date.now()}.${ext}`;
          const uploadResult = await uploadToCloudinary(buffer, filename, 'categories');
          imageUrl = uploadResult.url;
        }
      } catch (uploadError) {
        return next(new AppError(`Image upload failed: ${uploadError.message}`, 500));
      }
    }

    const updateData = {};
    if (name) {
      const cleanName = name.trim();
      const existing = await Category.findOne({
        _id: { $ne: req.params.id },
        name: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      });
      if (existing) {
        return next(new AppError(`Category '${existing.name}' already exists`, 400));
      }
      updateData.name = cleanName;
      updateData.slug = cleanName.toLowerCase().replace(/\s+/g, '-');
    }
    if (icon) updateData.icon = icon;
    if (description !== undefined) updateData.description = description;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (imageUrl) updateData.image = imageUrl;

    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, updateData, { returnDocument: 'after' });
    
    if (!updatedCategory) {
      return next(new AppError('Category not found', 404));
    }

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.json({ message: 'Category deleted successfully' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.json({ message: 'Category deleted successfully' });
    }

    // Delete all products in this category
    const products = await Product.find({ category: id });
    
    if (products.length > 0) {
      const deletePromises = products.map(async (product) => {
        if (product.image) {
          await deleteFromBoth(product.image, null).catch(() => {});
        }
        return Product.findByIdAndDelete(product._id);
      });
      await Promise.all(deletePromises);
    }

    if (category.image) {
      await deleteFromBoth(category.image, null).catch(() => {});
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: 'Category and all associated products deleted permanently' });
  } catch (error) {
    next(error);
  }
};

export const updateProductCount = async (categoryId) => {
  try {
    const count = await Product.countDocuments({ category: categoryId, isActive: true });
    await Category.findByIdAndUpdate(categoryId, { productCount: count });
  } catch (error) {
    console.error('Error updating product count:', error);
  }
};
