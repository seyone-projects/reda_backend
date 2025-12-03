import multer from "multer";
const storage = multer.memoryStorage();

const uploadExcel = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed."), false);
    }
  },
});

const uploadImage = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."), false);
    }
  },
});

const uploadMiddleware = (
  fields,
  allowedTypes = [],
  maxSize = null,
  message = "Required valid files"
) => {
  return (req, res, next) => {
    const multerConfig = {
      storage,
      fileFilter: (req, file, cb) => {
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new Error(message), false);
        }
        cb(null, true);
      },
    };

    if (maxSize) {
      multerConfig.limits = { fileSize: maxSize };
    }

    const upload = multer(multerConfig).fields(fields);

    upload(req, res, (err) => {
      if (err) {
        return res.status(500).json({ status: false, message: err.message });
      }
      next();
    });
  };
};

export { uploadExcel, uploadImage, uploadMiddleware };
