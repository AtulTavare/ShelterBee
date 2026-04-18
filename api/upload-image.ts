import type { VercelRequest, VercelResponse } from '@vercel/node'
import { v2 as cloudinary } from "cloudinary";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { image, folder, quality, flags } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image data is required (base64 or URL)" });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({ error: "Cloudinary not configured" });
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    // Support for large payloads (Vercel has limitations, but base64 is common)
    const result = await cloudinary.uploader.upload(image, {
      folder: folder || "shelterbee",
      quality: quality || 'auto:good',
      flags: flags,
    });

    res.json(result);
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload image", details: error.message });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
