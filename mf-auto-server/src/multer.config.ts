// import multer from 'multer';
// import path from 'path';

// // Define upload path
// const UPLOAD_PATH = process.env.NODE_ENV === 'production'
//   ? '/opt/render/project/src/uploads'
//   : path.join(__dirname, '..', 'uploads');

// // Multer storage configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, UPLOAD_PATH);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + '-' + file.originalname);
//   }
// });

// // File upload filter
// const fileFilter = (req: any, file: any, cb: any) => {
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('File type not supported'), false);
//   }
// };

// // Multer configuration
// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 1024 * 1024 * 5 // 5MB max file size
//   }
// });

// export { UPLOAD_PATH, upload };