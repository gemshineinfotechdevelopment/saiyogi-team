import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import {
  Image as ImageIcon, Upload, Trash2, AlertCircle, Edit2, FileText, Loader2, X, Users,
  CheckCircle2, Clock, Search, Filter, Phone, MapPin, Mail, RefreshCw, Check, XCircle,
  Eye, CheckCheck, Calendar, Plus, ArrowLeft, User, DollarSign, Award, ChevronRight, AlertTriangle,
  Share2, MessageCircle, Sparkles, FileSpreadsheet, ArrowDownUp, Gift, Receipt
} from "lucide-react";
import { calculatePaymentTimingStatus, getMonthTargetDate, getPaidHistoryList } from "@/lib/chitUtils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { exportChitSubscriptionsToExcel } from "@/lib/excelExport";
import { ExcelExportModal } from "@/components/admin/ExcelExportModal";
import { ChitReceiptModal, ChitReceiptData } from "@/components/admin/ChitReceiptModal";
import {
  uploadImageToCloudinary,
  getChitSchemes,
  createChitScheme,
  updateChitScheme,
  deleteChitScheme,
  ChitSchemeItem,
  getChitSubscriptions,
  updateChitSubscriptionStatus,
  approveChitSubscriptionApi,
  rejectChitSubscriptionApi,
  markMonthlyPaymentReadApi,
  updateMonthPaymentStatusApi,
  recordChitSchemePaymentApi,
  deleteChitSubscription,
  ChitSubscriptionItem,
  ChitSubscribedSchemeItem,
  MonthlyPaymentLog
} from "@/lib/api";

export interface ChitSchemeImage {
  id: string;
  url: string;
  title?: string;
  schemeName?: string;
  description?: string;
  startDate?: string;
  totalMonths?: number;
  numberOfMonths?: number;
  dueDateDay?: number;
  paymentDueDay?: number;
  monthlyAmount?: number;
  totalSchemeAmount?: number;
  totalAmount?: number;
  status?: 'Upcoming' | 'Active' | 'Completed' | 'Closed';
}

const generateScheduleForScheme = (
  startDateStr?: string,
  numberOfMonths: number = 9,
  dueDateDay: number = 10,
  monthlyAmount: number = 0
) => {
  let baseDate = new Date();
  if (startDateStr && startDateStr.trim()) {
    const parts = startDateStr.trim().split('-');
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        baseDate = new Date(y, m, 1);
      }
    } else {
      const parsed = new Date(startDateStr);
      if (!isNaN(parsed.getTime())) baseDate = parsed;
    }
  }

  const months = [];
  for (let i = 0; i < numberOfMonths; i++) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
    const monthName = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const dueDateStr = `Before ${dueDateDay}th of ${monthName}`;
    months.push({
      monthNumber: i + 1,
      monthName,
      dueDateStr,
      amount: monthlyAmount
    });
  }
  return months;
};

const AdminChitScheme: React.FC = () => {
  // State: Schemes & Subscriptions
  const [schemes, setSchemes] = useState<ChitSchemeImage[]>([]);
  const [subscriptions, setSubscriptions] = useState<ChitSubscriptionItem[]>([]);
  const [loadingSchemes, setLoadingSchemes] = useState(true);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  // Filters & Search for Applications
  const [searchQuery, setSearchQuery] = useState("");
  const [schemeFilter, setSchemeFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState<"all" | "Pending" | "Approved" | "Rejected">("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "Paid" | "Pending">("all");
  const [dateSortOrder, setDateSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Create Scheme Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadStartDate, setUploadStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadTotalMonths, setUploadTotalMonths] = useState("9");
  const [uploadDueDateDay, setUploadDueDateDay] = useState("10");
  const [uploadMonthlyAmount, setUploadMonthlyAmount] = useState("2000");
  const [uploadStatus, setUploadStatus] = useState<'Upcoming' | 'Active' | 'Completed' | 'Closed'>("Active");
  const [isUploading, setIsUploading] = useState(false);
  // Dedicated Admin Image Upload Modal State
  const [isUploadImageModalOpen, setIsUploadImageModalOpen] = useState(false);
  const [uploadImageSelectedSchemeId, setUploadImageSelectedSchemeId] = useState("");
  const [uploadImageFile, setUploadImageFile] = useState<File | null>(null);
  const [uploadImagePreview, setUploadImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Edit Scheme Modal State
  const [editingScheme, setEditingScheme] = useState<ChitSchemeImage | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editTotalMonths, setEditTotalMonths] = useState("9");
  const [editDueDateDay, setEditDueDateDay] = useState("10");
  const [editMonthlyAmount, setEditMonthlyAmount] = useState("");
  const [editStatus, setEditStatus] = useState<'Upcoming' | 'Active' | 'Completed' | 'Closed'>("Active");
  const [editUrl, setEditUrl] = useState("");
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editFilePreview, setEditFilePreview] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // View Scheme Details Modal State
  const [viewingScheme, setViewingScheme] = useState<ChitSchemeImage | null>(null);

  // Customer Chit Details Modal State (Clicked Customer Name)
  const [selectedSubscription, setSelectedSubscription] = useState<ChitSubscriptionItem | null>(null);
  const [viewingSchemePassbook, setViewingSchemePassbook] = useState<ChitSubscribedSchemeItem | null>(null);

  // Admin Payment Entry Modal State
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    subscription: ChitSubscriptionItem | null;
    schemeId?: string;
    schemeName: string;
    personCount: number;
    monthlyAmountPerPerson: number;
    expectedMonthlyAmount: number;
    monthNumber: number;
    monthName: string;
    dueDate: string;
    amount: number;
    paymentDate: string;
    paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';
    transactionNumber: string;
    notes: string;
    isEdit: boolean;
  }>({
    isOpen: false,
    subscription: null,
    schemeId: "",
    schemeName: "",
    personCount: 1,
    monthlyAmountPerPerson: 0,
    expectedMonthlyAmount: 0,
    monthNumber: 1,
    monthName: "",
    dueDate: "",
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: "UPI",
    transactionNumber: "",
    notes: "",
    isEdit: false
  });

  // Official Receipt Modal State (View / Download PDF / Print)
  const [activeReceipt, setActiveReceipt] = useState<ChitReceiptData | null>(null);

  // Action Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    confirmColor: "bg-[#7A1416]",
    onConfirm: () => {}
  });

  // Load Data
  const loadChitSchemes = async () => {
    setLoadingSchemes(true);
    try {
      const data = await getChitSchemes();
      const mapped = (data || []).map((item: ChitSchemeItem) => ({
        id: item._id || item.id || '',
        url: item.url,
        title: item.title || item.schemeName || '',
        schemeName: item.title || item.schemeName || '',
        description: item.description || '',
        startDate: item.startDate || '',
        totalMonths: item.totalMonths || item.numberOfMonths || 9,
        numberOfMonths: item.totalMonths || item.numberOfMonths || 9,
        dueDateDay: item.dueDateDay || item.paymentDueDay || 10,
        paymentDueDay: item.dueDateDay || item.paymentDueDay || 10,
        monthlyAmount: item.monthlyAmount || 0,
        status: item.status || (item.isActive !== false ? 'Active' : 'Closed')
      }));
      setSchemes(mapped);
    } catch (err) {
      console.error("Failed to load chit schemes:", err);
    } finally {
      setLoadingSchemes(false);
    }
  };

  const loadSubscriptions = async () => {
    setLoadingSubscriptions(true);
    try {
      const data = await getChitSubscriptions();
      const allSubscriptions = data || [];
      setSubscriptions(allSubscriptions);

      // If customer modal is open, refresh selected subscription
      setSelectedSubscription(currentSelected => {
        if (!currentSelected) return null;
        const found = allSubscriptions.find(
          s => (s._id || s.id) === (currentSelected._id || currentSelected.id)
        );
        return found || currentSelected;
      });
    } catch (err) {
      console.error("Failed to load chit subscriptions:", err);
      toast.error("Failed to load customer applications");
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  useEffect(() => {
    loadChitSchemes();
    loadSubscriptions();

    const interval = setInterval(() => {
      loadChitSchemes();
      loadSubscriptions();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // File Select for New Scheme
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setSelectedFile(file);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(URL.createObjectURL(file));
    if (!uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleClearSelectedFile = () => {
    setSelectedFile(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  // Create Scheme Handler (No image file input required)
  const handleCreateSchemeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      toast.error("Please enter a scheme name");
      return;
    }

    setIsUploading(true);
    try {
      toast.loading("Creating Chit Scheme...", { id: "scheme-toast" });

      const monthly = parseFloat(uploadMonthlyAmount) || 0;
      const months = parseInt(uploadTotalMonths, 10) || 9;
      const totalExpected = monthly * months;

      await createChitScheme({
        title: uploadTitle.trim(),
        schemeName: uploadTitle.trim(),
        description: uploadDescription.trim(),
        url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200&auto=format&fit=crop",
        startDate: uploadStartDate,
        totalMonths: months,
        numberOfMonths: months,
        dueDateDay: parseInt(uploadDueDateDay, 10) || 10,
        paymentDueDay: parseInt(uploadDueDateDay, 10) || 10,
        monthlyAmount: monthly,
        totalSchemeAmount: totalExpected,
        totalAmount: totalExpected,
        status: uploadStatus
      });

      toast.success("Chit Scheme created successfully!", { id: "scheme-toast" });
      setUploadTitle("");
      setUploadDescription("");
      setUploadStartDate(new Date().toISOString().split('T')[0]);
      setUploadTotalMonths("9");
      setUploadDueDateDay("10");
      setUploadMonthlyAmount("2000");
      setUploadStatus("Active");
      setIsCreateModalOpen(false);
      loadChitSchemes();
    } catch (err: any) {
      toast.error(`Creation failed: ${err.message || err}`, { id: "scheme-toast" });
    } finally {
      setIsUploading(false);
    }
  };

  // Open Dedicated Upload Image Modal for a Scheme
  const handleOpenUploadImageForScheme = (sch: ChitSchemeImage) => {
    setUploadImageSelectedSchemeId(String(sch.id));
    setUploadImageFile(null);
    setUploadImagePreview(sch.url || null);
    setIsUploadImageModalOpen(true);
  };

  // Dedicated Admin Scheme Image Upload Handler (Just upload image)
  const handleUploadImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadImageFile) {
      toast.error("Please select an image to upload");
      return;
    }

    setIsUploadingImage(true);
    try {
      toast.loading("Uploading scheme image...", { id: "img-toast" });
      const cloudinaryUrl = await uploadImageToCloudinary(uploadImageFile, "chit_schemes");

      await createChitScheme({
        title: "",
        schemeName: "",
        url: cloudinaryUrl,
        status: "Active"
      });
      toast.success("Promotional image uploaded successfully!", { id: "img-toast" });

      setIsUploadImageModalOpen(false);
      setUploadImageFile(null);
      setUploadImagePreview(null);
      setUploadImageSelectedSchemeId("");
      loadChitSchemes();
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || err), { id: "img-toast" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // File Select for Edit Scheme
  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setEditSelectedFile(file);
    if (editFilePreview && editFilePreview.startsWith("blob:")) {
      URL.revokeObjectURL(editFilePreview);
    }
    setEditFilePreview(URL.createObjectURL(file));
  };

  const handleClearEditSelectedFile = () => {
    setEditSelectedFile(null);
    if (editFilePreview && editFilePreview.startsWith("blob:")) {
      URL.revokeObjectURL(editFilePreview);
    }
    setEditFilePreview(editUrl || null);
  };

  // Open Edit Scheme Modal
  const handleOpenEditModal = (sch: ChitSchemeImage) => {
    const monthly = sch.monthlyAmount || 0;
    const months = sch.totalMonths || sch.numberOfMonths || 9;

    setEditingScheme(sch);
    setEditTitle(sch.title || sch.schemeName || "");
    setEditDescription(sch.description || "");
    setEditStartDate(sch.startDate || new Date().toISOString().split('T')[0]);
    setEditTotalMonths(String(months));
    setEditDueDateDay(String(sch.dueDateDay || sch.paymentDueDay || 10));
    setEditMonthlyAmount(String(monthly));
    setEditStatus(sch.status || 'Active');
    setEditUrl(sch.url || "");
    setEditSelectedFile(null);
    setEditFilePreview(sch.url || null);
  };

  // Save Edit Scheme Handler
  const handleSaveEditScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScheme) return;
    if (!editTitle.trim()) {
      toast.error("Scheme title is required");
      return;
    }

    setIsSavingEdit(true);
    try {
      toast.loading("Updating scheme...", { id: "edit-toast" });
      let finalUrl = editUrl;
      if (editSelectedFile) {
        finalUrl = await uploadImageToCloudinary(editSelectedFile, "chit_schemes");
      }

      const monthly = parseFloat(editMonthlyAmount) || 0;
      const months = parseInt(editTotalMonths, 10) || 9;
      const totalExpected = monthly * months;

      await updateChitScheme(editingScheme.id, {
        title: editTitle.trim(),
        schemeName: editTitle.trim(),
        description: editDescription.trim(),
        url: finalUrl,
        startDate: editStartDate,
        totalMonths: months,
        numberOfMonths: months,
        dueDateDay: parseInt(editDueDateDay, 10) || 10,
        paymentDueDay: parseInt(editDueDateDay, 10) || 10,
        monthlyAmount: monthly,
        totalSchemeAmount: totalExpected,
        totalAmount: totalExpected,
        status: editStatus
      });

      toast.success("Chit Scheme updated successfully!", { id: "edit-toast" });
      setEditingScheme(null);
      setEditSelectedFile(null);
      setEditFilePreview(null);
      loadChitSchemes();
    } catch (err: any) {
      toast.error(`Failed to update: ${err.message || err}`, { id: "edit-toast" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete Scheme Handler
  const handleDeleteSchemePrompt = (sch: ChitSchemeImage) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Chit Scheme",
      message: `Are you sure you want to delete scheme "${sch.title || sch.schemeName}"? This action cannot be undone.`,
      confirmText: "Delete Scheme",
      confirmColor: "bg-rose-600 hover:bg-rose-700",
      onConfirm: async () => {
        try {
          await deleteChitScheme(sch.id);
          toast.success("Scheme deleted successfully!");
          loadChitSchemes();
        } catch (err: any) {
          toast.error("Failed to delete scheme: " + (err.message || err));
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Approve Customer Application Handler
  const handleApproveApplicationPrompt = (sub: ChitSubscriptionItem) => {
    setConfirmModal({
      isOpen: true,
      title: "Approve Application",
      message: `Are you sure you want to approve the chit scheme application for ${sub.name || sub.customerName} (${sub.schemeName})?`,
      confirmText: "Approve Customer",
      confirmColor: "bg-emerald-600 hover:bg-emerald-700",
      onConfirm: async () => {
        try {
          toast.loading("Approving customer application...", { id: "app-toast" });
          const id = sub._id || sub.id || "";
          const updatedSub = await approveChitSubscriptionApi(id);
          toast.success("Application approved! Customer is now an active chit member.", { id: "app-toast" });
          if (updatedSub) {
            setSelectedSubscription(updatedSub);
          }
          loadSubscriptions();
        } catch (err: any) {
          toast.error("Failed to approve: " + (err.message || err), { id: "app-toast" });
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Reject Customer Application Handler
  const handleRejectApplicationPrompt = (sub: ChitSubscriptionItem) => {
    setConfirmModal({
      isOpen: true,
      title: "Reject Application",
      message: `Are you sure you want to reject the chit scheme application for ${sub.name || sub.customerName}?`,
      confirmText: "Reject Application",
      confirmColor: "bg-rose-600 hover:bg-rose-700",
      onConfirm: async () => {
        try {
          toast.loading("Rejecting application...", { id: "app-toast" });
          const id = sub._id || sub.id || "";
          const updatedSub = await rejectChitSubscriptionApi(id);
          toast.success("Application rejected.", { id: "app-toast" });
          if (updatedSub) {
            setSelectedSubscription(updatedSub);
          }
          loadSubscriptions();
        } catch (err: any) {
          toast.error("Failed to reject: " + (err.message || err), { id: "app-toast" });
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Open Payment Entry Modal (Mark as Paid or Edit Payment)
  const handleOpenPaymentModal = (
    sub: ChitSubscriptionItem,
    sch: ChitSubscribedSchemeItem,
    monthNum: number,
    existingLog?: MonthlyPaymentLog
  ) => {
    const persons = sch.personCount || 1;
    const monthlyPerPerson = sch.monthlyAmountPerPerson || sch.monthlyAmount || 0;
    const expectedMonthly = sch.totalMonthlyAmount || (monthlyPerPerson * persons);
    const mName = existingLog?.monthName || `Month ${monthNum}`;

    setPaymentModalState({
      isOpen: true,
      subscription: sub,
      schemeId: sch.schemeId || sch._id,
      schemeName: sch.schemeName,
      personCount: persons,
      monthlyAmountPerPerson: monthlyPerPerson,
      expectedMonthlyAmount: expectedMonthly,
      monthNumber: monthNum,
      monthName: mName,
      dueDate: existingLog?.dueDate || "",
      amount: existingLog?.amount || expectedMonthly,
      paymentDate: existingLog?.paidAt ? new Date(existingLog.paidAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: (existingLog?.paymentMethod as any) || 'UPI',
      transactionNumber: existingLog?.transactionNumber || existingLog?.transactionId || '',
      notes: existingLog?.notes || '',
      isEdit: !!existingLog && ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'].includes(existingLog.status || '')
    });
  };

  // Confirm Admin Payment Submission Handler
  const handleConfirmPaymentEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const { subscription, schemeId, schemeName, monthNumber, monthName, amount, paymentDate, paymentMethod, transactionNumber, notes } = paymentModalState;
    if (!subscription) return;

    try {
      toast.loading("Recording monthly payment...", { id: "pay-toast" });
      const id = subscription._id || subscription.id || "";

      const res = await recordChitSchemePaymentApi(id, {
        schemeId,
        monthNumber,
        monthName,
        amount,
        paymentDate,
        paymentMethod,
        transactionNumber,
        notes
      });

      toast.success(res.message || `Payment for ${monthName} recorded successfully!`, { id: "pay-toast" });
      setPaymentModalState(prev => ({ ...prev, isOpen: false }));

      // Refresh currently selected customer subscription details and update lists in state immediately
      if (res.subscription) {
        setSelectedSubscription(res.subscription);
        setSubscriptions(prev => prev.map(s => ((s._id || s.id) === (res.subscription._id || res.subscription.id) ? res.subscription : s)));

        // Update viewingSchemePassbook with the fresh scheme object so passbook view updates instantly
        const targetSchemeId = schemeId || viewingSchemePassbook?._id || viewingSchemePassbook?.schemeId;
        if (targetSchemeId) {
          const freshScheme = (res.subscription.schemes || []).find(
            (s: any) => String(s._id || s.schemeId) === String(targetSchemeId)
          );
          if (freshScheme) {
            setViewingSchemePassbook(freshScheme);
          }
        }
      }

      // Reload subscriptions list in background
      loadSubscriptions();

      // Automatically pop up official receipt modal with the new receipt
      if (res.receipt) {
        setActiveReceipt(res.receipt);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save payment", { id: "pay-toast" });
    }
  };

  // Mark Payment as Pending Prompt
  const handleMarkPaymentPendingPrompt = (
    sub: ChitSubscriptionItem,
    monthNum: number,
    monthName: string
  ) => {
    setConfirmModal({
      isOpen: true,
      title: "Mark Payment as Pending",
      message: `Are you sure you want to mark the ${monthName} payment for ${sub.name || sub.customerName} as Pending?`,
      confirmText: "Mark as Pending",
      confirmColor: "bg-amber-600 hover:bg-[#7A1416]",
      onConfirm: async () => {
        try {
          toast.loading("Updating payment status...", { id: "pay-toast" });
          const id = sub._id || sub.id || "";
          await updateMonthPaymentStatusApi(id, {
            monthNumber: monthNum,
            monthName,
            status: 'Pending',
            notes: 'Reset to Pending by admin'
          });
          toast.success(`Payment for ${monthName} marked as Pending!`, { id: "pay-toast" });
          loadSubscriptions();
        } catch (err: any) {
          toast.error("Failed to update status: " + (err.message || err), { id: "pay-toast" });
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Helper to determine Payment Status (Advanced Payment, On-time Payment, Delay Payment)
  const getPaymentTimingStatus = (
    paidDateStr: string | undefined,
    monthNumber: number,
    dueDateDay: number,
    startDateStr?: string
  ): "Advanced Payment" | "On-time Payment" | "Delay Payment" => {
    return calculatePaymentTimingStatus(paidDateStr, monthNumber, dueDateDay, startDateStr);
  };

  // PDF Receipt Generation & WhatsApp Share Function with Previous Paid History
  const handleShareWhatsAppReceipt = (
    sub: ChitSubscriptionItem,
    monthNumber: number,
    monthName: string,
    amount: number,
    paidAt?: string,
    paymentMethod?: string,
    transactionNumber?: string,
    dueDateDay: number = 10
  ) => {
    const rawPhone = (sub.phone || sub.mobileNumber || '').replace(/\D/g, '');
    const customerName = sub.name || sub.customerName || 'Customer';
    const schemeName = sub.schemeName || 'Chit Scheme';
    const formattedDate = paidAt ? new Date(paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    
    const matchedScheme = schemes.find(s => (s.title || s.schemeName) === sub.schemeName);
    const startDateStr = matchedScheme?.startDate;
    const totalMonths = matchedScheme?.totalMonths || matchedScheme?.numberOfMonths || 9;
    const monthlyAmount = matchedScheme?.monthlyAmount || amount || 0;
    const totalSchemeAmount = monthlyAmount * totalMonths;

    const existingLog = (sub.monthlyPayments || []).find(p => p.monthNumber === monthNumber);
    const rawStatus = existingLog?.status;
    let timingStatus: "Advanced Payment" | "On-time Payment" | "Delay Payment" = "On-time Payment";
    if (rawStatus === 'Advanced Payment' || rawStatus === 'Advance Payment') {
      timingStatus = 'Advanced Payment';
    } else if (rawStatus === 'On-time Payment') {
      timingStatus = 'On-time Payment';
    } else if (rawStatus === 'Delay Payment') {
      timingStatus = 'Delay Payment';
    } else {
      timingStatus = calculatePaymentTimingStatus(paidAt || new Date(), monthNumber, dueDateDay, startDateStr);
    }

    const receiptNo = `REC-M${monthNumber}-${Date.now().toString().slice(-6)}`;

    // Build paid history list for all months from 1 up to monthNumber
    const historyList = getPaidHistoryList(sub, monthNumber, monthlyAmount, dueDateDay, startDateStr);
    const currentIdx = historyList.findIndex(h => h.monthNumber === monthNumber);
    if (currentIdx !== -1) {
      historyList[currentIdx].amount = amount;
      historyList[currentIdx].status = timingStatus;
      historyList[currentIdx].paidAt = paidAt || new Date();
      historyList[currentIdx].isPaid = true;
      if (paymentMethod) historyList[currentIdx].paymentMethod = paymentMethod;
      if (transactionNumber) historyList[currentIdx].transactionNumber = transactionNumber;
    }

    const paidItems = historyList.filter(item => item.isPaid);
    const totalPaidTillNow = paidItems.reduce((sum, item) => sum + item.amount, 0);
    const remainingBalance = Math.max(0, totalSchemeAmount - totalPaidTillNow);

    // Build HTML rows for paid history table
    const paidHistoryRowsHTML = historyList.map(item => {
      const itemDate = item.paidAt ? new Date(item.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
      let statusColor = '#64748b';
      let statusBg = '#f1f5f9';

      if (item.status === 'Advanced Payment') {
        statusColor = '#1d4ed8';
        statusBg = '#dbeafe';
      } else if (item.status === 'On-time Payment') {
        statusColor = '#047857';
        statusBg = '#d1fae5';
      } else if (item.status === 'Delay Payment') {
        statusColor = '#b45309';
        statusBg = '#fef3c7';
      }

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; background: ${item.isPaid ? '#ffffff' : '#fafafa'};">
          <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">#${item.monthNumber}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">${item.monthName}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">${itemDate}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">
            <span style="background: ${statusBg}; color: ${statusColor}; font-weight: bold; font-size: 10px; padding: 2px 6px; border-radius: 4px; display: inline-block;">
              ${item.status}
            </span>
          </td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; color: #475569;">${item.paymentMethod || '-'} ${item.transactionNumber ? `(#${item.transactionNumber})` : ''}</td>
          <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold; color: ${item.isPaid ? '#047857' : '#94a3b8'};">
            ${item.isPaid ? `₹${item.amount.toLocaleString()}` : `₹${item.amount.toLocaleString()} (Pending)`}
          </td>
        </tr>
      `;
    }).join('');

    const statusBadgeColor = timingStatus === 'Advanced Payment' ? '#1d4ed8' : timingStatus === 'On-time Payment' ? '#047857' : '#b45309';

    // Create offscreen container for PDF receipt
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 680px; background: #ffffff; color: #1e293b; border: 2px solid #7A1416; border-radius: 16px;">
        <div style="text-align: center; border-bottom: 2px solid #7A1416; padding-bottom: 12px; margin-bottom: 16px;">
          <h1 style="color: #7A1416; margin: 0; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">SAI YOGI CRACKERS</h1>
          <p style="margin: 3px 0 0 0; font-size: 13px; font-weight: bold; color: #334155;">MONTHLY CHIT SCHEME PAYMENT RECEIPT & PASSBOOK STATEMENT</p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Sattur, Virudhunagar District, Tamil Nadu • Mobile: +91 95859 75756</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; background: #f8fafc; padding: 10px 14px; border-radius: 10px; border: 1px solid #cbd5e1;">
          <div>
            <strong>Receipt No:</strong> ${receiptNo}<br/>
            <strong>Receipt Date:</strong> ${formattedDate}
          </div>
          <div style="text-align: right;">
            <strong>Scheme:</strong> ${schemeName}<br/>
            <strong>Monthly Due Date:</strong> Before ${dueDateDay}th of month
          </div>
        </div>

        <div style="margin-bottom: 16px; font-size: 12px;">
          <div style="font-weight: bold; color: #7A1416; font-size: 13px; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Subscriber Details</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <tr>
              <td style="padding: 3px 0; color: #64748b; width: 130px;">Customer Name:</td>
              <td style="padding: 3px 0; font-weight: bold; color: #0f172a;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #64748b;">Mobile Number:</td>
              <td style="padding: 3px 0; font-weight: bold; color: #0f172a;">${sub.phone || sub.mobileNumber}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; color: #64748b;">Location:</td>
              <td style="padding: 3px 0; font-weight: bold; color: #0f172a;">${sub.location || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 16px; background: #fef2f2; border: 1px solid #fca5a5; padding: 10px 14px; border-radius: 10px; font-size: 12px;">
          <div style="font-weight: bold; color: #7A1416; font-size: 13px; margin-bottom: 4px; text-transform: uppercase;">CURRENT PAYMENT RECEIVED</div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span><strong>Month:</strong> Month ${monthNumber} (${monthName})</span>
            <span><strong>Status:</strong> <strong style="color: ${statusBadgeColor};">${timingStatus}</strong></span>
            <span><strong>Amount Paid:</strong> <strong style="color: #047857; font-size: 15px;">₹${amount.toLocaleString()}</strong></span>
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 4px;">
            Payment Method: ${paymentMethod || 'Cash / UPI'}${transactionNumber ? ` (Ref #${transactionNumber})` : ''} • Date: ${formattedDate}
          </div>
        </div>

        <!-- PREVIOUS PAYMENT HISTORY TABLE -->
        <div style="margin-bottom: 16px;">
          <div style="font-weight: bold; color: #7A1416; font-size: 13px; margin-bottom: 6px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
            <span>PAID HISTORY STATEMENT (Months 1 to ${monthNumber})</span>
            <span style="font-size: 11px; color: #047857; font-weight: bold;">Total Paid: ₹${totalPaidTillNow.toLocaleString()}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155; font-size: 10px; text-transform: uppercase;">
                <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">Month #</th>
                <th style="padding: 6px; border: 1px solid #cbd5e1;">Month Name</th>
                <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">Paid Date</th>
                <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: center;">Status</th>
                <th style="padding: 6px; border: 1px solid #cbd5e1;">Method / Ref</th>
                <th style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${paidHistoryRowsHTML}
            </tbody>
            <tfoot>
              <tr style="background: #f8fafc; font-weight: bold;">
                <td colspan="5" style="padding: 6px; border: 1px solid #cbd5e1; text-align: right;">Cumulative Total Amount Paid Till Date:</td>
                <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right; color: #047857; font-size: 12px;">₹${totalPaidTillNow.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 10px; font-size: 11px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>Total Scheme: ₹${totalSchemeAmount.toLocaleString()} (${totalMonths} Months)</span>
            <span>Progress: <span style="color: #047857;">₹${totalPaidTillNow.toLocaleString()} (${paidItems.length}/${totalMonths} Paid)</span></span>
            <span>Balance Remaining: <span style="color: #b91c1c;">₹${remainingBalance.toLocaleString()}</span></span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; font-size: 11px; color: #64748b;">
          <div>
            <p style="margin: 0;">Thank you for your payment!</p>
            <p style="margin: 2px 0 0 0;">This is an official computer generated receipt & passbook statement.</p>
          </div>
          <div style="text-align: center; border-top: 1px dashed #94a3b8; padding-top: 4px; width: 160px;">
            <strong style="color: #7A1416;">Sai Yogi Crackers</strong><br/>
            Authorized Signatory
          </div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '680px';
    document.body.appendChild(tempDiv);

    toast.loading("Generating & Downloading PDF Receipt...", { id: "pdf-toast" });

    import("html2canvas").then((html2canvas) => {
      html2canvas.default(tempDiv, { scale: 2, backgroundColor: "#ffffff" }).then((canvas) => {
        import("jspdf").then((jsPDF) => {
          const pdf = new jsPDF.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const margin = 10;
          const imgWidth = pdfWidth - (margin * 2);
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight);
          pdf.save(`Receipt_Month${monthNumber}_${customerName.replace(/\s+/g, '_')}.pdf`);
          toast.success("PDF Receipt Downloaded!", { id: "pdf-toast" });

          if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);

          // Build WhatsApp history text lines
          const waHistoryText = historyList.map(item => {
            const itemDate = item.paidAt ? new Date(item.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-';
            if (item.isPaid) {
              return `• Month ${item.monthNumber} (${item.monthName}): ₹${item.amount.toLocaleString()} [${item.status} on ${itemDate}]`;
            } else {
              return `• Month ${item.monthNumber} (${item.monthName}): ₹${item.amount.toLocaleString()} [Pending]`;
            }
          }).join('\n');

          // Open WhatsApp with pre-formatted summary text & PDF note
          const text = 
`*SAI YOGI CRACKERS - CHIT SCHEME RECEIPT & PASSBOOK* 🧾
--------------------------------------------
*Subscriber:* ${customerName}
*Scheme:* ${schemeName}
*Current Payment:* Month ${monthNumber} (${monthName})
*Amount Paid:* ₹${amount.toLocaleString()}
*Status:* ${timingStatus}
*Payment Date:* ${formattedDate}
--------------------------------------------
*PREVIOUS PAID HISTORY (Months 1 to ${monthNumber}):*
${waHistoryText}

*Total Paid Till Date:* ₹${totalPaidTillNow.toLocaleString()} (${historyList.length}/${totalMonths} Months)
*Remaining Balance:* ₹${remainingBalance.toLocaleString()}
--------------------------------------------
📄 PDF Receipt & Passbook Statement downloaded to your device. Please attach the PDF receipt to this chat.
Thank you for your payment! 🙏
_Sai Yogi Crackers_`;

          const encodedText = encodeURIComponent(text);
          const waUrl = rawPhone ? `https://api.whatsapp.com/send?phone=91${rawPhone}&text=${encodedText}` : `https://api.whatsapp.com/send?text=${encodedText}`;
          window.open(waUrl, '_blank');
        }).catch((err) => {
          console.error(err);
          toast.error("Failed to generate PDF", { id: "pdf-toast" });
          if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
        });
      }).catch((err) => {
        console.error(err);
        toast.error("Failed to capture receipt element", { id: "pdf-toast" });
        if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
      });
    }).catch((err) => {
      console.error(err);
      toast.error("Library load error", { id: "pdf-toast" });
      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
    });
  };

  // Filter Customer Applications (Supports multiple applications per customer & multi-schemes)
  const filteredSubscriptions = React.useMemo(() => {
    return subscriptions.filter(sub => {
      const name = (sub.name || sub.customerName || "").toLowerCase();
      const phone = (sub.phone || sub.mobileNumber || "").toLowerCase();
      const appNo = (sub.applicationNumber || "").toLowerCase();
      const sch = (sub.schemeName || "").toLowerCase();
      const allSchemeNames = (sub.schemes || []).map(s => s.schemeName.toLowerCase()).join(" ");
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || name.includes(q) || phone.includes(q) || sch.includes(q) || allSchemeNames.includes(q) || appNo.includes(q);

      const matchesScheme = schemeFilter === "all" ||
        sub.schemeName === schemeFilter ||
        (sub.schemes || []).some(s => s.schemeName === schemeFilter);

      const currentApproval = sub.approvalStatus || (sub.status === 'Paid' || sub.status === 'Approved' ? 'Approved' : (sub.status === 'Rejected' ? 'Rejected' : 'Pending'));
      const matchesApproval = approvalFilter === "all" || currentApproval === approvalFilter;

      const totalPaidMonths = sub.monthsPaid || (sub.schemes || []).reduce((sum, s) => sum + (s.monthsPaid || 0), 0);
      const matchesPayment = paymentFilter === "all" ||
        (paymentFilter === "Paid" && totalPaidMonths > 0) ||
        (paymentFilter === "Pending" && totalPaidMonths === 0);

      return matchesSearch && matchesScheme && matchesApproval && matchesPayment;
    }).sort((a, b) => {
      const timeA = new Date(a.createdAt || a.updatedAt || a.date || 0).getTime();
      const timeB = new Date(b.createdAt || b.updatedAt || b.date || 0).getTime();
      return dateSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [subscriptions, searchQuery, schemeFilter, approvalFilter, paymentFilter, dateSortOrder]);

  // Export Chit Scheme Applications to Excel
  const handleExportChitScheme = (options: { dateSortOrder: 'desc' | 'asc'; startDate?: string; endDate?: string }) => {
    return exportChitSubscriptionsToExcel(filteredSubscriptions, schemes, {
      dateSortOrder: options.dateSortOrder,
      startDate: options.startDate,
      endDate: options.endDate,
      filenamePrefix: `SaiYogi_Chit_Applications_${schemeFilter !== 'all' ? schemeFilter : 'All'}`
    });
  };

  // Calculate Summary Statistics
  const totalSchemesCount = schemes.length;
  const pendingApplicationsCount = subscriptions.filter(
    s => (s.approvalStatus || (s.status === 'Paid' || s.status === 'Approved' ? 'Approved' : (s.status === 'Rejected' ? 'Rejected' : 'Pending'))) === 'Pending'
  ).length;
  const approvedCustomersCount = subscriptions.filter(
    s => (s.approvalStatus || (s.status === 'Paid' || s.status === 'Approved' ? 'Approved' : 'Pending')) === 'Approved'
  ).length;
  const activeSchemesCount = schemes.filter(s => s.status === 'Active' || s.status === undefined).length;
  const completedSchemesCount = schemes.filter(s => s.status === 'Completed').length;

  return (
    <div className="flex h-screen bg-[#FAF9FC] overflow-hidden font-sans">
      {/* Sidebar */}
      <AdminSidebar activeTab="chit-scheme" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminNavbar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
          
          {/* Top Title & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/90 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#7A1416]/10 text-[#7A1416] px-3 py-1 rounded-full font-extrabold text-[11px] uppercase tracking-wider">
                  Admin Portal
                </span>
                <span className="text-xs text-gray-400 font-bold">•</span>
                <span className="text-xs text-gray-500 font-semibold">Sai Yogi Crackers</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1B54] mt-1">
                Chit Scheme Management
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Manage all chit schemes, approve customer applications, and track monthwise payments.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  loadChitSchemes();
                  loadSubscriptions();
                  toast.success("Refreshed latest data!");
                }}
                className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setIsUploadImageModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <ImageIcon className="w-4.5 h-4.5" />
                <span>Upload Scheme Image</span>
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#7A1416] hover:bg-[#900000] text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Create New Scheme</span>
              </button>
            </div>
          </div>

          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#7A1416] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Total Schemes</div>
                <div className="text-xl font-extrabold text-gray-900">{totalSchemesCount}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200/90 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide">Approved</div>
                <div className="text-xl font-extrabold text-emerald-950">{approvedCustomersCount}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200/90 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wide">Active Schemes</div>
                <div className="text-xl font-extrabold text-blue-950">{activeSchemesCount}</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Completed</div>
                <div className="text-xl font-extrabold text-gray-900">{completedSchemesCount}</div>
              </div>
            </div>
          </div>

          {/* SECTION 1: CUSTOMER APPLICATIONS TABLE */}
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#2A1B54] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#7A1416]" />
                  Customer Applications ({filteredSubscriptions.length})
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Click customer name to open full payment progress. Only approved customers can be marked for monthly payment.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Download Excel Button */}
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  title="Download Chit Scheme Applications to Excel with Date Sorting"
                >
                  <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Excel</span>
                </button>

                <span className="text-xs font-bold text-gray-600 ml-1">Filters:</span>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {approvedCustomersCount} Approved
                </span>
                <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  {pendingApplicationsCount} Pending
                </span>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-gray-50/90 p-4 rounded-2xl border border-gray-200/80">
              {/* Search Box */}
              <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name, mobile, scheme..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs p-2.5 pl-9 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-medium"
                />
              </div>

              {/* Scheme Dropdown */}
              <div>
                <select
                  value={schemeFilter}
                  onChange={(e) => setSchemeFilter(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold text-gray-700"
                >
                  <option value="all">All Schemes ▼</option>
                  {schemes.map(s => (
                    <option key={s.id} value={s.title || s.schemeName}>
                      {s.title || s.schemeName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Approval Filter Dropdown */}
              <div>
                <select
                  value={approvalFilter}
                  onChange={(e) => setApprovalFilter(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold text-gray-700"
                >
                  <option value="all">Approval: All ▼</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Payment Status Dropdown */}
              <div>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold text-gray-700"
                >
                  <option value="all">Payment: All ▼</option>
                  <option value="Paid">Payments Started (&gt;0)</option>
                  <option value="Pending">No Payments (0)</option>
                </select>
              </div>

              {/* Date Sorting Dropdown */}
              <div>
                <select
                  value={dateSortOrder}
                  onChange={(e) => setDateSortOrder(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold text-gray-700 cursor-pointer"
                  title="Date Sorting Option"
                >
                  <option value="desc">Date: Newest First ⬇️</option>
                  <option value="asc">Date: Oldest First ⬆️</option>
                </select>
              </div>
            </div>

            {/* Applications Table */}
            {loadingSubscriptions ? (
              <div className="py-12 text-center text-gray-400 font-medium text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-[#7A1416]" />
                <span>Loading Customer Applications...</span>
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-medium text-xs border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                No customer chit applications found matching filters.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100/90 text-gray-700 text-xs uppercase font-extrabold tracking-wider border-b border-gray-200">
                      <th className="p-4">Customer &amp; App ID</th>
                      <th className="p-4">Contact Info</th>
                      <th className="p-4">Selected Schemes</th>
                      <th className="p-4 text-center">Total Persons</th>
                      <th className="p-4 text-right">Monthly Total</th>
                      <th className="p-4 text-right">Grand Total</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredSubscriptions.map((sub, idx) => {
                      const id = sub._id || sub.id || String(idx);
                      const currentApproval = sub.approvalStatus || (sub.status === 'Paid' || sub.status === 'Approved' ? 'Approved' : (sub.status === 'Rejected' ? 'Rejected' : 'Pending'));
                      const enrolledSchemes = (sub.schemes && sub.schemes.length > 0) ? sub.schemes : null;
                      const schemeCount = enrolledSchemes ? enrolledSchemes.length : 1;
                      const personsCount = enrolledSchemes 
                        ? enrolledSchemes.reduce((sum, s) => sum + (s.personCount || 1), 0)
                        : (sub.totalPersons || sub.personCount || 1);
                      const monthlyTotal = enrolledSchemes
                        ? enrolledSchemes.reduce((sum, s) => sum + (s.totalMonthlyAmount || ((s.monthlyAmountPerPerson || s.monthlyAmount || s.price || 0) * (s.personCount || 1))), 0)
                        : (sub.combinedMonthlyAmount || sub.monthlyAmount || 0);
                      const grandTotal = enrolledSchemes
                        ? enrolledSchemes.reduce((sum, s) => sum + (s.totalSchemeAmount || ((s.totalMonthlyAmount || ((s.monthlyAmountPerPerson || s.monthlyAmount || s.price || 0) * (s.personCount || 1))) * (s.durationMonths || 10))), 0)
                        : (sub.combinedGrandTotal || (monthlyTotal * 10));
                      const paidAmount = sub.totalPaidAmount || 0;

                      return (
                        <tr key={id} className="hover:bg-gray-50/90 transition-colors">
                          {/* Column 1: Customer Name & Application ID */}
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => setSelectedSubscription(sub)}
                              className="font-extrabold text-[#7A1416] hover:text-[#900000] hover:underline text-sm text-left flex items-center gap-1.5 group cursor-pointer"
                            >
                              <span>{sub.name || sub.customerName || 'Customer'}</span>
                            </button>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="font-mono text-[10px] bg-purple-50 text-purple-900 border border-purple-200 px-2 py-0.5 rounded font-extrabold">
                                {sub.applicationNumber || `APP-${String(id).slice(-5)}`}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Recent'}
                              </span>
                            </div>
                          </td>

                          {/* Column 2: Mobile & Location */}
                          <td className="p-4">
                            <div className="font-extrabold text-gray-900 font-mono text-xs flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>{sub.phone || sub.mobileNumber}</span>
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate max-w-[140px]">{sub.location}</span>
                            </div>
                          </td>

                          {/* Column 3: Selected Schemes & Formula Calculation */}
                          <td className="p-4">
                            {enrolledSchemes ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="bg-amber-100 text-amber-900 font-black text-[10px] px-2 py-0.5 rounded inline-block">
                                    {schemeCount} Scheme{schemeCount > 1 ? 's' : ''}
                                  </span>
                                  <span className="bg-rose-50 text-[#7A1416] border border-rose-200 font-extrabold text-[10px] px-2 py-0.5 rounded inline-block">
                                    {personsCount} Persons
                                  </span>
                                </div>
                                <div className="text-[11px] font-bold text-[#7A1416] font-mono">
                                  {enrolledSchemes.map(s => {
                                    const rate = s.monthlyAmountPerPerson || s.monthlyAmount || s.price || 0;
                                    const count = s.personCount || 1;
                                    return `${rate} × ${count} = ₹${(rate * count).toLocaleString()}`;
                                  }).join(" + ")}
                                </div>
                                <div className="text-[10px] text-gray-500 font-medium truncate max-w-[220px]">
                                  {enrolledSchemes.map(s => `${s.schemeName} (${s.personCount || 1}p)`).join(", ")}
                                </div>
                              </div>
                            ) : (
                              <div className="font-extrabold text-[#2A1B54]">
                                {sub.schemeName || 'Chit Scheme'}
                              </div>
                            )}
                          </td>

                          {/* Column 4: Total Persons */}
                          <td className="p-4 text-center">
                            <span className="bg-amber-50 border border-amber-200 text-amber-950 font-black px-2.5 py-1 rounded-xl text-xs inline-flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-[#7A1416]" />
                              <span>{personsCount}</span>
                            </span>
                          </td>

                          {/* Column 5: Monthly Total */}
                          <td className="p-4 text-right">
                            <div className="font-black text-emerald-700 text-sm">
                              ₹{monthlyTotal.toLocaleString()}
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">per month</span>
                          </td>

                          {/* Column 6: Grand Total & Paid */}
                          <td className="p-4 text-right">
                            <div className="font-extrabold text-[#2A1B54]">
                              ₹{grandTotal.toLocaleString()}
                            </div>
                            <div className="text-[11px] text-emerald-600 font-bold">
                              ₹{paidAmount.toLocaleString()} Paid
                            </div>
                          </td>

                          {/* Column 7: Status */}
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] ${
                              currentApproval === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              currentApproval === 'Rejected' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                              'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {currentApproval}
                            </span>
                          </td>

                          {/* Column 8: Actions */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {currentApproval === 'Pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveApplicationPrompt(sub)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                    title="Approve Application"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectApplicationPrompt(sub)}
                                    className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs px-2 py-1.5 rounded-xl transition-all border border-rose-300 flex items-center gap-1 cursor-pointer"
                                    title="Reject Application"
                                  >
                                    <X className="w-3.5 h-3.5 stroke-[3]" />
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedSubscription(sub)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span>Details</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 2: SCHEMES MANAGEMENT TABLE / CARDS */}
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#2A1B54] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#7A1416]" />
                  Available Schemes ({schemes.length})
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Configure scheme names, starting dates, duration, monthly amounts, and payment due date rules.
                </p>
              </div>
            </div>

            {loadingSchemes ? (
              <div className="py-12 text-center text-gray-400 font-medium text-xs flex flex-col items-center gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-[#7A1416]" />
                <span>Loading Chit Schemes...</span>
              </div>
            ) : schemes.length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-medium text-xs border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                No Chit Schemes configured yet. Click <strong>+ Create New Scheme</strong> to add one!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {schemes.map((sch) => {
                  const duration = sch.totalMonths || sch.numberOfMonths || 9;
                  const monthlyAmt = sch.monthlyAmount || 0;
                  const totalExpAmount = monthlyAmt * duration;
                  const enrolledCount = subscriptions.filter(s => s.schemeName === (sch.title || sch.schemeName)).length;
                  const dueDay = sch.dueDateDay || sch.paymentDueDay || 10;
                  const schStatus = sch.status || 'Active';

                  return (
                    <div
                      key={sch.id}
                      className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              schStatus === 'Active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              schStatus === 'Upcoming' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              schStatus === 'Completed' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                              'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {schStatus}
                            </span>
                            <h3 className="font-extrabold text-gray-900 text-base leading-snug mt-1">
                              {sch.title || sch.schemeName}
                            </h3>
                          </div>
                        </div>

                        {sch.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {sch.description}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-xl border border-gray-200/80">
                          <div>
                            <span className="text-gray-500 text-[11px] block">Start Date:</span>
                            <strong className="text-gray-900 font-semibold">{sch.startDate || 'Immediate'}</strong>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[11px] block">Duration:</span>
                            <strong className="text-gray-900 font-semibold">{duration} Months</strong>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[11px] block">Monthly Amount:</span>
                            <strong className="text-emerald-700 font-bold">₹{monthlyAmt.toLocaleString()}</strong>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[11px] block">Total Expected:</span>
                            <strong className="text-[#7A1416] font-extrabold">₹{totalExpAmount.toLocaleString()}</strong>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-600 bg-amber-50/70 border border-amber-200/70 p-2.5 rounded-xl">
                          <span className="font-medium">🔔 Due: Before {dueDay}th monthly</span>
                          <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-lg text-[11px]">
                            {enrolledCount} Enrolled
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => setViewingScheme(sch)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(sch)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-700" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSchemePrompt(sch)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: PROMOTIONAL BANNERS / SCHEME IMAGES GALLERY */}
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#2A1B54] flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#7A1416]" />
                  Chit Scheme Promotional Images ({schemes.filter(s => s.url).length})
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Upload promotional image banners here. These images will be displayed to users on the Chit Scheme portal.
                </p>
              </div>

              <button
                onClick={() => {
                  setUploadImageSelectedSchemeId("");
                  setUploadImageFile(null);
                  setUploadImagePreview(null);
                  setIsUploadImageModalOpen(true);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Upload New Image</span>
              </button>
            </div>

            {schemes.filter(s => s.url).length === 0 ? (
              <div className="py-12 text-center text-gray-400 font-medium text-xs border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                No promotional images uploaded yet. Click <strong>+ Upload New Image</strong> above to add banners for customers!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {schemes.filter(s => s.url).map((sch) => (
                  <div key={sch.id} className="relative group bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden shadow-2xs p-2 flex flex-col justify-between">
                    <img
                      src={sch.url}
                      alt="Promotional Banner"
                      className="w-full h-40 object-cover rounded-xl border border-gray-200"
                    />
                    <div className="flex items-center justify-between pt-2 px-1">
                      <span className="text-[11px] font-semibold text-gray-500 truncate">
                        Promotional Image
                      </span>
                      <button
                        onClick={() => handleDeleteSchemePrompt(sch)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="Delete Image"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>

      {/* MODAL 1: VIEW SCHEME DETAILS MODAL */}
      {viewingScheme && (
        <Dialog open={!!viewingScheme} onOpenChange={() => setViewingScheme(null)}>
          <DialogContent className="max-w-3xl p-6 sm:p-8 bg-white rounded-3xl font-sans max-h-[90vh] overflow-y-auto space-y-6">
            <DialogHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                  Scheme Info
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  viewingScheme.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  {viewingScheme.status || 'Active'}
                </span>
              </div>
              <DialogTitle className="text-xl font-extrabold text-[#2A1B54] mt-1">
                {viewingScheme.title || viewingScheme.schemeName}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                {viewingScheme.description || "No description provided."}
              </DialogDescription>
            </DialogHeader>

            {/* Scheme Parameters Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 text-xs">
              <div>
                <span className="text-gray-500 block text-[11px]">Start Date:</span>
                <strong className="text-gray-900 font-bold">{viewingScheme.startDate || 'Not specified'}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Duration:</span>
                <strong className="text-gray-900 font-bold">{viewingScheme.totalMonths || viewingScheme.numberOfMonths || 9} Months</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Monthly Amount:</span>
                <strong className="text-emerald-700 font-bold">₹{(viewingScheme.monthlyAmount || 0).toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Total Expected:</span>
                <strong className="text-[#7A1416] font-extrabold">₹{((viewingScheme.monthlyAmount || 0) * (viewingScheme.totalMonths || viewingScheme.numberOfMonths || 9)).toLocaleString()}</strong>
              </div>
            </div>

            {/* Auto Generated Schedule */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#7A1416]" />
                Auto-Generated Monthly Schedule ({viewingScheme.totalMonths || viewingScheme.numberOfMonths || 9} Months)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {generateScheduleForScheme(
                  viewingScheme.startDate,
                  viewingScheme.totalMonths || viewingScheme.numberOfMonths || 9,
                  viewingScheme.dueDateDay || viewingScheme.paymentDueDay || 10,
                  viewingScheme.monthlyAmount || 0
                ).map((m) => (
                  <div key={m.monthNumber} className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1">
                    <div className="font-extrabold text-gray-900">{m.monthNumber}. {m.monthName}</div>
                    <div className="text-[11px] text-gray-500">Due: {m.dueDateStr}</div>
                    <div className="text-[11px] font-bold text-emerald-700">₹{m.amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enrolled Customers */}
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#7A1416]" />
                Enrolled Customers
              </h4>
              {subscriptions.filter(s => s.schemeName === (viewingScheme.title || viewingScheme.schemeName)).length === 0 ? (
                <div className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center">
                  No customers currently enrolled in this scheme.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {subscriptions
                    .filter(s => s.schemeName === (viewingScheme.title || viewingScheme.schemeName))
                    .map(sub => (
                      <div key={sub._id || sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-xs border border-gray-200">
                        <div>
                          <div className="font-extrabold text-gray-900">{sub.name || sub.customerName}</div>
                          <div className="text-[11px] text-gray-500 font-mono">{sub.phone || sub.mobileNumber} • {sub.location}</div>
                        </div>
                        <div className="text-right">
                          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                            {sub.monthsPaid || 0} / {viewingScheme.totalMonths || viewingScheme.numberOfMonths || 9} Months Paid
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setViewingScheme(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 2: CREATE NEW SCHEME MODAL */}
      {isCreateModalOpen && (
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="sm:max-w-lg p-6 bg-white rounded-3xl font-sans max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-[#2A1B54] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#7A1416]" />
                Create New Chit Scheme
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600">
                Define the scheme parameters including start date, duration, monthly installment, and fixed due date day.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSchemeSubmit} className="space-y-4 py-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  1. Scheme Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diwali Special Savings Scheme 2026"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold"
                  required
                />
              </div>

              {/* Scheme Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80">
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                    Scheme Starting Date *
                  </label>
                  <input
                    type="date"
                    value={uploadStartDate}
                    onChange={(e) => setUploadStartDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                    Number of Months *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    placeholder="e.g. 9"
                    value={uploadTotalMonths}
                    onChange={(e) => setUploadTotalMonths(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                    Monthly Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 2000"
                    value={uploadMonthlyAmount}
                    onChange={(e) => setUploadMonthlyAmount(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                    Payment Due Day (1-31) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="e.g. 10"
                    value={uploadDueDateDay}
                    onChange={(e) => setUploadDueDateDay(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold"
                    required
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                    Scheme Status
                  </label>
                  <select
                    value={uploadStatus}
                    onChange={(e) => setUploadStatus(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Scheme Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Save ₹2000/month for 9 months and get extra bonus!"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none resize-none"
                />
              </div>

              <DialogFooter className="gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadTitle.trim()}
                  className="px-5 py-2.5 bg-[#7A1416] hover:bg-[#900000] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Scheme</span>
                    </>
                  )}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 2.5: DEDICATED ADMIN SCHEME IMAGE UPLOAD MODAL */}
      {isUploadImageModalOpen && (
        <Dialog open={isUploadImageModalOpen} onOpenChange={setIsUploadImageModalOpen}>
          <DialogContent className="sm:max-w-lg p-6 bg-white rounded-3xl font-sans max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-[#2A1B54] flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#7A1416]" />
                Upload Chit Scheme Image / Banner
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600">
                Upload or update a promotional banner image for a chit scheme. This banner will be displayed to customers on the Chit Scheme registration page.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUploadImageSubmit} className="space-y-4 py-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Select Image File *
                </label>
                {uploadImagePreview ? (
                  <div className="relative border border-gray-200 rounded-2xl p-3 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={uploadImagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-xl shrink-0 border border-gray-200" />
                      <div className="truncate">
                        <span className="text-xs font-semibold text-gray-800 block truncate">
                          {uploadImageFile?.name || "Selected Image"}
                        </span>
                        <label className="text-[11px] text-[#7A1416] hover:underline font-bold cursor-pointer inline-block mt-1">
                          Choose Different Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0) return;
                              const file = files[0];
                              setUploadImageFile(file);
                              if (uploadImagePreview && uploadImagePreview.startsWith("blob:")) {
                                URL.revokeObjectURL(uploadImagePreview);
                              }
                              setUploadImagePreview(URL.createObjectURL(file));
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadImageFile(null);
                        setUploadImagePreview(null);
                      }}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 hover:border-[#7A1416] rounded-2xl p-4 text-center transition-colors bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-[#7A1416] flex items-center justify-center">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Click to upload scheme image</span>
                      <span className="text-[11px] text-gray-500 font-medium">PNG, JPG, WEBP up to 10MB</span>
                    </div>
                    <span className="bg-[#7A1416] text-white text-[11px] font-bold px-3 py-1 rounded-lg mt-1">
                      Browse Files
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        const file = files[0];
                        setUploadImageFile(file);
                        setUploadImagePreview(URL.createObjectURL(file));
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <DialogFooter className="gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadImageModalOpen(false);
                    setUploadImageFile(null);
                    setUploadImagePreview(null);
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage || !uploadImageFile}
                  className="px-5 py-2.5 bg-[#7A1416] hover:bg-[#900000] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      <span>Upload Image</span>
                    </>
                  )}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 3: EDIT SCHEME MODAL */}
      {editingScheme && (
        <Dialog open={!!editingScheme} onOpenChange={() => setEditingScheme(null)}>
          <DialogContent className="sm:max-w-lg p-6 bg-white rounded-3xl font-sans max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-[#2A1B54]">
                Edit Chit Scheme
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveEditScheme} className="space-y-4 py-2 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Scheme Name *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80">
                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                    Number of Months
                  </label>
                  <input
                    type="number"
                    value={editTotalMonths}
                    onChange={(e) => setEditTotalMonths(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                    Monthly Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={editMonthlyAmount}
                    onChange={(e) => setEditMonthlyAmount(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                    Due Day (1-31)
                  </label>
                  <input
                    type="number"
                    value={editDueDateDay}
                    onChange={(e) => setEditDueDateDay(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-800 uppercase mb-1">
                    Scheme Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Scheme Banner Image
                </label>
                {editFilePreview ? (
                  <div className="relative border border-gray-200 rounded-2xl p-2.5 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={editFilePreview} alt="Preview" className="w-14 h-14 object-cover rounded-xl shrink-0 border border-gray-200" />
                      <div className="truncate">
                        <span className="text-xs font-semibold text-gray-800 block truncate">
                          {editSelectedFile?.name || "Current Scheme Banner"}
                        </span>
                        <label className="text-[11px] text-[#7A1416] hover:underline font-bold cursor-pointer inline-block mt-0.5">
                          Change Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleEditFileSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearEditSelectedFile}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold p-1 cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-200 hover:border-[#7A1416]/50 rounded-2xl p-3.5 text-center transition-colors bg-gray-50 flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-[#7A1416]" />
                      <span className="text-xs font-bold text-gray-700">Upload Scheme Image</span>
                    </div>
                    <span className="bg-[#7A1416] text-white text-[11px] font-bold px-3 py-1 rounded-lg">
                      Browse File
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none resize-none"
                />
              </div>

              <DialogFooter className="gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingScheme(null)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 bg-[#7A1416] hover:bg-[#900000] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 4: CUSTOMER CHIT DETAILS & SCHEME BREAKDOWN MODAL (Clicked Customer Name) */}
      {selectedSubscription && (
        <Dialog open={!!selectedSubscription} onOpenChange={() => {
          setSelectedSubscription(null);
          setViewingSchemePassbook(null);
        }}>
          <DialogContent className="max-w-5xl p-6 sm:p-8 bg-white rounded-3xl font-sans max-h-[92vh] overflow-y-auto space-y-6">
            {(() => {
              const sub = selectedSubscription;
              const currentApproval = sub.approvalStatus || (sub.status === 'Paid' || sub.status === 'Approved' ? 'Approved' : (sub.status === 'Rejected' ? 'Rejected' : 'Pending'));

              // Enrolled schemes inside this application with robust fallbacks
              const enrolledSchemes: ChitSubscribedSchemeItem[] = (Array.isArray(sub.schemes) && sub.schemes.length > 0)
                ? sub.schemes.map(sch => {
                    const persons = Math.max(1, sch.personCount || 1);
                    let monthly = sch.monthlyAmountPerPerson || sch.monthlyAmount || 0;
                    if (monthly === 0 && sch.schemeName) {
                      const match = sch.schemeName.match(/\d+/);
                      if (match) monthly = parseInt(match[0], 10);
                    }
                    const duration = sch.durationMonths || sch.totalMonths || 10;
                    const totalMonthly = sch.totalMonthlyAmount || (monthly * persons);
                    const totalScheme = sch.totalSchemeAmount || (totalMonthly * duration);
                    const validPaidStatuses = ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'];
                    const paidLogs = (sch.monthlyPayments || []).filter(p => validPaidStatuses.includes(p.status));
                    const paidAmount = sch.paidAmount !== undefined ? sch.paidAmount : paidLogs.reduce((sum, p) => sum + (p.amount || p.paidAmount || totalMonthly), 0);
                    return {
                      ...sch,
                      personCount: persons,
                      monthlyAmountPerPerson: monthly,
                      totalMonthlyAmount: totalMonthly,
                      durationMonths: duration,
                      totalMonths: duration,
                      totalSchemeAmount: totalScheme,
                      paidAmount: paidAmount,
                      remainingAmount: Math.max(0, totalScheme - paidAmount),
                      monthsPaid: sch.monthsPaid || paidLogs.length,
                      paidInstallments: sch.monthsPaid || paidLogs.length
                    };
                  })
                : [{
                    _id: sub._id,
                    schemeId: sub.schemeId,
                    schemeName: sub.schemeName || "Chit Scheme",
                    personCount: Math.max(1, sub.personCount || 1),
                    monthlyAmountPerPerson: (() => {
                      let m = sub.monthlyAmount || 0;
                      if (m === 0 && sub.schemeName) {
                        const match = sub.schemeName.match(/\d+/);
                        if (match) m = parseInt(match[0], 10);
                      }
                      return m;
                    })(),
                    monthlyAmount: sub.monthlyAmount || 0,
                    totalMonthlyAmount: sub.combinedMonthlyAmount || sub.monthlyAmount || 0,
                    durationMonths: 10,
                    totalMonths: 10,
                    dueDateDay: 10,
                    totalSchemeAmount: sub.combinedGrandTotal || ((sub.monthlyAmount || 0) * 10),
                    paidAmount: (sub.monthlyPayments || []).filter(p => ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'].includes(p.status)).reduce((s, p) => s + (p.amount || 0), 0),
                    remainingAmount: Math.max(0, (sub.combinedGrandTotal || ((sub.monthlyAmount || 0) * 10)) - (sub.monthlyPayments || []).filter(p => ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'].includes(p.status)).reduce((s, p) => s + (p.amount || 0), 0)),
                    monthsPaid: sub.monthsPaid || 0,
                    approvalStatus: currentApproval as any,
                    status: sub.status,
                    stage: sub.stage || 'Pending Approval',
                    monthlyPayments: sub.monthlyPayments || []
                  }];

              const activeScheme = (viewingSchemePassbook
                ? enrolledSchemes.find(s => String(s._id || s.schemeId) === String(viewingSchemePassbook._id || viewingSchemePassbook.schemeId))
                : null) || enrolledSchemes[0];
              const totalPersons = enrolledSchemes.reduce((sum, s) => sum + (s.personCount || 1), 0);
              const combinedMonthly = enrolledSchemes.reduce((sum, s) => sum + (s.totalMonthlyAmount || ((s.monthlyAmountPerPerson || 0) * (s.personCount || 1))), 0);
              const combinedGrand = enrolledSchemes.reduce((sum, s) => sum + (s.totalSchemeAmount || ((s.totalMonthlyAmount || 0) * (s.durationMonths || 10))), 0);
              const totalPaid = enrolledSchemes.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
              const balanceRemaining = Math.max(0, combinedGrand - totalPaid);

              // Schedule generation for activeScheme
              const schemeDuration = activeScheme.durationMonths || activeScheme.totalMonths || 10;
              const schemeDueDateDay = activeScheme.dueDateDay || 10;
              const schemeMonthlyTotal = activeScheme.totalMonthlyAmount || (activeScheme.monthlyAmountPerPerson * activeScheme.personCount);
              const schemeMonthList = Array.from({ length: schemeDuration }, (_, i) => i + 1);

              return (
                <>
                  {/* Modal Header */}
                  <DialogHeader className="border-b border-gray-100 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-100 text-[#7A1416] font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                            Application Details
                          </span>
                          <span className="font-mono text-xs font-black text-[#7A1416] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {sub.applicationNumber || `APP-${String(sub._id || sub.id).slice(-5)}`}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-extrabold text-[11px] ${
                            currentApproval === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            currentApproval === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {currentApproval}
                          </span>
                        </div>
                        <DialogTitle className="text-2xl font-extrabold text-[#2A1B54] mt-1">
                          {sub.name || sub.customerName}
                        </DialogTitle>
                      </div>

                      <div className="flex items-center gap-2">
                        {currentApproval === 'Pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveApplicationPrompt(sub)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>Approve Application</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectApplicationPrompt(sub)}
                              className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs px-3 py-2 rounded-xl transition-all border border-rose-300 flex items-center gap-1.5 cursor-pointer"
                            >
                              <X className="w-4 h-4 stroke-[3]" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </DialogHeader>

                  {/* Customer Information Grid */}
                  <div className="bg-gray-50 border border-gray-200/90 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500 block text-[11px]">Mobile Number:</span>
                      <strong className="text-gray-900 font-mono text-xs">{sub.phone || sub.mobileNumber}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Email ID:</span>
                      <strong className="text-gray-900 font-semibold">{sub.email || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Location:</span>
                      <strong className="text-gray-900 font-semibold">{sub.location}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Applied Date:</span>
                      <strong className="text-gray-900 font-semibold">
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                      </strong>
                    </div>
                  </div>

                  {/* Aggregated Application Summary Banner */}
                  <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-[#7A1416]" />
                        <span>Combined Application Financial Summary</span>
                      </h3>
                      <span className="bg-[#7A1416] text-white font-extrabold text-xs px-3 py-1 rounded-full">
                        {totalPersons} Total Person(s) Enrolled
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3.5 rounded-xl border border-amber-200/60 shadow-2xs">
                      <div>
                        <span className="text-gray-500 text-[11px] block">Combined Monthly</span>
                        <strong className="text-emerald-700 text-sm font-black">₹{combinedMonthly.toLocaleString()} / mo</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[11px] block">Combined Grand Total</span>
                        <strong className="text-[#2A1B54] text-sm font-black">₹{combinedGrand.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[11px] block">Total Paid Till Date</span>
                        <strong className="text-emerald-700 text-sm font-black">₹{totalPaid.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[11px] block">Remaining Due</span>
                        <strong className="text-rose-700 text-sm font-black">₹{balanceRemaining.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>

                  {/* ITEM-WISE CALCULATION BREAKDOWN FORMULA BANNER (User Request: 300 x 5 = 1500, 500 x 3 = 1500, etc.) */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#7A1416] text-white p-1 rounded-md">
                          <Receipt className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-xs font-black uppercase text-[#7A1416] tracking-wide">
                          Chits Calculation Formula Breakdown
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-600">
                        Formula: Rate × Persons = Monthly Amount
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {enrolledSchemes.map((schItem, idx) => {
                        const rate = schItem.monthlyAmountPerPerson || schItem.monthlyAmount || schItem.price || 0;
                        const count = schItem.personCount || 1;
                        const subTot = schItem.totalMonthlyAmount || (rate * count);
                        return (
                          <div key={idx} className="bg-white border border-amber-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
                            <div>
                              <div className="text-xs font-black text-[#2A1B54] truncate max-w-[130px]">{schItem.schemeName}</div>
                              <div className="text-[10px] text-gray-500 font-medium">₹{rate} / person</div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-xs font-black text-[#7A1416] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {rate} × {count} = ₹{subTot.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">{count} Person{count > 1 ? 's' : ''}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-white/90 border border-amber-300 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="font-mono font-bold text-gray-800 text-[11px]">
                        <span className="text-gray-500 font-sans">Calculation Summary: </span>
                        <span className="text-[#7A1416] font-black">
                          {enrolledSchemes.map(s => {
                            const rate = s.monthlyAmountPerPerson || s.monthlyAmount || s.price || 0;
                            const count = s.personCount || 1;
                            return `${rate} × ${count} = ${rate * count}`;
                          }).join(" + ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-bold text-gray-700">
                          Total Persons: <span className="font-black text-[#7A1416] text-sm">{totalPersons}</span>
                        </div>
                        <div className="font-bold text-gray-700">
                          Monthly Payable: <span className="font-black text-emerald-700 text-sm">₹{combinedMonthly.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SCHEME-WISE BREAKDOWN TABLE (REQUIREMENT 4) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-[#2A1B54] text-xs uppercase tracking-wide flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-[#7A1416]" />
                        <span>Scheme-Wise Enrollment Breakdown ({enrolledSchemes.length} Scheme{enrolledSchemes.length > 1 ? 's' : ''})</span>
                      </h4>
                      <span className="text-[11px] text-gray-500 font-medium">Click "View Schedule" to see month-wise passbook</span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-2xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-100 text-gray-700 uppercase font-extrabold tracking-wider border-b border-gray-200">
                            <th className="p-3">Scheme Name</th>
                            <th className="p-3 text-right">Amount / Person</th>
                            <th className="p-3 text-center">Persons</th>
                            <th className="p-3 text-right">Monthly Total</th>
                            <th className="p-3 text-center">Duration</th>
                            <th className="p-3 text-right">Grand Total</th>
                            <th className="p-3 text-right">Paid Amount</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {enrolledSchemes.map((schItem, sIdx) => {
                            const isCurrentSelected = String(schItem._id || schItem.schemeId) === String(activeScheme._id || activeScheme.schemeId);
                            const schApproved = schItem.approvalStatus === 'Approved' || sub.approvalStatus === 'Approved';

                            return (
                              <tr
                                key={sIdx}
                                className={`hover:bg-gray-50 transition-colors ${
                                  isCurrentSelected ? 'bg-amber-50/40 ring-1 ring-[#7A1416]/20' : ''
                                }`}
                              >
                                <td className="p-3">
                                  <span className="font-extrabold text-[#2A1B54] text-xs block">
                                    {schItem.schemeName}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    Due: Before {schItem.dueDateDay || 10}th
                                  </span>
                                </td>
                                <td className="p-3 text-right font-semibold text-gray-800">
                                  ₹{schItem.monthlyAmountPerPerson?.toLocaleString()}
                                </td>
                                <td className="p-3 text-center">
                                  <span className="bg-amber-100 text-amber-900 font-extrabold text-[11px] px-2 py-0.5 rounded">
                                    {schItem.personCount} Person(s)
                                  </span>
                                </td>
                                <td className="p-3 text-right font-black text-emerald-700">
                                  ₹{schItem.totalMonthlyAmount?.toLocaleString()}
                                </td>
                                <td className="p-3 text-center font-semibold text-gray-700">
                                  {schItem.durationMonths || 10}m
                                </td>
                                <td className="p-3 text-right font-bold text-[#2A1B54]">
                                  ₹{schItem.totalSchemeAmount?.toLocaleString()}
                                </td>
                                <td className="p-3 text-right">
                                  <strong className="text-emerald-700">₹{schItem.paidAmount?.toLocaleString()}</strong>
                                  <div className="text-[10px] text-gray-400">
                                    {schItem.monthsPaid} / {schItem.durationMonths || 10} Paid
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    schApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {schApproved ? 'Approved' : 'Pending'}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {schApproved && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPaymentModal(sub, schItem, (schItem.monthsPaid || 0) + 1)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                        title="Record Next Month Payment"
                                      >
                                        <Plus className="w-3 h-3 stroke-[3]" />
                                        <span>Pay</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setViewingSchemePassbook(schItem)}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                        isCurrentSelected
                                          ? "bg-[#7A1416] text-white"
                                          : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                                      }`}
                                    >
                                      <span>Schedule</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ACTIVE SCHEME MONTHWISE SCHEDULE & PAYMENT LOGS */}
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
                      <div>
                        <div className="text-xs font-black text-amber-950 flex items-center gap-1.5 uppercase">
                          <Calendar className="w-4 h-4 text-[#7A1416]" />
                          <span>Monthwise Schedule: {activeScheme.schemeName}</span>
                        </div>
                        <span className="text-[11px] text-gray-600">
                          {activeScheme.personCount} Person(s) • Monthly/Person: <strong className="text-gray-900">₹{activeScheme.monthlyAmountPerPerson?.toLocaleString()}</strong> • Expected Monthly: <strong className="text-emerald-700">₹{schemeMonthlyTotal.toLocaleString()}</strong> • Scheme Total: <strong className="text-[#2A1B54]">₹{(activeScheme.totalSchemeAmount || (schemeMonthlyTotal * schemeDuration)).toLocaleString()}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-[#7A1416] text-white text-xs font-bold px-3 py-1 rounded-xl">
                          {activeScheme.monthsPaid || 0} / {schemeDuration} Months Paid
                        </span>
                      </div>
                    </div>

                    {/* Scheme Selector Tabs when multiple schemes are present */}
                    {enrolledSchemes.length > 1 && (
                      <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                        <span className="text-xs font-extrabold text-gray-600">Switch Scheme Schedule:</span>
                        {enrolledSchemes.map((schTab, tIdx) => {
                          const isTabActive = String(schTab._id || schTab.schemeId) === String(activeScheme._id || activeScheme.schemeId);
                          return (
                            <button
                              key={tIdx}
                              type="button"
                              onClick={() => setViewingSchemePassbook(schTab)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                                isTabActive
                                  ? "bg-[#7A1416] text-white shadow-2xs"
                                  : "bg-white hover:bg-gray-100 text-gray-800 border border-gray-200"
                              }`}
                            >
                              <span>{schTab.schemeName}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                isTabActive ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900"
                              }`}>
                                {schTab.personCount}p
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-gray-100 text-gray-700 uppercase font-extrabold tracking-wider border-b border-gray-200">
                            <th className="p-3.5 w-14 text-center">#</th>
                            <th className="p-3.5">Installment</th>
                            <th className="p-3.5">Expected Amount</th>
                            <th className="p-3.5">Amount Paid</th>
                            <th className="p-3.5">Status &amp; Method</th>
                            <th className="p-3.5">Receipt No</th>
                            <th className="p-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {schemeMonthList.map((mNum) => {
                            const existingLog = (activeScheme.monthlyPayments || []).find(p => p.monthNumber === mNum);
                            const isPaid = existingLog && ['Paid', 'Late Pay', 'Advanced Payment', 'Advance Payment', 'On-time Payment', 'Delay Payment'].includes(existingLog.status || '');
                            const timingStatus = existingLog?.status || (isPaid ? 'Paid' : 'Pending');
                            const receiptNumber = existingLog?.receiptNumber ? existingLog.receiptNumber.replace(/^AB-CHIT-/i, "SY-CHIT-") : (isPaid ? `SY-CHIT-000${mNum}` : '-');

                            return (
                              <tr
                                key={mNum}
                                className={`hover:bg-gray-50 transition-colors ${
                                  isPaid ? 'bg-emerald-50/30' : ''
                                }`}
                              >
                                <td className="p-3.5 text-center font-bold text-gray-400">
                                  {mNum}
                                </td>
                                <td className="p-3.5 font-extrabold text-gray-900">
                                  Month {mNum}
                                </td>
                                <td className="p-3.5 font-semibold text-gray-700">
                                  ₹{schemeMonthlyTotal.toLocaleString()}
                                </td>
                                <td className="p-3.5 font-black text-emerald-700">
                                  {isPaid ? `₹${(existingLog?.amount || schemeMonthlyTotal).toLocaleString()}` : "₹0"}
                                </td>
                                <td className="p-3.5">
                                  {isPaid ? (
                                    <div className="space-y-0.5">
                                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        {timingStatus}
                                      </span>
                                      {existingLog?.paidAt && (
                                        <div className="text-[10px] text-gray-500">
                                          {new Date(existingLog.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {existingLog.paymentMethod || 'Cash'}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="bg-gray-100 text-gray-500 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                      Pending
                                    </span>
                                  )}
                                </td>
                                <td className="p-3.5 font-mono text-[11px] font-bold text-gray-700">
                                  {receiptNumber}
                                </td>
                                <td className="p-3.5 text-right">
                                  {isPaid ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveReceipt({
                                          receiptNumber: (existingLog?.receiptNumber ? existingLog.receiptNumber.replace(/^AB-CHIT-/i, "SY-CHIT-") : `SY-CHIT-000${mNum}`),
                                          applicationNumber: (sub.applicationNumber ? sub.applicationNumber.replace(/^AB-APP-/i, "SY-APP-") : `SY-APP-${String(sub._id || sub.id).slice(-5)}`),
                                          customerName: sub.name || "Customer",
                                          phone: sub.phone || "",
                                          email: sub.email,
                                          location: sub.location,
                                          schemeName: activeScheme.schemeName,
                                          personCount: activeScheme.personCount,
                                          monthlyAmountPerPerson: activeScheme.monthlyAmountPerPerson,
                                          expectedMonthlyAmount: schemeMonthlyTotal,
                                          amountReceived: existingLog?.amount || schemeMonthlyTotal,
                                          paymentMethod: existingLog?.paymentMethod || "Cash",
                                          transactionId: existingLog?.transactionNumber || existingLog?.transactionId || "",
                                          paymentDate: existingLog?.paidAt || new Date(),
                                          paymentStatus: "PAID",
                                          installmentMonth: `Month ${mNum} / ${schemeDuration}`,
                                          monthNumber: mNum,
                                          totalPaidTillDate: activeScheme.paidAmount,
                                          remainingSchemeBalance: activeScheme.remainingAmount,
                                          totalMonths: schemeDuration,
                                          paidMonths: activeScheme.monthsPaid,
                                          notes: existingLog?.notes,
                                          schemesBreakdown: enrolledSchemes.map(s => {
                                            const rate = s.monthlyAmountPerPerson || s.monthlyAmount || s.price || 0;
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
                                          totalPersons: totalPersons,
                                          combinedMonthlyPayable: combinedMonthly
                                        });
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                      title="View / Download / Print Receipt"
                                    >
                                      <FileText className="w-3 h-3" />
                                      <span>Receipt</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPaymentModal(sub, activeScheme, mNum)}
                                      className="bg-[#7A1416] hover:bg-[#900000] text-white font-bold text-[11px] px-2.5 py-1 rounded-xl transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      <span>Record Pay</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}

            <DialogFooter>
              <button
                type="button"
                onClick={() => {
                  setSelectedSubscription(null);
                  setViewingSchemePassbook(null);
                }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Details
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 5: ADMIN PAYMENT ENTRY MODAL (WITH PERSON COUNT & AUTO RECEIPT) */}
      {paymentModalState.isOpen && (
        <Dialog open={paymentModalState.isOpen} onOpenChange={(open) => setPaymentModalState(prev => ({ ...prev, isOpen: open }))}>
          <DialogContent className="sm:max-w-md p-6 bg-white rounded-3xl font-sans space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold text-[#2A1B54] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Record Installment Payment</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600">
                Customer: <strong className="text-gray-900">{paymentModalState.subscription?.name}</strong> • Scheme: <strong className="text-[#7A1416]">{paymentModalState.schemeName}</strong>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmPaymentEntry} className="space-y-3.5 text-xs">
              {/* Scheme Summary Badge */}
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200/80 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-black text-amber-950">
                  <span>{paymentModalState.monthName || `Month ${paymentModalState.monthNumber}`}</span>
                  <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-black text-[10px]">
                    {paymentModalState.personCount} Person(s)
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-amber-200/60 pt-1">
                  <span className="text-gray-600">Expected Installment:</span>
                  <strong className="text-emerald-800 text-sm font-black">
                    ₹{paymentModalState.expectedMonthlyAmount.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Installment Month Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Installment Month *
                </label>
                <select
                  value={paymentModalState.monthNumber}
                  onChange={(e) => {
                    const m = parseInt(e.target.value, 10);
                    setPaymentModalState(prev => ({
                      ...prev,
                      monthNumber: m,
                      monthName: `Month ${m}`
                    }));
                  }}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold text-gray-900"
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>
                      Month {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Received */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  value={paymentModalState.amount}
                  onChange={(e) => setPaymentModalState(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full text-xs font-black p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none text-emerald-800 text-sm"
                  required
                />
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Payment Date *
                </label>
                <input
                  type="date"
                  value={paymentModalState.paymentDate}
                  onChange={(e) => setPaymentModalState(prev => ({ ...prev, paymentDate: e.target.value }))}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold"
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentModalState.paymentMethod}
                  onChange={(e) => setPaymentModalState(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold text-gray-900"
                  required
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Transaction ID / Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TXN123456 or Receipt #99"
                  value={paymentModalState.transactionNumber}
                  onChange={(e) => setPaymentModalState(prev => ({ ...prev, transactionNumber: e.target.value }))}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received via store counter"
                  value={paymentModalState.notes}
                  onChange={(e) => setPaymentModalState(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none"
                />
              </div>

              <DialogFooter className="gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setPaymentModalState(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save Payment &amp; Generate Receipt</span>
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 6: ACTION CONFIRMATION DIALOG */}
      {confirmModal.isOpen && (
        <Dialog open={confirmModal.isOpen} onOpenChange={(open) => setConfirmModal(prev => ({ ...prev, isOpen: open }))}>
          <DialogContent className="sm:max-w-md p-6 bg-white rounded-3xl text-center space-y-4 font-sans">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-[#7A1416] mx-auto flex items-center justify-center border-4 border-amber-50">
              <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
            </div>

            <DialogHeader className="text-center space-y-1">
              <DialogTitle className="text-lg font-extrabold text-gray-900">
                {confirmModal.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600">
                {confirmModal.message}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`w-full py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${confirmModal.confirmColor}`}
              >
                {confirmModal.confirmText}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 7: OFFICIAL CHIT PAYMENT RECEIPT MODAL (VIEW / DOWNLOAD PDF / PRINT) */}
      <ChitReceiptModal
        isOpen={!!activeReceipt}
        onClose={() => setActiveReceipt(null)}
        receipt={activeReceipt}
      />

      {/* MODAL 8: EXCEL EXPORT DIALOG WITH DATE SORTING */}
      <ExcelExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Chit Applications to Excel"
        description="Download customer chit scheme applications in Microsoft Excel (.xlsx) format with customizable date sorting and date range filter."
        totalCount={filteredSubscriptions.length}
        items={filteredSubscriptions}
        getDate={(s) => s.createdAt || s.date || s.updatedAt}
        onExport={handleExportChitScheme}
      />
    </div>
  );
};

export default AdminChitScheme;
