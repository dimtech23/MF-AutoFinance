import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// Initialize jsPDF with the plugin
const initializePDF = () => {
  const doc = new jsPDF();
  // Add the autoTable plugin to the document instance
  doc.autoTable = autoTable.bind(doc);
  return doc;
};

export const generateServiceReport = async (client) => {
  let doc = null;
  let pdfUrl = null;
  
  try {
    if (!client) {
      throw new Error("Client data is required");
    }

    doc = initializePDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Add header with error handling
    try {
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Service Report", margin, margin + 10);
    } catch (error) {
      console.error("Error setting header:", error);
      throw new Error("Failed to generate PDF header");
    }

    // Add company info
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("MF Auto Finance", margin, margin + 25);
    doc.text("Vehicle Repair Services", margin, margin + 35);
    doc.text(`Report Date: ${format(new Date(), "PPP")}`, margin, margin + 45);

    // Add client info with null checks
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Client Information", margin, margin + 65);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${client.clientName || "N/A"}`, margin, margin + 75);
    doc.text(`Phone: ${client.phoneNumber || "N/A"}`, margin, margin + 85);
    doc.text(`Email: ${client.email || "N/A"}`, margin, margin + 95);

    // Add vehicle info with null checks
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Vehicle Details", margin, margin + 115);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const carDetails = client.carDetails || {};
    doc.text(`Make: ${carDetails.make || "N/A"}`, margin, margin + 125);
    doc.text(`Model: ${carDetails.model || "N/A"}`, margin, margin + 135);
    doc.text(`Year: ${carDetails.year || "N/A"}`, margin, margin + 145);
    doc.text(`License Plate: ${carDetails.licensePlate || "N/A"}`, margin, margin + 155);
    doc.text(`Color: ${carDetails.color || "N/A"}`, margin, margin + 165);

    // Add service details
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Service Details", margin, margin + 185);

    // Add procedures table with error handling
    try {
      const procedures = (client.procedures || []).map(p => ({
        procedure: typeof p === 'string' ? p : (p.label || p),
        status: "Completed",
        notes: p.notes || "N/A"
      }));

      if (procedures.length > 0) {
        doc.autoTable({
          startY: margin + 195,
          head: [["Procedure", "Status", "Notes"]],
          body: procedures.map(p => [p.procedure, p.status, p.notes]),
          theme: "grid",
          headStyles: { fillColor: [25, 118, 210] },
          styles: { fontSize: 10 },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 30 },
            2: { cellWidth: "auto" }
          }
        });
      } else {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text("No procedures listed", margin, margin + 195);
      }
    } catch (error) {
      console.error("Error generating procedures table:", error);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Error generating procedures table", margin, margin + 195);
    }

    // Add payment information with null checks
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : margin + 215;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Payment Information", margin, finalY);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const totalAmount = parseFloat(client.totalAmount) || 0;
    doc.text(`Total Amount: D${totalAmount.toFixed(2)}`, margin, finalY + 10);
    doc.text(`Payment Status: ${(client.paymentStatus || "not_paid").replace("_", " ")}`, margin, finalY + 20);
    if (client.paymentStatus === "partial") {
      const partialAmount = parseFloat(client.partialPaymentAmount) || 0;
      doc.text(`Partial Payment: D${partialAmount.toFixed(2)}`, margin, finalY + 30);
    }

    // Add delivery information if delivered
    if (client.repairStatus === "delivered") {
      const deliveryY = finalY + (client.paymentStatus === "partial" ? 50 : 40);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Delivery Information", margin, deliveryY);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const deliveryDate = client.deliveryDate ? new Date(client.deliveryDate) : new Date();
      doc.text(`Delivery Date: ${format(deliveryDate, "PPP")}`, margin, deliveryY + 10);
      if (client.deliveryNotes) {
        doc.text(`Delivery Notes: ${client.deliveryNotes}`, margin, deliveryY + 20);
      }
    }

    // Add issue description with text wrapping
    if (client.issueDescription) {
      const issueY = finalY + (client.repairStatus === "delivered" ? 80 : 40);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Issue Description", margin, issueY);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const splitText = doc.splitTextToSize(client.issueDescription, contentWidth);
      doc.text(splitText, margin, issueY + 10);
    }

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // Generate PDF blob with error handling
    try {
      const pdfBlob = doc.output("blob");
      pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Create a download link
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `service_report_${client.clientName || 'client'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return {
        success: true,
        url: pdfUrl,
        blob: pdfBlob,
        filename: link.download
      };
    } catch (error) {
      console.error("Error creating PDF blob:", error);
      throw new Error("Failed to create PDF file");
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    return {
      success: false,
      error: error.message || "Failed to generate PDF. Please try again."
    };
  } finally {
    // Clean up resources
    if (pdfUrl) {
      try {
        URL.revokeObjectURL(pdfUrl);
      } catch (e) {
        console.error("Error revoking PDF URL:", e);
      }
    }
    if (doc) {
      try {
        doc.destroy();
      } catch (e) {
        console.error("Error destroying PDF document:", e);
      }
    }
  }
}; 