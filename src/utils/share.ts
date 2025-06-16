import { MaintenanceTask, PurchaseOrder, Vendor } from '@/types/maintenance';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { sendSMSMessage } from './sms';

export async function generatePDF(elementId: string): Promise<Blob> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');

  const canvas = await html2canvas(element);
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/png');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  return pdf.output('blob');
}

export async function shareViaEmail(
  subject: string,
  body: string,
  attachment?: Blob,
  filename?: string
) {
  if (attachment && filename) {
    const file = new File([attachment], filename, { type: 'application/pdf' });
    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: subject,
          text: body,
        });
        return;
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  }
  
  // Fallback to mailto
  const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoLink);
}

export async function shareViaSMS(text: string, phoneNumber?: string) {
  if (!phoneNumber) {
    // If no phone number is provided, show a prompt to enter one
    const promptResult = window.prompt('Enter phone number (e.g., +1234567890):');
    if (!promptResult) return; // User cancelled
    phoneNumber = promptResult;
  }

  try {
    const messageId = await sendSMSMessage(phoneNumber, text);
    return { success: true, messageId };
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatTaskForSharing(task: MaintenanceTask): string {
  return `
Maintenance Task: ${task.title}
Type: ${task.type}
Priority: ${task.priority}
Status: ${task.status}
Start Date: ${new Date(task.startDate).toLocaleDateString()}
Description: ${task.description}
Created by: ${task.createdBy}
  `.trim();
}

export function formatPOForSharing(po: PurchaseOrder, vendor: Vendor): string {
  return `
Purchase Order: ${po.poNumber}
Vendor: ${vendor.name}
Status: ${po.status}
Total Amount: $${po.totalAmount.toFixed(2)}
Request Date: ${new Date(po.requestDate).toLocaleDateString()}
Requested By: ${po.requestedBy}
  `.trim();
} 