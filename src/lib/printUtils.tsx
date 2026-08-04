import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BillPrintTemplate } from '@/components/printing/BillPrintTemplate';
import { Settings } from '@/context/SettingsContext';

export const generateBillPDF = async (billData: any, settings: Settings | null, copyType: string = 'Original Copy') => {
  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  const root = createRoot(container);
  
  // Render the template
  root.render(<BillPrintTemplate data={billData} settings={settings} copyType={copyType} />);

  // Wait for images and fonts to load
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    const target = container.querySelector('#bill-print-template') as HTMLElement;
    if (!target) throw new Error("Template not found");

    const canvas = await html2canvas(target, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate the height of one A4 page in canvas pixels
    const pageHeightInPixels = (canvasWidth * pdfHeight) / pdfWidth;
    
    let heightLeft = canvasHeight;
    let position = 0;
    let pageNumber = 1;

    // Add the first page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, (canvasHeight * pdfWidth) / canvasWidth);
    heightLeft -= pageHeightInPixels;

    // Add subsequent pages if needed
    while (heightLeft > 0) {
      position = -(pageHeightInPixels * pageNumber);
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, (canvasHeight * pdfWidth) / canvasWidth);
      heightLeft -= pageHeightInPixels;
      pageNumber++;
    }

    pdf.save(`${billData.billType}-${billData.billNo}.pdf`);
    
    return true;
  } catch (error) {
    console.error("PDF Generation failed:", error);
    return false;
  } finally {
    // Cleanup
    root.unmount();
    document.body.removeChild(container);
  }
};
