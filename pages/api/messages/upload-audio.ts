import { NextApiRequest, NextApiResponse } from "next";
import { verifyIdToken } from "../../../lib/auth-helpers";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Configure Next.js to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * API handler for uploading audio messages
 *
 * This endpoint accepts multipart/form-data with an audio file
 * and saves it to a public directory, returning the URL.
 *
 * In a production environment, this would upload to cloud storage
 * like AWS S3, Google Cloud Storage, or similar.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Verify authorization
  let userId: string;
  const authHeader = req.headers.authorization;

  try {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split("Bearer ")[1];
    const tokenData = await verifyIdToken(token);
    userId = tokenData.uid;
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Invalid token" });
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB max file size
      filter: (part) => {
        // Only accept audio files
        return part.mimetype?.includes("audio") || false;
      },
    });

    // Handle form parsing
    const [fields, files] = await new Promise<
      [formidable.Fields, formidable.Files]
    >((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Check if we have an audio file
    const audioFile = files.audio;
    if (!audioFile || Array.isArray(audioFile)) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // In a real production app, this would upload to cloud storage
    // For this example, we'll save to a local public directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "audio");

    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename with original extension
    const originalFilename = audioFile.originalFilename || "audio.webm";
    const extension = path.extname(originalFilename);
    const filename = `${uuidv4()}${extension}`;
    const filePath = path.join(uploadsDir, filename);

    // Read the file from temp location
    const data = fs.readFileSync(audioFile.filepath);

    // Write to final location
    fs.writeFileSync(filePath, data);

    // Clean up temp file
    fs.unlinkSync(audioFile.filepath);

    // Generate URL for accessing the file
    const audioUrl = `/uploads/audio/${filename}`;

    // Return success response with file URL
    return res.status(200).json({
      success: true,
      url: audioUrl,
      duration: parseFloat(fields.duration as string) || 0,
      filename: filename,
    });
  } catch (error) {
    console.error("Error handling audio upload:", error);
    return res.status(500).json({
      error: "Failed to upload audio file",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
