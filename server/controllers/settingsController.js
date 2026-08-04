import Settings from '../models/Settings.js';
import { AppError } from '../middleware/errorHandler.js';

export const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const updateData = req.body;
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(updateData);
      await settings.save();
    } else {
      Object.assign(settings, updateData);
      await settings.save();
    }

    res.json({
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    next(error);
  }
};

export const getSiteInfo = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    const info = {
      siteName: settings.siteName,
      logo: settings.logo || '',
      favicon: settings.favicon || '',
      contact: settings.contact || {},
      socialLinks: settings.socialLinks || {},
      currency: settings.currency,
      discountPercent: settings.discountPercent,
      minimumPurchaseAmount: settings.minimumPurchaseAmount,
      minPurchaseOutsideTN: settings.minPurchaseOutsideTN,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      deliveryCharge: settings.deliveryCharge,
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage || '',
      news: settings.news || '',
      billing: settings.billing || {},
      enablePackingCharge: settings.enablePackingCharge !== undefined ? settings.enablePackingCharge : true
    };

    res.json(info);
  } catch (error) {
    next(error);
  }
};

export const getPricingSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    const pricing = {
      discountPercent: settings.discountPercent,
      minimumPurchaseAmount: settings.minimumPurchaseAmount,
      minPurchaseOutsideTN: settings.minPurchaseOutsideTN,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      deliveryCharge: settings.deliveryCharge
    };

    res.json(pricing);
  } catch (error) {
    next(error);
  }
};
