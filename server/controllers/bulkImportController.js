import fs from 'fs';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';
import XLSX from 'xlsx';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { v4 as uuidv4 } from 'uuid';

// In-memory job status store
const bulkImportJobs = new Map();

/**
 * Generate a category-code-based SKU — mirrors the logic in productController.js.
 * @param {string} categoryCode  e.g. "100", "110", "SPARK"
 * @param {string[]} allSkus     All existing SKU strings from MongoDB + already-assigned in this batch
 * @returns {string}             e.g. "1001", "1002" for categoryCode "100"
 */
function generateCategoryBasedSku(categoryCode, allSkus) {
  const catNum = parseInt(categoryCode, 10);
  const isNumericCat = !isNaN(catNum);
  const base = isNumericCat ? (categoryCode.length === 3 ? catNum * 10 : catNum) : null;

  const seqs = [];
  for (const sku of allSkus) {
    if (!sku) continue;
    if (isNumericCat && base !== null) {
      const skuNum = parseInt(sku, 10);
      if (!isNaN(skuNum) && skuNum > base && skuNum < base + 100) {
        seqs.push(skuNum - base);
      }
    } else if (sku.startsWith(categoryCode)) {
      const seqStr = sku.substring(categoryCode.length).trim();
      if (/^\d+$/.test(seqStr)) {
        seqs.push(parseInt(seqStr, 10));
      }
    }
  }

  seqs.sort((a, b) => a - b);
  let expectedSeq = 1;
  for (const seq of seqs) {
    if (seq > expectedSeq) break;
    if (seq === expectedSeq) expectedSeq++;
  }

  return isNumericCat && base !== null
    ? (base + expectedSeq).toString()
    : `${categoryCode}${expectedSeq}`;
}

// Clean up old completed/failed jobs after 2 hours
setInterval(() => {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [jobId, job] of bulkImportJobs.entries()) {
    if (job.createdAt && new Date(job.createdAt).getTime() < twoHoursAgo) {
      bulkImportJobs.delete(jobId);
    }
  }
}, 30 * 60 * 1000);

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Start Bulk Product Import Job
 */
export const startBulkImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a valid ZIP file' });
    }

    const originalName = req.file.originalname || '';
    if (!originalName.toLowerCase().endsWith('.zip')) {
      return res.status(400).json({ success: false, message: 'Only .zip files are supported' });
    }

    const jobId = uuidv4();
    const tempBaseDir = path.join(process.cwd(), 'server', 'temp', 'bulk-import');
    const jobDir = path.join(tempBaseDir, jobId);

    // Create unique directory for job
    fs.mkdirSync(jobDir, { recursive: true });
    const zipPath = path.join(jobDir, 'uploaded.zip');

    // If file is buffer (memoryStorage) or disk file
    if (req.file.buffer) {
      fs.writeFileSync(zipPath, req.file.buffer);
    } else if (req.file.path) {
      fs.copyFileSync(req.file.path, zipPath);
      try { fs.unlinkSync(req.file.path); } catch (e) { }
    }

    const job = {
      jobId,
      status: 'queued',
      totalCount: 0,
      processedCount: 0,
      successCount: 0,
      failedCount: 0,
      percentage: 0,
      errors: [],
      summary: null,
      createdAt: new Date(),
      completedAt: null
    };

    bulkImportJobs.set(jobId, job);

    // Start background processing non-blockingly
    processBulkImportJob(jobId, zipPath, jobDir).catch(err => {
      console.error(`Error processing bulk import job ${jobId}:`, err);
      const currentJob = bulkImportJobs.get(jobId);
      if (currentJob) {
        currentJob.status = 'failed';
        currentJob.summary = { error: err.message || 'Fatal background processing error' };
      }
    });

    return res.json({
      success: true,
      message: 'Bulk product import job queued successfully',
      jobId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Bulk Import Job Progress & Results
 */
export const getBulkImportStatus = async (req, res) => {
  const { jobId } = req.params;
  const job = bulkImportJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ success: false, message: 'Bulk import job not found' });
  }

  return res.json({
    success: true,
    jobId: job.jobId,
    status: job.status,
    totalCount: job.totalCount,
    processedCount: job.processedCount,
    successCount: job.successCount,
    failedCount: job.failedCount,
    percentage: job.percentage,
    errors: job.errors,
    summary: job.summary
  });
};

/**
 * Download Sample Excel Template
 */
export const downloadTemplate = async (req, res) => {
  try {
    // Columns match the admin Add Product form exactly
    // REQUIRED: productName, category, price, image, stock
    // OPTIONAL:  netRate, quantity, brand, crackerType, hasDiscount, displayNetRate, rating, isSaiYogiVerified, description
    const sampleData = [
      {
        productName: "10cm Electric Sparklers",  // REQUIRED — Product display name
        category: "Sparklers",                   // REQUIRED — Must match a category name in the system
        price: 50,                               // REQUIRED — Retail price (₹)
        image: "product001.jpg",                 // REQUIRED — Filename inside images/ folder in the ZIP
        stock: 500,                              // REQUIRED — Number of pieces in store stock
        netRate: 35,                             // optional — Net rate price (leave 0 if none)
        quantity: "1 Box (10 Pcs)",              // optional — Pack/unit label shown on site
        brand: "Standard",                       // optional — Must match a brand name in the system
        crackerType: "Day Crackers",             // optional — See Instructions sheet for valid values
        hasDiscount: "TRUE",                     // optional — TRUE or FALSE
        displayNetRate: "FALSE",                 // optional — TRUE = show product as Net Rate
        rating: 5,                               // optional — Star rating 1 to 5 (default: 5)
        isSaiYogiVerified: "TRUE",               // optional — TRUE or FALSE (default: TRUE)
        description: "Safe, bright sparkling fireworks for kids and families"  // optional
      },
      {
        productName: "Flower Pots Big",
        category: "Flower Pots",
        price: 200,
        image: "product002.jpg",
        stock: 200,
        netRate: 160,
        quantity: "1 Box (5 Pcs)",
        brand: "Coronation",
        crackerType: "Night Crackers",
        hasDiscount: "FALSE",
        displayNetRate: "FALSE",
        rating: 4.8,
        isSaiYogiVerified: "TRUE",
        description: "High reaching golden fountain flower pots"
      },
      {
        productName: "Family Star Combo Pack",
        category: "Combo Packs",
        price: 1500,
        image: "product003.jpg",
        stock: 50,
        netRate: 1200,
        quantity: "1 Combo (45 Items)",
        brand: "Sai Yogi Standard",
        crackerType: "Night Crackers",
        hasDiscount: "TRUE",
        displayNetRate: "FALSE",
        rating: 5,
        isSaiYogiVerified: "TRUE",
        description: "Complete family celebration pack with sparklers, pots, and sky shots"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    // Column widths
    worksheet['!cols'] = [
      { wch: 32 }, // productName  ← REQUIRED
      { wch: 22 }, // category     ← REQUIRED
      { wch: 12 }, // price        ← REQUIRED
      { wch: 22 }, // image        ← REQUIRED
      { wch: 12 }, // stock        ← REQUIRED
      { wch: 14 }, // netRate
      { wch: 22 }, // quantity
      { wch: 20 }, // brand
      { wch: 18 }, // crackerType
      { wch: 14 }, // hasDiscount
      { wch: 16 }, // displayNetRate
      { wch: 10 }, // rating
      { wch: 20 }, // isSaiYogiVerified
      { wch: 50 }  // description
    ];

    // ── Second sheet: Instructions ─────────────────────────────────────────
    const instructions = [
      { Field: "productName",   Required: "YES", Description: "Product display name shown on the site" },
      { Field: "category",      Required: "YES", Description: "Must exactly match a category name in the admin (e.g. Sparklers, Flower Pots, Combo Packs)" },
      { Field: "price",         Required: "YES", Description: "Retail / selling price in ₹ (numbers only)" },
      { Field: "image",         Required: "YES", Description: "Image filename inside the images/ folder in your ZIP (e.g. product001.jpg)" },
      { Field: "stock",         Required: "YES", Description: "Number of pieces available in store stock" },
      { Field: "netRate",       Required: "no",  Description: "Net rate price in ₹. Leave 0 or blank if not applicable" },
      { Field: "quantity",      Required: "no",  Description: "Pack/unit label shown on site (e.g. 1 Box (10 Pcs), 36 Items)" },
      { Field: "brand",         Required: "no",  Description: "Must match a brand name added in the admin. Leave blank to default to Sai Yogi Standard" },
      { Field: "crackerType",   Required: "no",  Description: "Valid values: Day Crackers | Night Crackers | Kids Crackers | Gift Box. Default: Day Crackers" },
      { Field: "hasDiscount",      Required: "no",  Description: "TRUE or FALSE. Set TRUE if this product has a discounted price" },
      { Field: "displayNetRate",   Required: "no",  Description: "TRUE or FALSE. Set TRUE to show product as a Net Rate product on the shop" },
      { Field: "rating",           Required: "no",  Description: "Star rating from 1 to 5 (decimals allowed, e.g. 4.5). Default: 5" },
      { Field: "isSaiYogiVerified",Required: "no",  Description: "TRUE or FALSE. Shows the Sai Yogi Verified badge on product. Default: TRUE" },
      { Field: "description",   Required: "no",  Description: "Short product description text" },
      { Field: "",              Required: "",    Description: "" },
      { Field: "── crackerType valid values ──", Required: "", Description: "" },
      { Field: "Day Crackers",   Required: "", Description: "Default value. Products visible during daytime" },
      { Field: "Night Crackers", Required: "", Description: "Products meant for night use" },
      { Field: "Kids Crackers",  Required: "", Description: "Safe crackers for children" },
      { Field: "Gift Box",       Required: "", Description: "Gift-box packaged products" },
      { Field: "",              Required: "",    Description: "" },
      { Field: "── ZIP structure ──", Required: "", Description: "" },
      { Field: "products-import.zip", Required: "", Description: "Root ZIP file to upload" },
      { Field: "  products.xlsx",     Required: "", Description: "This Excel file (must be named products.xlsx)" },
      { Field: "  images/",           Required: "", Description: "Folder containing all product images" },
      { Field: "  images/product001.jpg", Required: "", Description: "Image files referenced in the image column" },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [
      { wch: 28 }, // Field
      { wch: 10 }, // Required
      { wch: 70 }  // Description
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="products-import-template.xlsx"');
    return res.send(buffer);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ success: false, message: 'Failed to generate template Excel file' });
  }
};

/**
 * Async Worker Function for Job Processing
 */
async function processBulkImportJob(jobId, zipPath, jobDir) {
  const job = bulkImportJobs.get(jobId);
  if (!job) return;

  const extractDir = path.join(jobDir, 'extracted');
  fs.mkdirSync(extractDir, { recursive: true });

  try {
    job.status = 'processing';

    // 1. Extract ZIP with Zip Slip prevention
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      const entryPath = entry.entryName;
      const targetPath = path.join(extractDir, entryPath);
      const normalizedTarget = path.normalize(targetPath);

      if (!normalizedTarget.startsWith(path.normalize(extractDir))) {
        throw new Error(`Security violation: Invalid zip path detected (${entryPath})`);
      }

      const parentDir = path.dirname(normalizedTarget);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      fs.writeFileSync(normalizedTarget, entry.getData());
    }

    // 2. Find products.xlsx & images folder
    const foundFiles = getAllFiles(extractDir);

    // Search for Excel file
    const excelFile = foundFiles.find(f => {
      const base = path.basename(f).toLowerCase();
      return (base === 'products.xlsx' || base === 'products.xls' || base.endsWith('.xlsx') || base.endsWith('.xls')) && !base.startsWith('~$');
    });

    if (!excelFile) {
      job.status = 'failed';
      job.summary = { error: '❌ Invalid ZIP structure. products.xlsx is missing.' };
      return;
    }

    // Search for images folder
    let imagesDir = null;
    const allDirs = getAllDirs(extractDir);
    const matchedDir = allDirs.find(d => path.basename(d).toLowerCase() === 'images');

    if (matchedDir) {
      imagesDir = matchedDir;
    } else {
      // Check if extracted directory itself contains images directly
      const hasImageFiles = foundFiles.some(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
      if (hasImageFiles) {
        imagesDir = extractDir;
      }
    }

    if (!imagesDir) {
      job.status = 'failed';
      job.summary = { error: '❌ Invalid ZIP structure. images folder is missing.' };
      return;
    }

    // 3. Read Excel data
    const workbook = XLSX.readFile(excelFile);
    const sheetName = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

    if (!rawRows || rawRows.length === 0) {
      job.status = 'failed';
      job.summary = { error: 'Excel file is empty' };
      return;
    }

    job.totalCount = rawRows.length;

    // 4a. Fetch all MongoDB categories for strict lookup (no auto-creation)
    const mongoCategories = await Category.find({});
    const categoryMap = new Map();
    mongoCategories.forEach(cat => {
      if (cat.name) {
        categoryMap.set(cat.name.trim().toLowerCase(), cat);
      }
    });

    // 4b. Fetch all MongoDB brands for case-insensitive lookup (no auto-creation)
    const mongoBrands = await Brand.find({});
    const brandMap = new Map();
    mongoBrands.forEach(b => {
      if (b.name) {
        brandMap.set(b.name.trim().toLowerCase(), b.name.trim());
      }
    });

    // Pre-load all existing SKUs from MongoDB for category-based SKU generation
    const allExistingProducts = await Product.find({}, 'sku').lean();
    const skuPool = new Set(allExistingProducts.map(p => p.sku).filter(Boolean));

    // List images in imagesDir for case-insensitive lookup
    const localImageFiles = getAllFiles(imagesDir);
    const imageMap = new Map();
    localImageFiles.forEach(imgPath => {
      imageMap.set(path.basename(imgPath).toLowerCase(), imgPath);
    });

    // 5. Controlled Concurrency Processing (Batch size: 5)
    const CONCURRENCY = 5;

    for (let i = 0; i < rawRows.length; i += CONCURRENCY) {
      const chunk = rawRows.slice(i, i + CONCURRENCY);

      await Promise.all(
        chunk.map(async (row, index) => {
          const rowNum = i + index + 2; // Row number in Excel (accounting for header row 1)

          try {
            // Helper to get case-insensitive row values
            const getVal = (...keys) => {
              for (const k of keys) {
                for (const rowKey of Object.keys(row)) {
                  if (rowKey.trim().toLowerCase() === k.toLowerCase() && row[rowKey] !== undefined && row[rowKey] !== null) {
                    return String(row[rowKey]).trim();
                  }
                }
              }
              return '';
            };

            const name = getVal('productName', 'name', 'product_name', 'title');
            const categoryName = getVal('category', 'categoryName', 'category_name');
            const priceStr = getVal('price', 'rate');
            const originalPriceStr = getVal('originalPrice', 'oldPrice', 'mrp');
            const discountStr = getVal('discount', 'discountPercent');
            const stockStr = getVal('stock', 'shopCount', 'quantity_stock');
            const description = getVal('description', 'desc', 'details');
            const imageFilename = getVal('image', 'imageName', 'photo', 'picture');
            const brand = getVal('brand', 'brandName');
            const rawSku = getVal('sku', 'productCode');
            const code = getVal('code', 'product_code');
            const wholesalePriceStr = getVal('wholesalePrice');
            const netRateStr = getVal('netRate');
            const storeStockPiecesStr = getVal('storeStockPieces');
            const godownStockCasesStr = getVal('godownStockCases');
            const piecesPerCaseStr = getVal('piecesPerCase');
            const godownStockPiecesStr = getVal('godownStockPieces');
            const minimumStockStr = getVal('minimumStock');
            const quantity = getVal('quantity', 'unit');
            const crackerTypeRaw = getVal('crackerType', 'type');
            const isSaiYogiVerifiedRaw = getVal('isSaiYogiVerified', 'verified', 'is_sai_yogi_verified');
            const hasDiscountRaw = getVal('hasDiscount', 'has_discount');
            const displayNetRateRaw = getVal('displayNetRate', 'display_net_rate');
            const ratingStr = getVal('rating', 'starRating', 'stars');
            const statusRaw = getVal('status', 'isActive');

            // --- Validation 1: Required Name ---
            if (!name) {
              throw new Error('Product name is required');
            }

            // --- Validation 2: Required Category & Strict Mongo Lookup ---
            if (!categoryName) {
              throw new Error('Category is required');
            }
            const matchedCategory = categoryMap.get(categoryName.trim().toLowerCase());
            if (!matchedCategory) {
              throw new Error(`Category '${categoryName}' not found. Please create it in Admin → Categories before importing.`);
            }

            // --- Validation 3: Required Price ---
            const price = Number(priceStr);
            if (isNaN(price) || price < 0) {
              throw new Error(`Invalid price value: '${priceStr}'`);
            }

            // --- Validation 4: Required Image Filename ---
            if (!imageFilename) {
              throw new Error('Image filename is required in Excel');
            }

            // --- Validation 5: Local Image Matching ---
            const cleanImageName = path.basename(imageFilename).toLowerCase();
            const localImgPath = imageMap.get(cleanImageName);

            if (!localImgPath || !fs.existsSync(localImgPath)) {
              throw new Error(`Image file '${imageFilename}' not found in images/ folder`);
            }

            // --- Validation 6: Duplicate Check (by name + category only, SKU is auto-generated) ---
            const existingProduct = await Product.findOne({
              name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') },
              category: matchedCategory._id
            });

            if (existingProduct) {
              throw new Error(`Product '${name}' already exists in category '${matchedCategory.name}'`);
            }

            // --- Step 7: Cloudinary Upload ---
            const imageBuffer = await fs.promises.readFile(localImgPath);
            const uploadRes = await uploadToCloudinary(imageBuffer, cleanImageName, 'products');

            if (!uploadRes || !uploadRes.url) {
              throw new Error('Cloudinary upload failed to return a secure URL');
            }

            // --- Step 8: Parse optional fields ---
            const originalPrice = originalPriceStr ? Number(originalPriceStr) : 0;
            const discount = discountStr ? Number(discountStr) : 0;
            const stock = stockStr ? Number(stockStr) : 0;
            const wholesalePrice = wholesalePriceStr ? Number(wholesalePriceStr) : 0;
            const netRate = netRateStr ? Number(netRateStr) : 0;
            const rating = ratingStr && !isNaN(Number(ratingStr)) ? Math.min(5, Math.max(1, Number(ratingStr))) : 5;
            const storeStockPieces = storeStockPiecesStr ? Number(storeStockPiecesStr) : stock;
            const godownStockCases = godownStockCasesStr ? Number(godownStockCasesStr) : 0;
            const piecesPerCase = piecesPerCaseStr ? Number(piecesPerCaseStr) : 1;
            const godownStockPieces = godownStockPiecesStr ? Number(godownStockPiecesStr) : 0;
            const minimumStock = minimumStockStr ? Number(minimumStockStr) : 0;

            let crackerType = 'Day Crackers';
            if (['Night Crackers', 'Kids Crackers', 'Gift Box'].includes(crackerTypeRaw)) {
              crackerType = crackerTypeRaw;
            }

            const hasDiscount = hasDiscountRaw
              ? (hasDiscountRaw.toLowerCase() === 'true' || hasDiscountRaw === '1')
              : (discount > 0 || originalPrice > price);

            const displayNetRate = displayNetRateRaw
              ? (displayNetRateRaw.toLowerCase() === 'true' || displayNetRateRaw === '1')
              : false;

            const isSaiYogiVerified = isSaiYogiVerifiedRaw
              ? (isSaiYogiVerifiedRaw.toLowerCase() === 'true' || isSaiYogiVerifiedRaw === '1')
              : true;

            const isActive = statusRaw ? statusRaw.toLowerCase() !== 'inactive' && statusRaw.toLowerCase() !== 'false' : true;

            // --- Step 9: Auto-generate SKU from category code (same logic as admin form) ---
            const catCode = matchedCategory.categoryCode || matchedCategory.name.slice(0, 3).toUpperCase();
            let autoSku;
            // Use a lock-free approach: generate from skuPool (DB + already assigned in this batch)
            autoSku = generateCategoryBasedSku(catCode, [...skuPool]);
            skuPool.add(autoSku); // Reserve immediately so concurrent rows don't collide

            // --- Step 10: Save Product to MongoDB ---
            const newProd = new Product({
              name,
              code: autoSku,
              sku: autoSku,
              category: matchedCategory._id,
              image: uploadRes.url,
              price,
              oldPrice: originalPrice > price ? originalPrice : undefined,
              hasDiscount: displayNetRate ? false : hasDiscount,
              displayNetRate,
              wholesalePrice,
              netRate,
              // Resolve brand name case-insensitively against existing brands
              brand: (brand ? (brandMap.get(brand.trim().toLowerCase()) || brand.trim()) : 'Sai Yogi Standard'),
              stock,
              storeStockPieces,
              godownStockCases,
              piecesPerCase,
              godownStockPieces,
              minimumStock,
              description,
              isActive,
              isSaiYogiVerified,
              rating,
              quantity,
              crackerType
            });

            await newProd.save();
            job.successCount++;

          } catch (err) {
            job.failedCount++;
            job.errors.push({
              row: rowNum,
              productName: row.productName || row.name || 'N/A',
              image: row.image || 'N/A',
              error: err.message || 'Unknown processing error'
            });
          } finally {
            job.processedCount++;
            job.percentage = Math.round((job.processedCount / job.totalCount) * 100);
          }
        })
      );
    }

    job.status = 'completed';
    job.completedAt = new Date();
    job.summary = {
      total: job.totalCount,
      imported: job.successCount,
      failed: job.failedCount
    };

  } catch (fatalError) {
    console.error('Fatal error in processBulkImportJob:', fatalError);
    job.status = 'failed';
    job.summary = { error: fatalError.message || 'Fatal error during import execution' };
  } finally {
    // Delete temp job directory on finish/failure
    try {
      if (fs.existsSync(jobDir)) {
        fs.rmSync(jobDir, { recursive: true, force: true });
        console.log(`✓ Cleaned up bulk import temp directory: ${jobDir}`);
      }
    } catch (cleanErr) {
      console.error(`Error cleaning up temp dir ${jobDir}:`, cleanErr);
    }
  }
}

// Utility: Recursively get all file paths
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

// Utility: Recursively get all directory paths
function getAllDirs(dirPath, arrayOfDirs = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfDirs.push(fullPath);
      arrayOfDirs = getAllDirs(fullPath, arrayOfDirs);
    }
  });
  return arrayOfDirs;
}
