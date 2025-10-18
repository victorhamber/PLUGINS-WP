import multer from "multer";
import path from "path";
import { randomBytes } from "crypto";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/plugins");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${randomBytes(8).toString("hex")}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [".zip", ".tar", ".gz", ".tar.gz"];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext) || ext === ".gz") {
    cb(null, true);
  } else {
    cb(new Error("Only .zip, .tar, and .tar.gz files are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});
