// import multer from 'multer';
// import { Request } from 'express';
// import path from 'path';

// const storage = multer.memoryStorage();

// const imageFormatSelector = (req: Request, file: any, cb: any) => {
//     const allowedImageFormats = /jpeg|jpg|png|gif/;

//     const extname = allowedImageFormats.test(
//         path.extname(file.originalname).toLowerCase()
//     );
//     const mimetype = allowedImageFormats.test(file.mimetype);

//     if(extname && mimetype) {
//         return cb(null, true);
//     }else {
//         const error = new Error("Only image files of jpeg, jpg, png, gif can be uploaded");
//         return cb(error, false);
        
//     }
// };

// const upload = multer({
//     storage: storage,
//     fileFilter: imageFormatSelector
    
// })

// export default upload;