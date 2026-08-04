import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadToBoth, deleteFromBoth } from '../utils/upload-manager.js';

export const getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('displayOrder');
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
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
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return next(new AppError('Category already exists', 400));
    }

    // Auto-generate categoryCode
    let categoryCode = '100';
    try {
      const highestCategory = await Category.findOne({}, 'categoryCode')
        .sort({ categoryCode: -1 })
        .collation({ locale: "en_US", numericOrdering: true });
        
      if (highestCategory && highestCategory.categoryCode) {
        const lastCode = parseInt(highestCategory.categoryCode, 10);
        if (!isNaN(lastCode)) {
          categoryCode = (lastCode + 10).toString();
        }
      }
    } catch (err) {
      console.error('Error generating categoryCode', err);
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
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (icon) updateData.icon = icon;
    if (description) updateData.description = description;
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
    const category = await Category.findById(req.params.id);
    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    // Delete all products in this category
    const products = await Product.find({ category: req.params.id });
    
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
