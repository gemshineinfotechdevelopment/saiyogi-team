import ChitSubscription from '../models/ChitSubscription.js';
import Customer from '../models/Customer.js';
import { AppError } from '../middleware/errorHandler.js';

// SUBMIT Chit Subscription / Application
export const submitChitSubscription = async (req, res, next) => {
  try {
    const { schemeId, schemeName, name, phone, email, location } = req.body;

    if (!schemeName || !schemeName.trim()) {
      return next(new AppError('Scheme selection is required', 400));
    }
    if (!name || !name.trim()) {
      return next(new AppError('Name is required', 400));
    }
    if (!phone || !phone.trim()) {
      return next(new AppError('Mobile number is required', 400));
    }
    if (!location || !location.trim()) {
      return next(new AppError('Location is required', 400));
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return next(new AppError('Valid 10-digit mobile number required', 400));
    }

    // Check if subscription already exists for this phone & scheme
    let subscription = await ChitSubscription.findOne({
      phone: cleanPhone,
      schemeName: schemeName.trim()
    });

    if (subscription) {
      // Update existing record rather than creating a duplicate
      subscription.name = name.trim();
      subscription.location = location.trim();
      if (email) subscription.email = (email || '').trim().toLowerCase();
    } else {
      subscription = new ChitSubscription({
        schemeId: schemeId || null,
        schemeName: schemeName.trim(),
        name: name.trim(),
        phone: cleanPhone,
        email: (email || '').trim().toLowerCase(),
        location: location.trim(),
        status: 'Pending',
        approvalStatus: 'Pending',
        monthsPaid: 0,
        monthlyPayments: []
      });
    }

    const saved = await subscription.save();

    // Also track/create customer record with source 'chit_scheme'
    try {
      let customer = await Customer.findOne({ phone: cleanPhone });
      if (!customer) {
        customer = new Customer({
          name: name.trim(),
          phone: cleanPhone,
          email: (email || '').trim().toLowerCase(),
          sources: ['chit_scheme'],
          deliveryAddress: { fullAddress: location.trim() }
        });
      } else {
        if (name && (customer.name === 'Customer' || !customer.name)) {
          customer.name = name.trim();
        }
        if (email && !customer.email) {
          customer.email = (email || '').trim().toLowerCase();
        }
        if (!customer.sources.includes('chit_scheme')) {
          customer.sources.push('chit_scheme');
        }
      }
      await customer.save();
    } catch (custErr) {
      console.warn('Failed to sync customer in chit subscription:', custErr);
    }

    res.status(201).json({
      message: 'Chit scheme subscription submitted successfully',
      subscription: saved
    });
  } catch (error) {
    next(error);
  }
};

// GET all Chit Subscriptions (for Admin)
export const getChitSubscriptions = async (req, res, next) => {
  try {
    const rawSubscriptions = await ChitSubscription.find().sort({ createdAt: -1 });
    
    // Deduplicate any existing duplicates in DB by phone + schemeName
    const map = new Map();
    rawSubscriptions.forEach(sub => {
      const key = `${sub.phone}_${String(sub.schemeName || '').trim().toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, sub);
      }
    });

    res.json(Array.from(map.values()));
  } catch (error) {
    next(error);
  }
};

// GET single Chit Subscription by ID
export const getChitSubscriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await ChitSubscription.findById(id);
    if (!subscription) {
      return next(new AppError('Chit subscription not found', 404));
    }
    res.json(subscription);
  } catch (error) {
    next(error);
  }
};

// UPDATE Chit Subscription Status / Approval / Stage
export const updateChitSubscriptionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, approvalStatus, stage } = req.body;

    const subscription = await ChitSubscription.findById(id);
    if (!subscription) {
      return next(new AppError('Chit subscription not found', 404));
    }

    if (stage && ['Pending Approval', 'Approved', 'Payment Started', 'In Progress', 'Almost Completed', 'Completed', 'Rejected'].includes(stage)) {
      subscription.stage = stage;
    }

    if (approvalStatus) {
      if (!['Pending', 'Approved', 'Rejected'].includes(approvalStatus)) {
        return next(new AppError('Invalid approvalStatus. Allowed: Pending, Approved, Rejected', 400));
      }
      subscription.approvalStatus = approvalStatus;
      if (approvalStatus === 'Approved' && subscription.status === 'Pending') {
        subscription.status = 'Approved';
      } else if (approvalStatus === 'Rejected') {
        subscription.status = 'Rejected';
      }
    }

    if (status) {
      if (!['Pending', 'Approved', 'Rejected', 'Paid'].includes(status)) {
        return next(new AppError('Invalid status', 400));
      }
      subscription.status = status;
      if (status === 'Paid') {
        subscription.paidAt = new Date();
      }
    }

    const updated = await subscription.save();
    res.json({
      message: `Subscription updated successfully`,
      subscription: updated
    });
  } catch (error) {
    next(error);
  }
};

// Helper to update subscription stage automatically
const calculateSubscriptionStage = (subscription, totalMonths = 11) => {
  if (subscription.approvalStatus === 'Pending') {
    return 'Pending Approval';
  }
  if (subscription.approvalStatus === 'Rejected') {
    return 'Rejected';
  }
  const paidCount = subscription.monthsPaid || 0;
  if (paidCount === 0) {
    return 'Payment Started';
  }
  if (paidCount >= totalMonths) {
    return 'Completed';
  }
  if (paidCount >= Math.ceil(totalMonths * 0.75)) {
    return 'Almost Completed';
  }
  return 'In Progress';
};

// APPROVE Chit Subscription
export const approveChitSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await ChitSubscription.findById(id);
    if (!subscription) {
      return next(new AppError('Chit subscription not found', 404));
    }

    subscription.approvalStatus = 'Approved';
    subscription.status = 'Approved';
    subscription.stage = calculateSubscriptionStage(subscription);
    const updated = await subscription.save();

    res.json({
      message: 'Chit subscription approved successfully! Monthly payment enabled.',
      subscription: updated
    });
  } catch (error) {
    next(error);
  }
};

// REJECT Chit Subscription
export const rejectChitSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await ChitSubscription.findById(id);
    if (!subscription) {
      return next(new AppError('Chit subscription not found', 404));
    }

    subscription.approvalStatus = 'Rejected';
    subscription.status = 'Rejected';
    subscription.stage = 'Rejected';
    const updated = await subscription.save();

    res.json({
      message: 'Chit subscription rejected.',
      subscription: updated
    });
  } catch (error) {
    next(error);
  }
};

// MARK MONTHLY PAYMENT AS READ / PAID (For Approved Users)
export const markMonthlyPaymentRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes, paymentMethod, transactionNumber, paymentDate, amount } = req.body;

    const subscription = await ChitSubscription.findById(id);
    if (!subscription) {
      return next(new AppError('Chit subscription not found', 404));
    }

    if (subscription.approvalStatus !== 'Approved' && subscription.status !== 'Approved' && subscription.status !== 'Paid') {
      return next(new AppError('Only approved chit subscriptions can be marked for monthly payment', 400));
    }

    const nextMonth = (subscription.monthsPaid || 0) + 1;
    subscription.monthsPaid = nextMonth;
    subscription.status = 'Paid';
    subscription.paidAt = paymentDate ? new Date(paymentDate) : new Date();

    if (!subscription.monthlyPayments) {
      subscription.monthlyPayments = [];
    }

    subscription.monthlyPayments.push({
      monthNumber: nextMonth,
      status: 'Paid',
      paidAt: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || 'Cash',
      transactionNumber: transactionNumber || '',
      amount: amount ? parseFloat(amount) : 0,
      markedAsRead: true,
      notes: notes || `Month ${nextMonth} payment marked as paid by admin`
    });

    subscription.stage = calculateSubscriptionStage(subscription);
    const updated = await subscription.save();

    res.json({
      message: `Month ${nextMonth} payment marked as paid successfully!`,
      subscription: updated
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE A SPECIFIC MONTH'S PAYMENT STATUS (Paid / Late Pay / Pending)
export const updateMonthPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { monthNumber, monthName, status, notes, paymentMethod, transactionNumber, paymentDate, dueDate, amount } = req.body;

    if (!monthNumber || monthNumber < 1) {
      return next(new AppError('Valid monthNumber is required', 400));
    }
    const validPaidStatuses = ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'];
    if (!['Pending', ...validPaidStatuses].includes(status)) {
      return next(new AppError('Invalid payment status', 400));
    }

    const subscription = await ChitSubscription.findById(id);
    if (!subscription) {
      return next(new AppError('Chit subscription not found', 404));
    }

    if (subscription.approvalStatus !== 'Approved' && subscription.status !== 'Approved' && subscription.status !== 'Paid') {
      return next(new AppError('Payment tracking is only allowed for Approved customers', 400));
    }

    if (!subscription.monthlyPayments) {
      subscription.monthlyPayments = [];
    }

    let paymentIndex = subscription.monthlyPayments.findIndex(p => p.monthNumber === parseInt(monthNumber, 10));
    if (paymentIndex > -1) {
      subscription.monthlyPayments[paymentIndex].status = status;
      if (monthName) subscription.monthlyPayments[paymentIndex].monthName = monthName;
      if (dueDate) subscription.monthlyPayments[paymentIndex].dueDate = dueDate;
      if (amount !== undefined) subscription.monthlyPayments[paymentIndex].amount = parseFloat(amount);
      if (paymentMethod !== undefined) subscription.monthlyPayments[paymentIndex].paymentMethod = paymentMethod;
      if (transactionNumber !== undefined) subscription.monthlyPayments[paymentIndex].transactionNumber = transactionNumber;
      if (notes !== undefined) subscription.monthlyPayments[paymentIndex].notes = notes;
      
      if (validPaidStatuses.includes(status)) {
        subscription.monthlyPayments[paymentIndex].paidAt = paymentDate ? new Date(paymentDate) : new Date();
      } else {
        subscription.monthlyPayments[paymentIndex].paidAt = null;
      }
    } else {
      subscription.monthlyPayments.push({
        monthNumber: parseInt(monthNumber, 10),
        monthName: monthName || `Month ${monthNumber}`,
        dueDate: dueDate || '',
        amount: amount ? parseFloat(amount) : 0,
        status: status,
        paidAt: validPaidStatuses.includes(status) ? (paymentDate ? new Date(paymentDate) : new Date()) : null,
        paymentMethod: paymentMethod || '',
        transactionNumber: transactionNumber || '',
        markedAsRead: true,
        notes: notes || ''
      });
    }

    // Recalculate total months paid (Paid or Late Pay or Advanced Payment or On-time Payment or Delay Payment)
    const paidCount = subscription.monthlyPayments.filter(p => validPaidStatuses.includes(p.status)).length;
    subscription.monthsPaid = paidCount;
    subscription.stage = calculateSubscriptionStage(subscription);

    const updated = await subscription.save();
    res.json({
      message: `Payment status for ${monthName || 'Month ' + monthNumber} updated to ${status}`,
      subscription: updated
    });
  } catch (error) {
    next(error);
  }
};

// DELETE Chit Subscription
export const deleteChitSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subscription = await ChitSubscription.findById(id);
    if (!subscription) {
      return next(new AppError('Chit subscription not found', 404));
    }

    await subscription.deleteOne();
    res.json({ message: 'Chit subscription deleted successfully' });
  } catch (error) {
    next(error);
  }
};
