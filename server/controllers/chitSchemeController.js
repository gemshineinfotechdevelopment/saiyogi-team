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
    const {
      title,
      schemeName,
      description,
      displayOrder,
      isActive,
      startDate,
      totalMonths,
      numberOfMonths,
      dueDateDay,
      paymentDueDay,
      monthlyAmount,
      status
    } = req.body;

    const finalTitle = (schemeName || title || '').trim();
    const finalMonths = numberOfMonths ? parseInt(numberOfMonths, 10) : (totalMonths ? parseInt(totalMonths, 10) : 11);
    const finalDueDay = paymentDueDay ? parseInt(paymentDueDay, 10) : (dueDateDay ? parseInt(dueDateDay, 10) : 10);
    const finalStatus = status && ['Upcoming', 'Active', 'Completed', 'Closed'].includes(status) ? status : 'Active';

    const imageResult = await processChitImageUpload(req);
    const imageUrl = imageResult?.url || '';

    const chitScheme = new ChitScheme({
      title: finalTitle,
      description: (description || '').trim(),
      url: imageUrl,
      public_id: imageResult?.public_id || '',
      displayOrder: displayOrder ? parseInt(displayOrder, 10) : 0,
      startDate: startDate ? String(startDate).trim() : '',
      totalMonths: finalMonths,
      dueDateDay: finalDueDay,
      monthlyAmount: monthlyAmount ? parseFloat(monthlyAmount) : 0,
      status: finalStatus,
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
    const {
      title,
      schemeName,
      description,
      displayOrder,
      isActive,
      startDate,
      totalMonths,
      numberOfMonths,
      dueDateDay,
      paymentDueDay,
      monthlyAmount,
      status
    } = req.body;

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

    const newTitle = schemeName || title;
    if (newTitle !== undefined) chitScheme.title = String(newTitle).trim();
    if (description !== undefined) chitScheme.description = String(description).trim();
    if (displayOrder !== undefined) chitScheme.displayOrder = parseInt(displayOrder, 10);
    if (startDate !== undefined) chitScheme.startDate = String(startDate).trim();

    const newMonths = numberOfMonths || totalMonths;
    if (newMonths !== undefined) chitScheme.totalMonths = parseInt(newMonths, 10);

    const newDueDay = paymentDueDay || dueDateDay;
    if (newDueDay !== undefined) chitScheme.dueDateDay = parseInt(newDueDay, 10);

    if (monthlyAmount !== undefined) chitScheme.monthlyAmount = parseFloat(monthlyAmount);
    if (status && ['Upcoming', 'Active', 'Completed', 'Closed'].includes(status)) chitScheme.status = status;
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
