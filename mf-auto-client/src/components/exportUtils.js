// // Create an exportUtils.js file
// import { toast } from 'react-toastify';

// // Export to CSV
// export const exportToCSV = (data, filename = 'export.csv') => {
//   try {
//     // Convert data to CSV format
//     const headers = Object.keys(data[0]);
//     const csvRows = [];
    
//     // Add header row
//     csvRows.push(headers.join(','));
    
//     // Add data rows
//     data.forEach(row => {
//       const values = headers.map(header => {
//         const value = row[header];
//         const escaped = (value == null) ? '' : String(value).replace(/"/g, '""');
//         return `"${escaped}"`;
//       });
//       csvRows.push(values.join(','));
//     });
    
//     // Create blob and download
//     const csvString = csvRows.join('\n');
//     const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
    
//     const url = URL.createObjectURL(blob);
//     link.setAttribute('href', url);
//     link.setAttribute('download', filename);
//     link.style.visibility = 'hidden';
    
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
    
//     toast.success(`CSV exported successfully`);
//   } catch (error) {
//     console.error('Error exporting to CSV:', error);
//     toast.error('Failed to export data to CSV');
//   }
// };

// // Export to Excel
// export const exportToExcel = async (data, filename = 'export.xlsx') => {
//   try {
//     // Dynamically import xlsx
//     const XLSX = await import('xlsx');
    
//     // Create worksheet
//     const worksheet = XLSX.utils.json_to_sheet(data);
    
//     // Create workbook
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
//     // Generate Excel file and download
//     XLSX.writeFile(workbook, filename);
    
//     toast.success(`Excel file exported successfully`);
//   } catch (error) {
//     console.error('Error exporting to Excel:', error);
//     toast.error('Failed to export data to Excel');
//   }
// };

// // Export to PDF
// export const exportToPDF = async (data, columns, title, filename = 'export.pdf') => {
//   try {
//     // Dynamically import jsPDF and jsPDF-AutoTable
//     const { default: jsPDF } = await import('jspdf');
//     await import('jspdf-autotable');
    
//     // Create new PDF document
//     const doc = new jsPDF();
    
//     // Add title
//     doc.setFontSize(16);
//     doc.text(title, 14, 20);
    
//     // Add generation date
//     doc.setFontSize(10);
//     const dateStr = new Date().toLocaleDateString('en-US', {
//       year: 'numeric', month: 'short', day: 'numeric'
//     });
//     doc.text(`Generated on: ${dateStr}`, 14, 28);
    
//     // Convert data for auto-table
//     const tableColumns = columns.map(col => ({
//       header: col.header,
//       dataKey: col.dataKey
//     }));
    
//     const tableData = data.map(item => {
//       const row = {};
//       columns.forEach(col => {
//         row[col.dataKey] = item[col.dataKey];
//       });
//       return row;
//     });
    
//     // Add table to document
//     doc.autoTable({
//       startY: 35,
//       columns: tableColumns,
//       body: tableData,
//       theme: 'grid',
//       styles: {
//         cellPadding: 3,
//         fontSize: 10,
//         lineColor: [75, 75, 75],
//         lineWidth: 0.2
//       },
//       headStyles: {
//         fillColor: [41, 128, 185],
//         textColor: 255,
//         fontStyle: 'bold'
//       },
//       alternateRowStyles: {
//         fillColor: [240, 240, 240]
//       }
//     });
    
//     // Save PDF
//     doc.save(filename);
    
//     toast.success(`PDF exported successfully`);
//   } catch (error) {
//     console.error('Error exporting to PDF:', error);
//     toast.error('Failed to export data to PDF');
//   }
// };

// // Update the export buttons in your tables/reports
// // Example usage:
// const handleExport = (format) => {
//   const dataToExport = clients.map(client => ({
//     'Client ID': client.id,
//     'Name': client.clientName,
//     'Phone': client.phoneNumber,
//     'Email': client.email,
//     'Car Details': `${client.carDetails.year} ${client.carDetails.make} ${client.carDetails.model}`,
//     'Status': client.repairStatus
//   }));
  
//   const filename = `clients_${new Date().toISOString().slice(0, 10)}`;
  
//   switch (format) {
//     case 'csv':
//       exportToCSV(dataToExport, `${filename}.csv`);
//       break;
//     case 'excel':
//       exportToExcel(dataToExport, `${filename}.xlsx`);
//       break;
//     case 'pdf':
//       const columns = [
//         { header: 'Client ID', dataKey: 'Client ID' },
//         { header: 'Name', dataKey: 'Name' },
//         { header: 'Phone', dataKey: 'Phone' },
//         { header: 'Email', dataKey: 'Email' },
//         { header: 'Car Details', dataKey: 'Car Details' },
//         { header: 'Status', dataKey: 'Status' }
//       ];
//       exportToPDF(dataToExport, columns, 'Client List', `${filename}.pdf`);
//       break;
//     default:
//       exportToExcel(dataToExport, `${filename}.xlsx`); // Default to Excel
//   }
// };