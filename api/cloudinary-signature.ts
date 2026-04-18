import type { VercelRequest, VercelResponse } from '@vercel/node'
import { v2 as cloudinary } from "cloudinary";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { folder, ...otherParams } = req.body;
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Missing Cloudinary configuration:", { cloudName: !!cloudName, apiKey: !!apiKey, apiSecret: !!apiSecret });
      return res.status(500).json({ 
        error: "Cloudinary is not fully configured on the server. Please check environment variables.",
        missing: { 
          cloudName: !cloudName, 
          apiKey: !apiKey, 
          apiSecret: !apiSecret 
        }
      });
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp, ...otherParams },
      apiSecret
    );

    res.json({
      signature,
      timestamp,
      cloudName,
      apiKey
    });
  } catch (error: any) {
    console.error("Signature generation error:", error);
    res.status(500).json({ error: "Failed to generate Cloudinary signature", details: error.message });
  }
}
