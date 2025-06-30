"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyLogo = exports.createBufferedPDF = void 0;
const pdf_lib_1 = require("pdf-lib");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const createBufferedPDF = async (_options) => {
    const pdfDoc = await pdf_lib_1.PDFDocument.create();
    return pdfDoc;
};
exports.createBufferedPDF = createBufferedPDF;
const getCompanyLogo = async () => {
    try {
        const logoPath = path_1.default.join(__dirname, '../../public/images/logo.png');
        if (fs_1.default.existsSync(logoPath)) {
            return fs_1.default.readFileSync(logoPath);
        }
        return null;
    }
    catch (error) {
        console.error('Error reading company logo:', error);
        return null;
    }
};
exports.getCompanyLogo = getCompanyLogo;
//# sourceMappingURL=pdfUtils.js.map