import { PDFDocument } from 'pdf-lib';
export declare const createBufferedPDF: (_options: {
    title: string;
    content: string;
    filename?: string;
}) => Promise<PDFDocument>;
export declare const getCompanyLogo: () => Promise<Buffer | null>;
