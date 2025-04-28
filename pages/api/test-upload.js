import { IncomingForm } from "formidable";
import { v2 as cloudinary } from "cloudinary";
import { admin } from "../../lib/firebaseAdmin";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Disable body parsing, we'll handle file uploads manually
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // Verify token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Parse form data
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    const formData = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // Check if file was uploaded
    if (!formData.files.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
        details: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const file = formData.files.file;

    // Test upload to Cloudinary
    const startTime = Date.now();
    const uploadResult = await cloudinary.uploader.upload(file.filepath, {
      resource_type: "auto",
      folder: "test-uploads",
      public_id: `test-${Date.now()}-${uid.slice(0, 6)}`,
    });
    const endTime = Date.now();

    // Clean up the temporary file
    fs.unlinkSync(file.filepath);

    // Return success response
    return res.status(200).json({
      success: true,
      details: {
        uploadTime: `${endTime - startTime}ms`,
        secureUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        fileType: uploadResult.resource_type,
        fileSize: file.size,
        format: uploadResult.format,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Cloudinary test upload error:", error);

    // Clean up any temporary files if they exist
    if (req.files?.file?.filepath) {
      try {
        fs.unlinkSync(req.files.file.filepath);
      } catch (unlinkError) {
        console.error("Error removing temporary file:", unlinkError);
      }
    }

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to upload to Cloudinary",
      details: {
        timestamp: new Date().toISOString(),
        errorCode: error.code,
        errorName: error.name,
      },
    });
  }
}
