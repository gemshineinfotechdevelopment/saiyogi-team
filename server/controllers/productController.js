import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadToBoth, deleteFromBoth } from '../utils/upload-manager.js';

export const getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, search, sort } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      const q = search.toLowerCase();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { code: { $regex: q, $options: 'i' } }
      ];
    }

    let sortOptions = {};
    if (sort === 'price-asc') {
      sortOptions.price = 1;
    } else if (sort === 'price-desc') {
      sortOptions.price = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('category', 'name slug');

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) {
      return next(new AppError('Product not found', 404));
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { name, code, sku, category, price, wholesalePrice, netRate, stock, minimumStock, description, brand, hasDiscount, displayNetRate, storeStockPieces, godownStockCases, piecesPerCase } = req.body;

    let imageUrl = req.body.image || '';
    
    if (req.file) {
      try {
        const uploadResult = await uploadToBoth(req.file, 'products');
        imageUrl = uploadResult.url;
      } catch (uploadError) {
        return next(new AppError(`Image upload failed: ${uploadError.message}`, 500));
      }
    }

    const cat = await Category.findById(category);
    if (!cat || !cat.categoryCode) {
      return next(new AppError('Category not found or missing category code', 400));
    }
    const categoryCode = cat.categoryCode;

    // Auto-generate numeric sku
    let newSkuStr = categoryCode + '1';
    try {
      const allProducts = await Product.find({}, 'sku');
      let maxSeq = 0;
      for (const p of allProducts) {
        if (p.sku && p.sku.startsWith(categoryCode)) {
          const seqStr = p.sku.substring(categoryCode.length).trim();
          if (/^\d+$/.test(seqStr)) {
            const seq = parseInt(seqStr, 10);
            if (seq > maxSeq) maxSeq = seq;
          }
        }
      }
      newSkuStr = categoryCode + (maxSeq + 1).toString();
    } catch (err) {
      console.error('Error generating SKU', err);
      newSkuStr = categoryCode + Date.now().toString().substring(5);
    }

    const newProduct = new Product({
      name,
      code: newSkuStr,
      sku: newSkuStr,
      category,
      price: price ? parseFloat(price) : 0,
      wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : 0,
      netRate: netRate ? parseFloat(netRate) : 0,
      brand: brand || '',
      hasDiscount: (displayNetRate === 'true' || displayNetRate === true) ? false : (hasDiscount === 'true' || hasDiscount === true),
      displayNetRate: displayNetRate === 'true' || displayNetRate === true,
      stock: stock ? parseInt(stock) : 0,
      storeStockPieces: storeStockPieces ? parseInt(storeStockPieces) : 0,
      godownStockCases: godownStockCases ? parseInt(godownStockCases) : 0,
      piecesPerCase: piecesPerCase ? parseInt(piecesPerCase) : 1,
      godownStockPieces: (godownStockCases ? parseInt(godownStockCases) : 0) * (piecesPerCase ? parseInt(piecesPerCase) : 1),
      minimumStock: minimumStock ? parseInt(minimumStock) : 0,
      description,
      image: imageUrl,
      isActive: true
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      message: 'Product created successfully',
      product: savedProduct
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, sku, category, price, wholesalePrice, netRate, stock, minimumStock, description, isActive, brand, hasDiscount, displayNetRate, storeStockPieces, godownStockCases, piecesPerCase } = req.body;
    
    let imageUrl = req.body.image;

    if (req.file) {
      try {
        const uploadResult = await uploadToBoth(req.file, 'products');
        imageUrl = uploadResult.url;
      } catch (uploadError) {
        return next(new AppError(`Image upload failed: ${uploadError.message}`, 500));
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code;
    if (sku) updateData.sku = sku;
    if (category) updateData.category = category;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (wholesalePrice !== undefined) updateData.wholesalePrice = parseFloat(wholesalePrice);
    if (netRate !== undefined) updateData.netRate = parseFloat(netRate);
    if (brand !== undefined) updateData.brand = brand;
    if (hasDiscount !== undefined) updateData.hasDiscount = hasDiscount === 'true' || hasDiscount === true;
    if (displayNetRate !== undefined) updateData.displayNetRate = displayNetRate === 'true' || displayNetRate === true;

    if (updateData.displayNetRate === true) {
      updateData.hasDiscount = false;
    }
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (storeStockPieces !== undefined) updateData.storeStockPieces = parseInt(storeStockPieces);
    if (godownStockCases !== undefined) updateData.godownStockCases = parseInt(godownStockCases);
    if (piecesPerCase !== undefined) updateData.piecesPerCase = parseInt(piecesPerCase);
    if (godownStockCases !== undefined || piecesPerCase !== undefined) {
      const existingProduct = await Product.findById(id);
      const cases = godownStockCases !== undefined ? parseInt(godownStockCases) : (existingProduct?.godownStockCases || 0);
      const ppc = piecesPerCase !== undefined ? parseInt(piecesPerCase) : (existingProduct?.piecesPerCase || 1);
      updateData.godownStockPieces = cases * ppc;
    }
    if (minimumStock !== undefined) updateData.minimumStock = parseInt(minimumStock);
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
    if (imageUrl) updateData.image = imageUrl;

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
    
    if (!updatedProduct) {
      return next(new AppError('Product not found', 404));
    }

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    if (product.image) {
      // Assuming deleteFromBoth logic can extract publicId or handle URL directly
      await deleteFromBoth(product.image, null).catch(err => console.error("Failed to delete image:", err));
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted permanently' });
  } catch (error) {
    next(error);
  }
};

export const getProductsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ isActive: true, category }).populate('category', 'name slug');
    res.json(products);
  } catch (error) {
    next(error);
  }
};
