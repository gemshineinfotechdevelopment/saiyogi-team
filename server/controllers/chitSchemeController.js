import ChitScheme from '../models/ChitScheme.js';
import { AppError } from '../middleware/errorHandler.js';
import { uploadToBoth, deleteFromBoth } from '../utils/upload-manager.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// Process Chit Scheme Image Upload (File or Base64 data URL)
const processChitImageUpload = async (req) => {
  if (req.file) {
    const uploadResult = await uploadToBoth(req.file, 'chit_schemes');
    return { url: uploadResult.url, public_id: uploadResult.public_id };
  }

  const imageInput = req.body.url || req.body.image || req.body.base64;
  if (imageInput && typeof imageInput === 'string' && imageInput.startsWith('data:image')) {
    const matches = imageInput.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (matches) {
      const ext = matches[1] || 'png';
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `chit_${Date.now()}.${ext}`;
      const uploadResult = await uploadToCloudinary(buffer, filename, 'chit_schemes');
      return { url: uploadResult.url, public_id: uploadResult.public_id };
    }
  }

  if (typeof imageInput === 'string' && imageInput.trim().length > 0) {
    return { url: imageInput.trim(), public_id: '' };
  }

  return null;
};

// GET all chit schemes
export const getChitSchemes = async (req, res, next) => {
  try {
    const chitSchemes = await ChitScheme.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 });
    res.json(chitSchemes);
  } catch (error) {
    next(error);
  }
};

// GET all chit schemes for Admin (including inactive)
export const getAdminChitSchemes = async (req, res, next) => {
  try {
    const chitSchemes = await ChitScheme.find().sort({ displayOrder: 1, createdAt: -1 });
    res.json(chitSchemes);
  } catch (error) {
    next(error);
  }
};

// CREATE chit scheme
export const createChitScheme = async (req, res, next) => {
  try {
    const { title, description, displayOrder, isActive } = req.body;

    const imageResult = await processChitImageUpload(req);
    if (!imageResult || !imageResult.url) {
      return next(new AppError('Chit Scheme image is required', 400));
    }

    const chitScheme = new ChitScheme({
      title: (title || '').trim(),
      description: (description || '').trim(),
      url: imageResult.url,
      public_id: imageResult.public_id || '',
      displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
      isActive: typeof isActive === 'boolean' ? isActive : isActive !== 'false'
    });

    const saved = await chitScheme.save();
    res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
};

// UPDATE chit scheme
export const updateChitScheme = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, displayOrder, isActive } = req.body;

    const chitScheme = await ChitScheme.findById(id);
    if (!chitScheme) {
      return next(new AppError('Chit Scheme not found', 404));
    }

    if (req.file || req.body.image || req.body.base64 || (req.body.url && req.body.url !== chitScheme.url)) {
      const imageResult = await processChitImageUpload(req);
      if (imageResult && imageResult.url) {
        // If old image exists and is different, attempt deletion
        if (chitScheme.url && chitScheme.url !== imageResult.url) {
          await deleteFromBoth(chitScheme.url, chitScheme.public_id).catch(() => {});
        }
        chitScheme.url = imageResult.url;
        chitScheme.public_id = imageResult.public_id || '';
      }
    }

    if (title !== undefined) chitScheme.title = title.trim();
    if (description !== undefined) chitScheme.description = description.trim();
    if (displayOrder !== undefined) chitScheme.displayOrder = parseInt(displayOrder, 10);
    if (isActive !== undefined) chitScheme.isActive = typeof isActive === 'boolean' ? isActive : isActive !== 'false';

    const updated = await chitScheme.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE chit scheme
export const deleteChitScheme = async (req, res, next) => {
  try {
    const { id } = req.params;
    const chitScheme = await ChitScheme.findById(id);

    if (!chitScheme) {
      return next(new AppError('Chit Scheme not found', 404));
    }

    if (chitScheme.url) {
      await deleteFromBoth(chitScheme.url, chitScheme.public_id).catch(() => {});
    }

    await chitScheme.deleteOne();
    res.json({ message: 'Chit Scheme deleted successfully' });
  } catch (error) {
    next(error);
  }
};
