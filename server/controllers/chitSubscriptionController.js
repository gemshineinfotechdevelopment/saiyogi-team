import mongoose from 'mongoose';
import ChitSubscription from '../models/ChitSubscription.js';
import Customer from '../models/Customer.js';
import Counter from '../models/Counter.js';
import { AppError } from '../middleware/errorHandler.js';

// Helper to generate unique sequential Application Number (e.g. SY-APP-00001)
export const getNextApplicationNumber = async () => {
  try {
    const counter = await Counter.findByIdAndUpdate(
      'chitApplicationNumber',
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const seq = counter?.seq || Math.floor(1000 + Math.random() * 9000);
    return `SY-APP-${String(seq).padStart(5, '0')}`;
  } catch (err) {
    return `SY-APP-${Date.now().toString().slice(-6)}`;
  }
};

// Helper to generate unique sequential Receipt Number (e.g. SY-CHIT-00001)
export const getNextReceiptNumber = async () => {
  try {
    const counter = await Counter.findByIdAndUpdate(
      'chitReceiptNumber',
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const seq = counter?.seq || Math.floor(1000 + Math.random() * 9000);
    return `SY-CHIT-${String(seq).padStart(5, '0')}`;
  } catch (err) {
    return `SY-CHIT-${Date.now().toString().slice(-6)}`;
  }
};

// Helper to calculate stage for a subscription or scheme
export const calculateStage = (item, totalMonths = 10) => {
  if (item.approvalStatus === 'Pending' || item.status === 'Pending') {
    return 'Pending Approval';
  }
  if (item.approvalStatus === 'Rejected' || item.status === 'Rejected') {
    return 'Rejected';
  }
  const paidCount = item.monthsPaid || item.paidInstallments || 0;
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

// Normalizes a raw subscription document into consistent multi-scheme format
export const normalizeSubscriptionDoc = (sub) => {
  const doc = sub.toObject ? sub.toObject() : { ...sub };

  if (!Array.isArray(doc.schemes) || doc.schemes.length === 0) {
    let monthly = doc.monthlyAmount || 0;
    if (monthly === 0 && doc.schemeName) {
      const match = doc.schemeName.match(/\d+/);
      if (match) monthly = parseInt(match[0], 10);
    }
    const persons = doc.personCount || 1;
    const totalMonthly = monthly * persons;
    const duration = 10;
    const totalScheme = totalMonthly * duration;
    const validPaidStatuses = ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'];
    const paidLogs = (doc.monthlyPayments || []).filter(p => validPaidStatuses.includes(p.status));
    const paidAmount = paidLogs.reduce((sum, p) => sum + (p.amount || monthly), 0);

    doc.schemes = [
      {
        _id: doc._id,
        schemeId: doc.schemeId,
        schemeName: doc.schemeName || 'Chit Scheme',
        monthlyAmountPerPerson: monthly,
        monthlyAmount: monthly,
        personCount: persons,
        totalMonthlyAmount: totalMonthly,
        durationMonths: duration,
        totalMonths: duration,
        dueDateDay: 10,
        totalSchemeAmount: totalScheme,
        paidAmount: paidAmount,
        remainingAmount: Math.max(0, totalScheme - paidAmount),
        monthsPaid: doc.monthsPaid || paidLogs.length,
        paidInstallments: doc.monthsPaid || paidLogs.length,
        status: doc.status || 'Pending',
        approvalStatus: doc.approvalStatus || 'Pending',
        stage: doc.stage || 'Pending Approval',
        monthlyPayments: doc.monthlyPayments || []
      }
    ];

    doc.totalPersons = persons;
    doc.combinedMonthlyAmount = totalMonthly;
    doc.combinedGrandTotal = totalScheme;
    doc.totalPaidAmount = paidAmount;
    doc.remainingGrandTotal = Math.max(0, totalScheme - paidAmount);
  } else {
    // Ensure all computed fields on schemes are present
    let sumPersons = 0;
    let sumMonthly = 0;
    let sumGrand = 0;
    let sumPaid = 0;

    doc.schemes = doc.schemes.map((sch) => {
      const persons = Math.max(1, sch.personCount || 1);
      let monthly = sch.monthlyAmountPerPerson || sch.monthlyAmount || 0;
      if (monthly === 0 && sch.schemeName) {
        const match = sch.schemeName.match(/\d+/);
        if (match) monthly = parseInt(match[0], 10);
      }
      const duration = sch.durationMonths || sch.totalMonths || 10;
      const totalMonthly = monthly * persons;
      const totalScheme = totalMonthly * duration;
      const validPaidStatuses = ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'];
      const paidLogs = (sch.monthlyPayments || []).filter(p => validPaidStatuses.includes(p.status));
      const paidAmount = paidLogs.reduce((sum, p) => sum + (p.amount || p.paidAmount || totalMonthly), 0);

      sumPersons += persons;
      sumMonthly += totalMonthly;
      sumGrand += totalScheme;
      sumPaid += paidAmount;

      return {
        ...sch,
        personCount: persons,
        monthlyAmountPerPerson: monthly,
        monthlyAmount: monthly,
        totalMonthlyAmount: totalMonthly,
        durationMonths: duration,
        totalMonths: duration,
        totalSchemeAmount: totalScheme,
        paidAmount: paidAmount,
        remainingAmount: Math.max(0, totalScheme - paidAmount),
        monthsPaid: paidLogs.length,
        paidInstallments: paidLogs.length,
        stage: calculateStage(sch, duration)
      };
    });

    doc.totalPersons = sumPersons;
    doc.combinedMonthlyAmount = sumMonthly;
    doc.combinedGrandTotal = sumGrand;
    doc.totalPaidAmount = sumPaid;
    doc.remainingGrandTotal = Math.max(0, sumGrand - sumPaid);
  }

  return doc;
};

// SUBMIT Chit Subscription / Bulk Application (1 or more schemes, multiple persons)
export const submitChitSubscription = async (req, res, next) => {
  try {
    const { name, phone, email, location, schemes, schemeName, schemeId, monthlyAmount, personCount } = req.body;

    if (!name || !name.trim()) {
      return next(new AppError('Full name is required', 400));
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

    // Build the list of schemes to be enrolled
    let normalizedSchemes = [];

    if (Array.isArray(schemes) && schemes.length > 0) {
      schemes.forEach((sch) => {
        const title = (sch.schemeName || sch.title || '').trim();
        if (!title) return;
        const count = Math.max(1, parseInt(sch.personCount, 10) || 1);
        let monthly = parseFloat(sch.monthlyAmountPerPerson || sch.monthlyAmount) || 0;
        if (monthly === 0 && title) {
          const match = title.match(/\d+/);
          if (match) monthly = parseInt(match[0], 10);
        }
        const duration = parseInt(sch.durationMonths || sch.totalMonths, 10) || 10;
        const dueDay = parseInt(sch.dueDateDay, 10) || 10;
        const validSchemeId = (sch.schemeId && mongoose.Types.ObjectId.isValid(sch.schemeId)) ? sch.schemeId : null;

        normalizedSchemes.push({
          schemeId: validSchemeId,
          schemeName: title,
          monthlyAmountPerPerson: monthly,
          monthlyAmount: monthly,
          personCount: count,
          totalMonthlyAmount: monthly * count,
          durationMonths: duration,
          totalMonths: duration,
          dueDateDay: dueDay,
          totalSchemeAmount: monthly * count * duration,
          paidAmount: 0,
          remainingAmount: monthly * count * duration,
          monthsPaid: 0,
          paidInstallments: 0,
          status: 'Pending',
          approvalStatus: 'Pending',
          stage: 'Pending Approval',
          monthlyPayments: []
        });
      });
    } else if (schemeName && schemeName.trim()) {
      // Legacy single scheme payload fallback
      const title = schemeName.trim();
      const count = Math.max(1, parseInt(personCount, 10) || 1);
      let monthly = parseFloat(monthlyAmount) || 0;
      if (monthly === 0 && title) {
        const match = title.match(/\d+/);
        if (match) monthly = parseInt(match[0], 10);
      }
      const duration = 10;
      const validSchemeId = (schemeId && mongoose.Types.ObjectId.isValid(schemeId)) ? schemeId : null;

      normalizedSchemes.push({
        schemeId: validSchemeId,
        schemeName: title,
        monthlyAmountPerPerson: monthly,
        monthlyAmount: monthly,
        personCount: count,
        totalMonthlyAmount: monthly * count,
        durationMonths: duration,
        totalMonths: duration,
        dueDateDay: 10,
        totalSchemeAmount: monthly * count * duration,
        paidAmount: 0,
        remainingAmount: monthly * count * duration,
        monthsPaid: 0,
        paidInstallments: 0,
        status: 'Pending',
        approvalStatus: 'Pending',
        stage: 'Pending Approval',
        monthlyPayments: []
      });
    }

    if (normalizedSchemes.length === 0) {
      return next(new AppError('At least one chit scheme must be selected', 400));
    }

    // Protection against rapid duplicate double-clicks (within 5 seconds)
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const recentDuplicate = await ChitSubscription.findOne({
      phone: cleanPhone,
      createdAt: { $gte: fiveSecondsAgo }
    });
    if (recentDuplicate) {
      return res.status(200).json({
        message: 'Application already received',
        subscription: normalizeSubscriptionDoc(recentDuplicate)
      });
    }

    // Generate unique application number
    const appNumber = await getNextApplicationNumber();

    // Calculate aggregated totals
    const totalPersons = normalizedSchemes.reduce((sum, s) => sum + s.personCount, 0);
    const combinedMonthly = normalizedSchemes.reduce((sum, s) => sum + s.totalMonthlyAmount, 0);
    const combinedGrand = normalizedSchemes.reduce((sum, s) => sum + s.totalSchemeAmount, 0);

    const newSubscription = new ChitSubscription({
      applicationNumber: appNumber,
      name: name.trim(),
      phone: cleanPhone,
      email: (email || '').trim().toLowerCase(),
      location: location.trim(),
      totalPersons,
      combinedMonthlyAmount: combinedMonthly,
      combinedGrandTotal: combinedGrand,
      totalPaidAmount: 0,
      remainingGrandTotal: combinedGrand,
      status: 'Pending',
      approvalStatus: 'Pending',
      stage: 'Pending Approval',
      schemes: normalizedSchemes,
      // Legacy compatibility
      schemeId: normalizedSchemes[0]?.schemeId || null,
      schemeName: normalizedSchemes[0]?.schemeName || '',
      personCount: normalizedSchemes[0]?.personCount || 1,
      monthlyAmount: normalizedSchemes[0]?.totalMonthlyAmount || 0,
      monthsPaid: 0,
      monthlyPayments: []
    });

    const saved = await newSubscription.save();

    // Sync Customer in Customer model with source 'chit_scheme'
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
      message: 'Chit scheme application submitted successfully! 🎉',
      subscription: normalizeSubscriptionDoc(saved)
    });
  } catch (error) {
    next(error);
  }
};

// GET all Chit Subscriptions (Returns all applications without deduplicating by phone)
export const getChitSubscriptions = async (req, res, next) => {
  try {
    const rawSubscriptions = await ChitSubscription.find().sort({ createdAt: -1, updatedAt: -1 });
    const normalized = rawSubscriptions.map(sub => normalizeSubscriptionDoc(sub));
    res.json(normalized);
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
    res.json(normalizeSubscriptionDoc(subscription));
  } catch (error) {
    next(error);
  }
};

// APPROVE Chit Subscription (Whole application or specific scheme)
export const approveChitSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schemeId } = req.body || req.query;

    const subscription = await ChitSubscription.findById(id);
    if (!subscription) {
      return next(new AppError('Chit subscription not found', 404));
    }

    if (schemeId && Array.isArray(subscription.schemes) && subscription.schemes.length > 0) {
      // Approve specific scheme
      const target = subscription.schemes.find(
        s => String(s._id) === String(schemeId) || String(s.schemeId) === String(schemeId) || s.schemeName === schemeId
      );
      if (target) {
        target.approvalStatus = 'Approved';
        target.status = 'Approved';
        target.stage = calculateStage(target, target.durationMonths || 10);
      }
    } else {
      // Approve all schemes and application
      subscription.approvalStatus = 'Approved';
      subscription.status = 'Approved';
      if (Array.isArray(subscription.schemes)) {
        subscription.schemes.forEach(sch => {
          sch.approvalStatus = 'Approved';
          sch.status = 'Approved';
          sch.stage = calculateStage(sch, sch.durationMonths || 10);
        });
      }
    }

    // If at least one scheme is approved, application is Approved
    if (subscription.schemes && subscription.schemes.some(s => s.approvalStatus === 'Approved')) {
      subscription.approvalStatus = 'Approved';
      subscription.status = 'Approved';
    }

    subscription.markModified('schemes');
    const updated = await subscription.save();

    res.json({
      message: 'Chit application approved successfully! Monthly payment enabled.',
      subscription: normalizeSubscriptionDoc(updated)
    });
  } catch (error) {
    next(error);
  }
};

// REJECT Chit Subscription (Whole application or specific scheme)
export const rejectChitSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schemeId } = req.body || req.query;

    const subscription = await ChitSubscription.findById(id);
    if (!subscription) {
      return next(new AppError('Chit subscription not found', 404));
    }

    if (schemeId && Array.isArray(subscription.schemes) && subscription.schemes.length > 0) {
      const target = subscription.schemes.find(
        s => String(s._id) === String(schemeId) || String(s.schemeId) === String(schemeId) || s.schemeName === schemeId
      );
      if (target) {
        target.approvalStatus = 'Rejected';
        target.status = 'Rejected';
        target.stage = 'Rejected';
      }
    } else {
      subscription.approvalStatus = 'Rejected';
      subscription.status = 'Rejected';
      subscription.stage = 'Rejected';
      if (Array.isArray(subscription.schemes)) {
        subscription.schemes.forEach(sch => {
          sch.approvalStatus = 'Rejected';
          sch.status = 'Rejected';
          sch.stage = 'Rejected';
        });
      }
    }

    subscription.markModified('schemes');
    const updated = await subscription.save();

    res.json({
      message: 'Chit application rejected.',
      subscription: normalizeSubscriptionDoc(updated)
    });
  } catch (error) {
    next(error);
  }
};

// RECORD MONTHLY INSTALLMENT PAYMENT FOR A SCHEME (Auto Receipt Generation)
export const recordSchemePayment = async (req, res, next) => {
  try {
    const { id } = req.params; // Application ID
    const {
      schemeId,
      monthNumber,
      monthName,
      amount,
      paymentMethod,
      transactionNumber,
      paymentDate,
      notes
    } = req.body;

    if (!monthNumber || parseInt(monthNumber, 10) < 1) {
      return next(new AppError('Valid installment monthNumber is required', 400));
    }

    const mNum = parseInt(monthNumber, 10);
    const subscription = await ChitSubscription.findById(id);
    if (!subscription) {
      return next(new AppError('Chit application not found', 404));
    }

    // Find the target scheme in schemes array
    let targetScheme = null;
    if (Array.isArray(subscription.schemes) && subscription.schemes.length > 0) {
      if (schemeId) {
        targetScheme = subscription.schemes.find(
          s => String(s._id) === String(schemeId) || String(s.schemeId) === String(schemeId) || s.schemeName === schemeId
        );
      }
      if (!targetScheme) {
        targetScheme = subscription.schemes[0];
      }
    } else {
      // Legacy document: ensure schemes array is initialized
      const monthly = subscription.monthlyAmount || 0;
      const persons = subscription.personCount || 1;
      targetScheme = {
        schemeId: subscription.schemeId,
        schemeName: subscription.schemeName || 'Chit Scheme',
        monthlyAmountPerPerson: monthly,
        monthlyAmount: monthly,
        personCount: persons,
        totalMonthlyAmount: monthly * persons,
        durationMonths: 10,
        totalMonths: 10,
        dueDateDay: 10,
        totalSchemeAmount: monthly * persons * 10,
        paidAmount: 0,
        remainingAmount: monthly * persons * 10,
        monthsPaid: 0,
        paidInstallments: 0,
        status: subscription.status || 'Approved',
        approvalStatus: subscription.approvalStatus || 'Approved',
        stage: 'Payment Started',
        monthlyPayments: subscription.monthlyPayments || []
      };
      subscription.schemes = [targetScheme];
      targetScheme = subscription.schemes[0];
    }

    // Verify approval - if scheme or application was Pending, admin recording payment automatically approves it
    const isApproved = targetScheme.approvalStatus === 'Approved' || targetScheme.status === 'Approved' || subscription.approvalStatus === 'Approved';
    if (!isApproved) {
      targetScheme.approvalStatus = 'Approved';
      targetScheme.status = 'Approved';
      subscription.approvalStatus = 'Approved';
      subscription.status = 'Approved';
    }

    // RULE: Prevent duplicate installment payments (Test Case 8)
    const validPaidStatuses = ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'];
    const existingLog = (targetScheme.monthlyPayments || []).find(p => p.monthNumber === mNum);
    if (existingLog && validPaidStatuses.includes(existingLog.status)) {
      return next(new AppError(
        `Installment Month ${mNum} for ${targetScheme.schemeName} has already been paid on ${new Date(existingLog.paidAt || Date.now()).toLocaleDateString('en-IN')}${existingLog.receiptNumber ? ' with Receipt #' + existingLog.receiptNumber : ''}. Duplicate payment is not allowed.`,
        400
      ));
    }

    // Calculate amounts
    const persons = targetScheme.personCount || 1;
    const monthlyPerPerson = targetScheme.monthlyAmountPerPerson || targetScheme.monthlyAmount || 0;
    const expectedInstallment = monthlyPerPerson * persons;
    const receivedAmount = amount !== undefined && !isNaN(parseFloat(amount)) ? parseFloat(amount) : expectedInstallment;

    // Generate unique sequential receipt number (Test Case 5)
    const receiptNumber = await getNextReceiptNumber();
    const payDateObj = paymentDate ? new Date(paymentDate) : new Date();

    const paymentLog = {
      monthNumber: mNum,
      monthName: monthName || `Month ${mNum}`,
      expectedAmount: expectedInstallment,
      amount: receivedAmount,
      paidAmount: receivedAmount,
      status: 'Paid',
      paidAt: payDateObj,
      paymentMethod: paymentMethod || 'Cash',
      transactionNumber: transactionNumber || '',
      transactionId: transactionNumber || '',
      receiptNumber: receiptNumber,
      updatedBy: 'Admin',
      markedAsRead: true,
      notes: notes || `Installment for ${persons} person(s)`
    };

    if (!targetScheme.monthlyPayments) {
      targetScheme.monthlyPayments = [];
    }

    if (existingLog) {
      Object.assign(existingLog, paymentLog);
    } else {
      targetScheme.monthlyPayments.push(paymentLog);
    }

    // Recompute scheme paid stats
    const paidLogs = targetScheme.monthlyPayments.filter(p => validPaidStatuses.includes(p.status));
    targetScheme.monthsPaid = paidLogs.length;
    targetScheme.paidInstallments = paidLogs.length;
    targetScheme.paidAmount = paidLogs.reduce((sum, p) => sum + (p.amount || 0), 0);
    const duration = targetScheme.durationMonths || targetScheme.totalMonths || 10;
    targetScheme.remainingAmount = Math.max(0, (targetScheme.totalMonthlyAmount * duration) - targetScheme.paidAmount);
    targetScheme.status = 'Paid';
    targetScheme.stage = calculateStage(targetScheme, duration);

    // Save subscription (pre-save hook will update top-level aggregations)
    subscription.markModified('schemes');
    const saved = await subscription.save();
    const normalized = normalizeSubscriptionDoc(saved);
    const updatedTargetScheme = (normalized.schemes || []).find(s => String(s._id) === String(targetScheme._id)) || targetScheme;

    // Structured receipt payload returned to client
    const receiptData = {
      receiptNumber: (receiptNumber || '').replace(/^AB-CHIT-/i, 'SY-CHIT-'),
      applicationNumber: (subscription.applicationNumber || `SY-APP-${String(subscription._id).slice(-6)}`).replace(/^AB-APP-/i, 'SY-APP-'),
      customerName: subscription.name,
      phone: subscription.phone,
      email: subscription.email,
      location: subscription.location,
      schemeId: targetScheme.schemeId || targetScheme._id,
      schemeName: targetScheme.schemeName,
      personCount: persons,
      monthlyAmountPerPerson: monthlyPerPerson,
      expectedMonthlyAmount: expectedInstallment,
      amountReceived: receivedAmount,
      paymentMethod: paymentMethod || 'Cash',
      transactionId: transactionNumber || '',
      paymentDate: payDateObj.toISOString(),
      paymentStatus: 'PAID',
      installmentMonth: `Month ${mNum} / ${duration}`,
      monthNumber: mNum,
      totalPaidTillDate: updatedTargetScheme?.paidAmount || 0,
      remainingSchemeBalance: updatedTargetScheme?.remainingAmount || 0,
      totalMonths: duration,
      paidMonths: updatedTargetScheme?.monthsPaid || 0,
      schemesBreakdown: (normalized.schemes || []).map(s => {
        const rate = s.monthlyAmountPerPerson || s.monthlyAmount || 0;
        const count = s.personCount || 1;
        const subTotal = s.totalMonthlyAmount || (rate * count);
        return {
          schemeName: s.schemeName,
          rate,
          count,
          subTotal,
          monthlyAmountPerPerson: rate,
          personCount: count,
          totalMonthlyAmount: subTotal
        };
      }),
      totalPersons: (normalized.schemes || []).reduce((sum, s) => sum + (s.personCount || 1), 0),
      combinedMonthlyPayable: (normalized.schemes || []).reduce((sum, s) => sum + (s.totalMonthlyAmount || ((s.monthlyAmountPerPerson || 0) * (s.personCount || 1))), 0)
    };

    res.status(200).json({
      message: `Month ${mNum} installment recorded successfully! Receipt: ${receiptNumber}`,
      subscription: normalized,
      receipt: receiptData
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE SPECIFIC MONTH PAYMENT STATUS (Backward compatibility)
export const updateMonthPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { schemeId, monthNumber, monthName, status, notes, paymentMethod, transactionNumber, paymentDate, amount } = req.body;

    if (!monthNumber || monthNumber < 1) {
      return next(new AppError('Valid monthNumber is required', 400));
    }

    const subscription = await ChitSubscription.findById(id);
    if (!subscription) {
      return next(new AppError('Chit subscription not found', 404));
    }

    let targetScheme = null;
    if (Array.isArray(subscription.schemes) && subscription.schemes.length > 0) {
      if (schemeId) {
        targetScheme = subscription.schemes.find(
          s => String(s._id) === String(schemeId) || String(s.schemeId) === String(schemeId) || s.schemeName === schemeId
        );
      }
      if (!targetScheme) targetScheme = subscription.schemes[0];
    }

    const validPaidStatuses = ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'];

    if (targetScheme) {
      if (!targetScheme.monthlyPayments) targetScheme.monthlyPayments = [];
      const mNum = parseInt(monthNumber, 10);
      let pIdx = targetScheme.monthlyPayments.findIndex(p => p.monthNumber === mNum);

      if (pIdx > -1) {
        targetScheme.monthlyPayments[pIdx].status = status;
        if (monthName) targetScheme.monthlyPayments[pIdx].monthName = monthName;
        if (amount !== undefined) targetScheme.monthlyPayments[pIdx].amount = parseFloat(amount);
        if (paymentMethod !== undefined) targetScheme.monthlyPayments[pIdx].paymentMethod = paymentMethod;
        if (transactionNumber !== undefined) targetScheme.monthlyPayments[pIdx].transactionNumber = transactionNumber;
        if (notes !== undefined) targetScheme.monthlyPayments[pIdx].notes = notes;
        if (validPaidStatuses.includes(status)) {
          targetScheme.monthlyPayments[pIdx].paidAt = paymentDate ? new Date(paymentDate) : new Date();
          if (!targetScheme.monthlyPayments[pIdx].receiptNumber) {
            targetScheme.monthlyPayments[pIdx].receiptNumber = await getNextReceiptNumber();
          }
        }
      } else {
        const receiptNo = validPaidStatuses.includes(status) ? await getNextReceiptNumber() : '';
        targetScheme.monthlyPayments.push({
          monthNumber: mNum,
          monthName: monthName || `Month ${mNum}`,
          expectedAmount: targetScheme.totalMonthlyAmount || (targetScheme.monthlyAmountPerPerson * (targetScheme.personCount || 1)),
          amount: amount !== undefined ? parseFloat(amount) : targetScheme.totalMonthlyAmount,
          status,
          paidAt: validPaidStatuses.includes(status) ? (paymentDate ? new Date(paymentDate) : new Date()) : null,
          paymentMethod: paymentMethod || 'Cash',
          transactionNumber: transactionNumber || '',
          receiptNumber: receiptNo,
          notes: notes || ''
        });
      }
    }

    subscription.markModified('schemes');
    const updated = await subscription.save();
    res.json({
      message: `Payment status updated`,
      subscription: normalizeSubscriptionDoc(updated)
    });
  } catch (error) {
    next(error);
  }
};

// MARK MONTHLY PAYMENT READ
export const markMonthlyPaymentRead = async (req, res, next) => {
  return recordSchemePayment(req, res, next);
};

// UPDATE APPLICATION STATUS
export const updateChitSubscriptionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, approvalStatus, stage } = req.body;

    const subscription = await ChitSubscription.findById(id);
    if (!subscription) {
      return next(new AppError('Chit subscription not found', 404));
    }

    if (stage) subscription.stage = stage;
    if (approvalStatus) {
      subscription.approvalStatus = approvalStatus;
      if (Array.isArray(subscription.schemes)) {
        subscription.schemes.forEach(s => { s.approvalStatus = approvalStatus; });
      }
    }
    if (status) {
      subscription.status = status;
      if (Array.isArray(subscription.schemes)) {
        subscription.schemes.forEach(s => { s.status = status; });
      }
    }

    subscription.markModified('schemes');
    const updated = await subscription.save();
    res.json({
      message: 'Subscription updated successfully',
      subscription: normalizeSubscriptionDoc(updated)
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
    res.json({ message: 'Chit application deleted successfully' });
  } catch (error) {
    next(error);
  }
};
