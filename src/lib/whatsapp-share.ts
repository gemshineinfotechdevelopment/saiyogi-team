import { toast } from "sonner";
import { uploadImageToCloudinary } from "@/lib/api";

export interface SharePdfOptions {
  pdfBlob: Blob;
  fileName: string;
  customerPhone?: string;
  customerName?: string;
  title: string;
  summaryLines?: string[];
}

/**
 * Share a PDF document directly to WhatsApp without downloading to the user's device disk.
 *
 * 1. Mobile & Web-Share enabled browsers: Uses Web Share API (Level 2) to attach the actual
 *    in-memory PDF file directly to WhatsApp.
 * 2. Desktop browsers: Uploads the PDF in memory to the server / Cloudinary to generate
 *    an instant public link, then opens WhatsApp Web with the direct viewable/downloadable
 *    PDF link and order/chit summary.
 */
export async function sharePdfToWhatsApp({
  pdfBlob,
  fileName,
  customerPhone = "",
  customerName = "Customer",
  title,
  summaryLines = [],
}: SharePdfOptions): Promise<boolean> {
  const cleanPhone = (customerPhone || "").replace(/\D/g, "");
  // Prepend 91 for standard 10-digit Indian mobile numbers
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

  // 1. Native Web Share API (Mobile Android Chrome, iOS Safari, etc. - attaches actual PDF document)
  if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        title: `Sai Yogi Crackers - ${title}`,
        text: `*SAI YOGI CRACKERS* 🎆\nHello ${customerName}, please find your official ${title} attached.\n\nThank you for choosing Sai Yogi Crackers! 🙏`,
        files: [pdfFile],
      });
      return true;
    } catch (shareErr: any) {
      if (shareErr.name === "AbortError") {
        // User closed or dismissed the native share sheet
        return false;
      }
      console.warn("Native Web Share failed, falling back to WhatsApp link:", shareErr);
    }
  }

  // 2. Fallback for Desktop WhatsApp Web: Upload in memory (no disk download) to obtain direct PDF link
  toast.loading("Uploading PDF to generate WhatsApp link...", { id: "wa-pdf-share" });
  let pdfUrl = "";

  try {
    pdfUrl = await uploadImageToCloudinary(pdfFile, "bills_and_receipts");
  } catch (uploadErr) {
    console.warn("Upload failed:", uploadErr);
  }

  // If a relative path was returned from server fallback (/uploads/...), prepend current origin
  if (pdfUrl && !pdfUrl.startsWith("http://") && !pdfUrl.startsWith("https://")) {
    const origin = window.location.origin;
    pdfUrl = `${origin}${pdfUrl.startsWith("/") ? "" : "/"}${pdfUrl}`;
  }

  const messageLines: string[] = [
    `*SAI YOGI CRACKERS* 🎆`,
    `--------------------------------------------`,
    `Hello *${customerName || "Customer"}*,`,
    `Here is your official *${title}* from Sai Yogi Crackers:`,
    ``,
  ];

  if (pdfUrl) {
    messageLines.push(`📄 *View / Download PDF Document:*`);
    messageLines.push(pdfUrl);
    messageLines.push(``);
  }

  if (summaryLines.length > 0) {
    messageLines.push(...summaryLines);
    messageLines.push(`--------------------------------------------`);
  }

  messageLines.push(`Thank you for choosing *Sai Yogi Crackers*! 🙏`);
  messageLines.push(`_Sattur, Virudhunagar District, Tamil Nadu • 📞 +91 95859 75756_`);

  const encodedMessage = encodeURIComponent(messageLines.join("\n"));
  const waUrl = formattedPhone
    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`
    : `https://api.whatsapp.com/send?text=${encodedMessage}`;

  toast.dismiss("wa-pdf-share");
  window.open(waUrl, "_blank");
  return true;
}
