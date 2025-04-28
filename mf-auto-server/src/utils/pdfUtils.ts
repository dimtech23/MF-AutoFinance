// import {PDFDocument, PDFFont, PDFPage, RGB, rgb, StandardFonts} from "pdf-lib";
// import fs from 'fs';
// import path from 'path';

// const generatePDF = async (pdfData: any) => {
//     if (!pdfData) return;

//     //console.log("Selected Application:", selectedApplication);
//     console.log("spreading.....pdf info")
//     const selectedApplication = {
//         ...pdfData.contact_information,
//         health_insurance: pdfData.health_insurance,
//         ...pdfData.current_health_insurance_info,
//         ...pdfData.additional_info,
//         ...pdfData.employer_info,
//         ...pdfData.sign_off_info,
//     }

//     const pdfDoc = await PDFDocument.create();
//     const [width, height] = [700, 300];

//     const createPageWithBorder = (doc: any) => {
//         const page = doc.addPage([width, height]);
//         const borderColor = rgb(0.5, 0.5, 0.5);
//         const borderX = 25;
//         const borderY = 25;
//         const dataWidth = width - 2 * borderX;
//         const dataHeight = height - 2 * borderY;

//         page.drawRectangle({
//             x: borderX,
//             y: borderY,
//             width: dataWidth,
//             height: dataHeight,
//             borderColor,
//             borderWidth: 0.5,
//         });
//         return page;
//     };

//     const pages = Array(5).fill(0).map(() => createPageWithBorder(pdfDoc));

//     const helveticaFont = await pdfDoc.embedFont("Helvetica");
//     const textColor = rgb(0, 0, 0);
//     const seaBlueColor = rgb(0, 105 / 255, 148 / 255);
//     const greenColor = rgb(0, 0.5, 0);

//     const drawText = (page: {
//         drawText: (arg0: any, arg1: { x: any; y: any; size: any; font: PDFFont; color: any; }) => void;
//     }, text: string, x: number, y: number, size: number, align: string, color: RGB) => {
//         const textWidth = helveticaFont.widthOfTextAtSize(text.toString(), size);
//         const xPosition = align === "left" ? x :
//             align === "right" ? width - textWidth - x :
//                 (width - textWidth) / 2;

//         page.drawText(text.toString(), {
//             x: color === greenColor && align === "left" ? xPosition + 300 : xPosition,
//             y,
//             size,
//             font: helveticaFont,
//             color,
//         });
//     };

//     const data =  [
//       {
//         page: pages[0],
//         title: "Ihre Kontaktdaten",
//         fields: [
//           {
//             label: "Name:",
//             value: `${selectedApplication.salutation} ${selectedApplication.firstname} ${selectedApplication.lastname}`,
//           },
//           { label: "Email:", value: selectedApplication.email },
//           {
//             label: "Postleitzahl, Ort:",
//             value: `${selectedApplication.zip} ${selectedApplication.city}`,
//           },
//           {
//             label: "Straße, Hausnummer:",
//             value: `${selectedApplication.street} ${selectedApplication.housenumber}`,
//           },
//           //transform date format to better looking format
//           {
//             label: "Geburtsdatum",
//             value: selectedApplication.date_of_birth
//               .toString()
//               .split("T")[0]
//               .split("-")
//               .reverse()
//               .join("."),
//           },
//           { label: "Telefonnummer", value: selectedApplication.phone },
//           { label: "Krankenkasse:", value: selectedApplication.health_insurance },
//         ],
//       },
//       {
//         page: pages[1],
//         title: "Aktuelle Krankenkasse",
//         fields: [
//           { label: "Name:", value: selectedApplication.current_health_insurance },
//           {
//             label: "Versicherungsart:",
//             value: selectedApplication.current_insurance_type || "Gesetzlich versichert",
//           },
//           {
//             label: "Versicherungs Situation:",
//             value: selectedApplication.insurance_situation,
//           },
//           {
//             label: "Minimale Versicherungszeit erfüllt:",
//             value: booleanToGerman(selectedApplication.min_insurance_time),
//           },
//         ],
//       },
//       {
//         page: pages[2],
//         title: "Zusätzliche Informationen",
//         fields: [
//           { label: "Kinder:", value: selectedApplication.children },
//           { label: "Ehepartner:", value: selectedApplication.insure_spouse },
//           {
//             label: "Einkommen Selbstständig:",
//             value: selectedApplication.selfemployed_income,
//           },
//           { label: "Pension Status:", value: selectedApplication.has_pension },
//           {
//             label: "Versicherungsstatus:",
//             value: selectedApplication.freed_from_health_insurance,
//           },
//         ],
//       },
//       {
//         page: pages[3],
//         title: "Arbeitgeber Info",
//         fields: [
//           { label: "Einkommen:", value: selectedApplication.income },
//           { label: "Firma:", value: selectedApplication.company_name },
//           { label: "Postleitzahl:", value: selectedApplication.zip },
//           { label: "Straße:", value: selectedApplication.street },
//           { label: "Hausnummer:", value: selectedApplication.housenumber },
//           {
//             label: "Arbeitgeberwechsel:",
//             value: booleanToGerman(selectedApplication.change_of_employement),
//           },
//           {
//             label: "Anstellungsdauer:",
//             value: booleanToGerman(selectedApplication.min_employement_duration),
//           },
//           {
//             label: "Verhältnis zum Arbeitgeber:",
//             value: booleanToGerman(selectedApplication.related_to_employer),
//           },
//           {
//             label: "Unternehmensanteile:",
//             value: booleanToGerman(selectedApplication.holding_company_shares),
//           },
//           {
//             label: "Mehrere Arbeitgeber:",
//             value: booleanToGerman(selectedApplication.multiple_employers),
//           },
//         ],
//       },
//       {
//         page: pages[4],
//         title: "Geburtsinformationen",
//         fields: [
//           {
//             label: "Geburtsname:",
//             value: `${selectedApplication.salutation} ${selectedApplication.firstname} ${selectedApplication.lastname}`,
//           },
//           { label: "Geburtsort:", value: selectedApplication.place_of_birth },
//           { label: "Geburtsland:", value: selectedApplication.birth_country },
//           { label: "Nationalität:", value: selectedApplication.nationality },
//         ],
//       },
//     ];

//       data.forEach(({ page, title, fields }) => {
//         drawText(page, title, 50, 250, 18, "left", seaBlueColor);
//         let yPosition = 220;
      
//         fields.forEach(({ label, value }) => {
//           //checks for undefined values
//           const safeValue = (val: any) =>
//             val !== undefined && val !== null ? val.toString() : "-";
      
//           drawText(page, `${label}:`, 50, yPosition, 12, "left", textColor);
//           drawText(page, safeValue(value), 120, yPosition, 12, "left", greenColor);
//           yPosition -= 20;
//         });
//       });

//     const pdfBytes = await pdfDoc.save();
//     const blob = new Blob([pdfBytes], {type: "application/pdf"});
//     //ignore blob
//     const d = new Date()
//     const folderName = `uploads/pdf/${d.getFullYear()}/${d.getMonth()}`;
//     const fileName = `${selectedApplication.firstname.toLowerCase()}_${new Date().getTime()}_application.pdf`
//     const fullPath = folderName + "/" + fileName;
//     try {
//         if (!fs.existsSync(folderName)) {
//             await fs.promises.mkdir(folderName,{recursive: true});
//         }
//         // Finally, save the PDF and output as a file
//         fs.writeFileSync(folderName + "/" + fileName, pdfBytes);
//         console.log("------writing pdf done------")
//     } catch (err) {
//         console.error(err);
//     }
//     return fullPath
// };

// function booleanToGerman(value: boolean) {
//   return value ? "Ja" : "Nein";
// }
// //export as default
// export default generatePDF