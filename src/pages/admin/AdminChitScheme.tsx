import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminNavbar from "@/components/layout/AdminNavbar";
import {
  Image as ImageIcon, Upload, Trash2, AlertCircle, Edit2, FileText, Loader2, X, Users,
  CheckCircle2, Clock, Search, Filter, Phone, MapPin, Mail, RefreshCw, Check, XCircle,
  Eye, CheckCheck, Calendar, Plus, ArrowLeft, User, DollarSign, Award, ChevronRight, AlertTriangle,
  Share2, MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
  deleteChitSubscription,
  ChitSubscriptionItem,
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
  const [stageFilter, setStageFilter] = useState("all");

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

  // Admin Payment Entry Modal State
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    subscription: ChitSubscriptionItem | null;
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
      setSubscriptions(data || []);

      // If customer modal is open, refresh selected subscription
      if (selectedSubscription) {
        const found = (data || []).find(
          s => (s._id || s.id) === (selectedSubscription._id || selectedSubscription.id)
        );
        if (found) setSelectedSubscription(found);
      }
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

      await createChitScheme({
        title: uploadTitle.trim(),
        schemeName: uploadTitle.trim(),
        description: uploadDescription.trim(),
        url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1200&auto=format&fit=crop",
        startDate: uploadStartDate,
        totalMonths: parseInt(uploadTotalMonths, 10) || 9,
        numberOfMonths: parseInt(uploadTotalMonths, 10) || 9,
        dueDateDay: parseInt(uploadDueDateDay, 10) || 10,
        paymentDueDay: parseInt(uploadDueDateDay, 10) || 10,
        monthlyAmount: parseFloat(uploadMonthlyAmount) || 0,
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

      if (uploadImageSelectedSchemeId) {
        const targetScheme = schemes.find(s => String(s.id) === String(uploadImageSelectedSchemeId));
        if (targetScheme) {
          await updateChitScheme(targetScheme.id, { url: cloudinaryUrl });
          toast.success("Scheme image updated successfully!", { id: "img-toast" });
        }
      } else if (schemes.length > 0) {
        // Update first active scheme or create scheme image entry
        await updateChitScheme(schemes[0].id, { url: cloudinaryUrl });
        toast.success("Scheme image uploaded successfully!", { id: "img-toast" });
      } else {
        await createChitScheme({
          title: "Sai Yogi Chit Scheme",
          schemeName: "Sai Yogi Chit Scheme",
          url: cloudinaryUrl,
          status: "Active"
        });
        toast.success("Scheme image uploaded successfully!", { id: "img-toast" });
      }

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
    setEditingScheme(sch);
    setEditTitle(sch.title || sch.schemeName || "");
    setEditDescription(sch.description || "");
    setEditStartDate(sch.startDate || new Date().toISOString().split('T')[0]);
    setEditTotalMonths(String(sch.totalMonths || sch.numberOfMonths || 9));
    setEditDueDateDay(String(sch.dueDateDay || sch.paymentDueDay || 10));
    setEditMonthlyAmount(String(sch.monthlyAmount || 0));
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

      await updateChitScheme(editingScheme.id, {
        title: editTitle.trim(),
        schemeName: editTitle.trim(),
        description: editDescription.trim(),
        url: finalUrl,
        startDate: editStartDate,
        totalMonths: parseInt(editTotalMonths, 10) || 9,
        numberOfMonths: parseInt(editTotalMonths, 10) || 9,
        dueDateDay: parseInt(editDueDateDay, 10) || 10,
        paymentDueDay: parseInt(editDueDateDay, 10) || 10,
        monthlyAmount: parseFloat(editMonthlyAmount) || 0,
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
          await approveChitSubscriptionApi(id);
          toast.success("Application approved! Customer is now an active chit member.", { id: "app-toast" });
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
          await rejectChitSubscriptionApi(id);
          toast.success("Application rejected.", { id: "app-toast" });
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
    monthNum: number,
    monthName: string,
    dueDate: string,
    amount: number,
    existingLog?: MonthlyPaymentLog
  ) => {
    setPaymentModalState({
      isOpen: true,
      subscription: sub,
      monthNumber: monthNum,
      monthName,
      dueDate,
      amount,
      paymentDate: existingLog?.paidAt ? new Date(existingLog.paidAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: existingLog?.paymentMethod || 'UPI',
      transactionNumber: existingLog?.transactionNumber || '',
      notes: existingLog?.notes || '',
      isEdit: !!existingLog && existingLog.status === 'Paid'
    });
  };

  // Confirm Admin Payment Submission Handler
  const handleConfirmPaymentEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const { subscription, monthNumber, monthName, dueDate, amount, paymentDate, paymentMethod, transactionNumber, notes } = paymentModalState;
    if (!subscription) return;

    try {
      toast.loading("Recording monthly payment...", { id: "pay-toast" });
      const id = subscription._id || subscription.id || "";
      await updateMonthPaymentStatusApi(id, {
        monthNumber,
        monthName,
        dueDate,
        amount,
        status: 'Paid',
        paymentDate,
        paymentMethod,
        transactionNumber,
        notes: notes || `Paid via ${paymentMethod} on ${paymentDate}`
      });

      toast.success(`Payment for ${monthName} recorded as Paid!`, { id: "pay-toast" });
      setPaymentModalState(prev => ({ ...prev, isOpen: false }));
      loadSubscriptions();
    } catch (err: any) {
      toast.error("Failed to save payment: " + (err.message || err), { id: "pay-toast" });
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

  // Helper to determine On-time vs Delay Payment based on due day
  const getPaymentTimingStatus = (paidDateStr: string | undefined, dueDateDay: number): "On-time Payment" | "Delay Payment" => {
    if (!paidDateStr) return "On-time Payment";
    const paidDate = new Date(paidDateStr);
    if (isNaN(paidDate.getTime())) return "On-time Payment";
    const paidDay = paidDate.getDate();
    return paidDay <= dueDateDay ? "On-time Payment" : "Delay Payment";
  };

  // WhatsApp Receipt Share Function
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
    const timingStatus = getPaymentTimingStatus(paidAt, dueDateDay);

    const text = 
`*SAI YOGI CRACKERS - CHIT SCHEME PAYMENT RECEIPT* 🧾
--------------------------------------------
*Subscriber:* ${customerName}
*Mobile:* ${sub.phone || sub.mobileNumber}
*Scheme:* ${schemeName}
*Month:* Month ${monthNumber} (${monthName})
*Amount Paid:* ₹${amount.toLocaleString()}
*Payment Date:* ${formattedDate}
*Payment Status:* ${timingStatus}
*Payment Method:* ${paymentMethod || 'Cash/UPI'}${transactionNumber ? ` (#${transactionNumber})` : ''}
--------------------------------------------
Thank you for your payment! 🙏
_Sai Yogi Crackers_`;

    const encodedText = encodeURIComponent(text);
    const waUrl = rawPhone ? `https://api.whatsapp.com/send?phone=91${rawPhone}&text=${encodedText}` : `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  // Filter Customer Applications
  const filteredSubscriptions = subscriptions.filter(sub => {
    const name = (sub.name || sub.customerName || "").toLowerCase();
    const phone = (sub.phone || sub.mobileNumber || "").toLowerCase();
    const sch = (sub.schemeName || "").toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch = !q || name.includes(q) || phone.includes(q) || sch.includes(q);

    const matchesScheme = schemeFilter === "all" || sub.schemeName === schemeFilter;

    const currentApproval = sub.approvalStatus || (sub.status === 'Paid' || sub.status === 'Approved' ? 'Approved' : (sub.status === 'Rejected' ? 'Rejected' : 'Pending'));
    const matchesApproval = approvalFilter === "all" || currentApproval === approvalFilter;

    const matchesPayment = paymentFilter === "all" ||
      (paymentFilter === "Paid" && (sub.monthsPaid || 0) > 0) ||
      (paymentFilter === "Pending" && (sub.monthsPaid || 0) === 0);

    const currentStage = sub.stage || (currentApproval === 'Pending' ? 'Pending Approval' : (currentApproval === 'Rejected' ? 'Rejected' : 'Approved'));
    const matchesStage = stageFilter === "all" || currentStage === stageFilter;

    return matchesSearch && matchesScheme && matchesApproval && matchesPayment && matchesStage;
  });

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

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-600">Filters:</span>
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

              {/* Stage Dropdown */}
              <div>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold text-gray-700"
                >
                  <option value="all">Stage: All ▼</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Payment Started">Payment Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Almost Completed">Almost Completed</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
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
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Mobile &amp; Email</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Selected Scheme</th>
                      <th className="p-4 text-center">Months Paid</th>
                      <th className="p-4 text-[#7A1416] text-right">Approval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredSubscriptions.map((sub, idx) => {
                      const id = sub._id || sub.id || String(idx);
                      const matchedSch = schemes.find(s => (s.title || s.schemeName) === sub.schemeName);
                      const totalMonths = matchedSch?.totalMonths || matchedSch?.numberOfMonths || 9;
                      const paidMonths = sub.monthsPaid || 0;
                      const currentApproval = sub.approvalStatus || (sub.status === 'Paid' || sub.status === 'Approved' ? 'Approved' : (sub.status === 'Rejected' ? 'Rejected' : 'Pending'));

                      return (
                        <tr key={id} className="hover:bg-gray-50/90 transition-colors">
                          {/* Column 1: Customer Name (Clickable) */}
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => setSelectedSubscription(sub)}
                              className="font-extrabold text-[#7A1416] hover:text-[#900000] hover:underline text-sm text-left flex items-center gap-1.5 group cursor-pointer"
                            >
                              <span>{sub.name || sub.customerName || 'Customer'}</span>
                              <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <div className="text-[11px] text-gray-400 font-medium mt-0.5">
                              Applied: {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                            </div>
                          </td>

                          {/* Column 2: Mobile & Email (Stacked Neatly) */}
                          <td className="p-4">
                            <div className="font-extrabold text-gray-900 font-mono text-xs flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>{sub.phone || sub.mobileNumber}</span>
                            </div>
                            {sub.email ? (
                              <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="truncate max-w-[180px]">{sub.email}</span>
                              </div>
                            ) : (
                              <div className="text-[11px] text-gray-400 italic mt-0.5">No email</div>
                            )}
                          </td>

                          {/* Column 3: Location */}
                          <td className="p-4 text-gray-700 font-semibold">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>{sub.location}</span>
                            </div>
                          </td>

                          {/* Column 4: Selected Scheme */}
                          <td className="p-4">
                            <div className="font-extrabold text-[#2A1B54]">
                              {sub.schemeName}
                            </div>
                            {matchedSch?.monthlyAmount ? (
                              <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                                ₹{matchedSch.monthlyAmount.toLocaleString()} / month ({totalMonths}m)
                              </div>
                            ) : null}
                          </td>

                          {/* Column 5: Months Paid */}
                          <td className="p-4 text-center">
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className="font-extrabold text-gray-900 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full text-xs">
                                {paidMonths} / {totalMonths}
                              </span>
                              <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-[#7A1416] h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, (paidMonths / totalMonths) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Column 6: Approval Actions / Status */}
                          <td className="p-4 text-right">
                            {currentApproval === 'Pending' ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="bg-amber-100 text-amber-800 font-extrabold text-[11px] px-2.5 py-1 rounded-full border border-amber-300">
                                  Pending
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleApproveApplicationPrompt(sub)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectApplicationPrompt(sub)}
                                  className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs px-2.5 py-1.5 rounded-xl transition-all border border-rose-300 flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5 stroke-[3]" /> Reject
                                </button>
                              </div>
                            ) : currentApproval === 'Approved' ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1 inline-flex">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Approved
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedSubscription(sub)}
                                  className="text-xs text-[#7A1416] hover:underline font-bold"
                                >
                                  Manage Payments →
                                </button>
                              </div>
                            ) : (
                              <span className="bg-rose-100 text-rose-800 font-extrabold text-xs px-3 py-1 rounded-full border border-rose-300 inline-flex items-center gap-1">
                                <XCircle className="w-3.5 h-3.5 text-rose-700" /> Rejected
                              </span>
                            )}
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

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300/80 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#7A1416]" />
                <span>Add Scheme</span>
              </button>
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

      {/* MODAL 4: CUSTOMER CHIT DETAILS & PAYMENT PROGRESS MODAL (Clicked Customer Name) */}
      {selectedSubscription && (
        <Dialog open={!!selectedSubscription} onOpenChange={() => setSelectedSubscription(null)}>
          <DialogContent className="max-w-4xl p-6 sm:p-8 bg-white rounded-3xl font-sans max-h-[90vh] overflow-y-auto space-y-6">
            {(() => {
              const sub = selectedSubscription;
              const matchedScheme = schemes.find(
                s => (s.title || s.schemeName) === sub.schemeName
              );
              const totalMonths = matchedScheme?.totalMonths || matchedScheme?.numberOfMonths || 9;
              const startDateStr = matchedScheme?.startDate;
              const dueDateDay = matchedScheme?.dueDateDay || matchedScheme?.paymentDueDay || 10;
              const monthlyAmount = matchedScheme?.monthlyAmount || 0;

              const totalSchemeAmount = monthlyAmount * totalMonths;
              const paidMonthsCount = sub.monthsPaid || 0;
              const amountPaid = monthlyAmount * paidMonthsCount;
              const remainingAmount = Math.max(0, totalSchemeAmount - amountPaid);

              const currentApproval = sub.approvalStatus || (sub.status === 'Paid' || sub.status === 'Approved' ? 'Approved' : (sub.status === 'Rejected' ? 'Rejected' : 'Pending'));

              // Automatic month-wise schedule generated from startDate + duration
              const monthSchedule = generateScheduleForScheme(startDateStr, totalMonths, dueDateDay, monthlyAmount);

              // Calculated Stage
              const autoStage = sub.stage || (
                currentApproval === 'Pending' ? 'Pending Approval' :
                currentApproval === 'Rejected' ? 'Rejected' :
                paidMonthsCount === 0 ? 'Payment Started' :
                paidMonthsCount >= totalMonths ? 'Completed' :
                paidMonthsCount >= Math.ceil(totalMonths * 0.75) ? 'Almost Completed' : 'In Progress'
              );

              return (
                <>
                  {/* Modal Header */}
                  <DialogHeader className="border-b border-gray-100 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-100 text-[#7A1416] font-extrabold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                            Customer Passbook
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

                      {/* Prominent Due Date Banner */}
                      <div className="bg-amber-100/90 text-amber-950 border border-amber-300 font-extrabold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
                        <span>🔔 Monthly Due Date:</span>
                        <strong className="text-[#7A1416]">Before {dueDateDay}th of every month</strong>
                      </div>
                    </div>
                  </DialogHeader>

                  {/* Customer Info Card */}
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
                      <span className="text-gray-500 block text-[11px]">Selected Scheme:</span>
                      <strong className="text-[#2A1B54] font-bold">{sub.schemeName}</strong>
                    </div>
                  </div>

                  {/* Payment Progress Summary Banner */}
                  <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                        <DollarSign className="w-4.5 h-4.5 text-[#7A1416]" />
                        Payment Progress Summary
                      </h3>
                      <span className="bg-[#7A1416] text-white font-extrabold text-xs px-3 py-1 rounded-full">
                        {paidMonthsCount} / {totalMonths} Months Paid
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs bg-white p-3.5 rounded-xl border border-amber-200/60 shadow-2xs">
                      <div>
                        <span className="text-gray-500 text-[11px] block">Monthly Amount</span>
                        <strong className="text-gray-900 text-sm font-extrabold">₹{monthlyAmount.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[11px] block">Total Duration</span>
                        <strong className="text-gray-900 text-sm font-extrabold">{totalMonths} Months</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[11px] block">Total Scheme Amount</span>
                        <strong className="text-[#2A1B54] text-sm font-extrabold">₹{totalSchemeAmount.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-gray-500 text-[11px] block">Amount Paid</span>
                        <strong className="text-emerald-700 text-sm font-extrabold">₹{amountPaid.toLocaleString()}</strong>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-gray-500 text-[11px] block">Remaining Amount</span>
                        <strong className="text-rose-700 text-sm font-extrabold">₹{remainingAmount.toLocaleString()}</strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-amber-950">
                        <span>Overall Progress</span>
                        <span>{Math.round((paidMonthsCount / totalMonths) * 100)}% Completed</span>
                      </div>
                      <div className="w-full bg-amber-200/70 h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-[#7A1416] h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (paidMonthsCount / totalMonths) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Month-Wise Payment Tracking Schedule */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#7A1416]" />
                        Month-wise Payment Schedule ({totalMonths} Months)
                      </h4>
                      {currentApproval !== 'Approved' && (
                        <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                          ⚠️ Approve application to enable payment entry
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-100 text-gray-700 text-xs uppercase font-extrabold tracking-wider border-b border-gray-200">
                            <th className="p-3.5 w-14 text-center">#</th>
                            <th className="p-3.5">Month</th>
                            <th className="p-3.5">Amount</th>
                            <th className="p-3.5">Payment Status &amp; Method</th>
                            <th className="p-3.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                          {monthSchedule.map((m) => {
                            const existingLog = (sub.monthlyPayments || []).find(p => p.monthNumber === m.monthNumber);
                            const isPaid = existingLog?.status === 'Paid' || existingLog?.status === 'Late Pay';
                            const timingStatus = getPaymentTimingStatus(existingLog?.paidAt, dueDateDay);

                            return (
                              <tr
                                key={m.monthNumber}
                                className={`hover:bg-gray-50 transition-colors ${
                                  isPaid ? 'bg-emerald-50/40' : ''
                                }`}
                              >
                                <td className="p-3.5 text-center font-bold text-gray-400">
                                  {m.monthNumber}
                                </td>

                                <td className="p-3.5 font-extrabold text-gray-900 text-sm">
                                  {m.monthName}
                                </td>

                                <td className="p-3.5 font-bold text-emerald-800">
                                  ₹{m.amount.toLocaleString()}
                                </td>

                                <td className="p-3.5">
                                  {isPaid ? (
                                    <div className="space-y-1">
                                      {timingStatus === 'On-time Payment' ? (
                                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> On-time Payment
                                        </span>
                                      ) : (
                                        <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                                          <Clock className="w-3.5 h-3.5 text-amber-700" /> Delay Payment
                                        </span>
                                      )}
                                      {existingLog?.paidAt && (
                                        <div className="text-[11px] text-gray-600 font-medium">
                                          Paid date: {new Date(existingLog.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                      )}
                                      {existingLog?.paymentMethod && (
                                        <div className="text-[11px] text-gray-500 font-mono">
                                          Method: {existingLog.paymentMethod} {existingLog.transactionNumber ? `(#${existingLog.transactionNumber})` : ''}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="bg-gray-100 text-gray-600 font-bold text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-gray-400" /> Pending
                                    </span>
                                  )}
                                </td>

                                <td className="p-3.5 text-right">
                                  {currentApproval === 'Approved' ? (
                                    isPaid ? (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleShareWhatsAppReceipt(
                                            sub,
                                            m.monthNumber,
                                            m.monthName,
                                            m.amount,
                                            existingLog?.paidAt,
                                            existingLog?.paymentMethod,
                                            existingLog?.transactionNumber,
                                            dueDateDay
                                          )}
                                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                          title="Share Receipt via WhatsApp"
                                        >
                                          <Share2 className="w-3.5 h-3.5" />
                                          <span>Share Receipt</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenPaymentModal(sub, m.monthNumber, m.monthName, m.dueDateStr, m.amount, existingLog)}
                                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold cursor-pointer"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleMarkPaymentPendingPrompt(sub, m.monthNumber, m.monthName)}
                                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold cursor-pointer"
                                        >
                                          Reset Pending
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPaymentModal(sub, m.monthNumber, m.monthName, m.dueDateStr, m.amount)}
                                        className="bg-[#7A1416] hover:bg-[#900000] text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer ml-auto"
                                      >
                                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Mark as Paid
                                      </button>
                                    )
                                  ) : (
                                    <span className="text-gray-400 text-[11px] italic">Approval needed</span>
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
                onClick={() => setSelectedSubscription(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Passbook
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 5: ADMIN PAYMENT ENTRY MODAL */}
      {paymentModalState.isOpen && (
        <Dialog open={paymentModalState.isOpen} onOpenChange={(open) => setPaymentModalState(prev => ({ ...prev, isOpen: open }))}>
          <DialogContent className="sm:max-w-md p-6 bg-white rounded-3xl font-sans">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold text-[#2A1B54] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {paymentModalState.isEdit ? 'Edit Payment Record' : 'Mark Monthly Payment as Paid'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600">
                Customer: <strong className="text-gray-900">{paymentModalState.subscription?.name || paymentModalState.subscription?.customerName}</strong>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleConfirmPaymentEntry} className="space-y-4 py-2 text-xs">
              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200/80 space-y-1">
                <div className="text-xs font-extrabold text-[#7A1416]">
                  {paymentModalState.monthName}
                </div>
                <div className="text-xs text-gray-700 font-medium flex justify-between">
                  <span>Monthly Amount:</span>
                  <strong className="text-emerald-800 font-extrabold text-sm">₹{paymentModalState.amount.toLocaleString()}</strong>
                </div>
              </div>

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

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Transaction / Receipt Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI12345678 or Receipt #99"
                  value={paymentModalState.transactionNumber}
                  onChange={(e) => setPaymentModalState(prev => ({ ...prev, transactionNumber: e.target.value }))}
                  className="w-full text-xs p-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7A1416]/20 focus:border-[#7A1416] outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Notes / Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid at Sivakasi store"
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
                  <span>Confirm Payment</span>
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
    </div>
  );
};

export default AdminChitScheme;
