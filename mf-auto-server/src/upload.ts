// const multer = require("multer");

// const storage = multer.diskStorage({
//   destination: (_req: any, _file: any, cb: (arg0: null, arg1: string) => void) => {
//     cb(null, "uploads/");
//   },
//   filename: (req: any, file: { originalname: number; }, cb: (arg0: null, arg1: any) => void) => {
//     cb(null, Date.now() + file.originalname);
//   },
// });

// const upload = multer({ storage: storage });

// module.exports = { upload };