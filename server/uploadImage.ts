import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Ensure uploads/images directory exists
const imagesDir = path.join(process.cwd(), "uploads", "images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, imagesDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-").toLowerCase();
    const unique = crypto.randomBytes(8).toString("hex");
    cb(null, `${base}-${Date.now()}-${unique}${ext}`);
  },
});
function imageFileFilter(_req: any, file: any, cb: any) {
  const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeAllowed = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  if (allowedExts.includes(ext) && mimeAllowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de imagem inválido. Permitidos: JPG, JPEG, PNG, GIF, WEBP, SVG"));
  }
}

export const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
