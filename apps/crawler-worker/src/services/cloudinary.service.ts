import { v2 as cloudinary, UploadStream } from 'cloudinary';
import { config } from '../config';
import { resolve } from 'path';

// Khởi tạo Cloudinary
cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
    async uploadBuffer(buffer: Buffer, folder: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    format:"webp",
                    resource_type: "image"
                },
                (error, result) => {
                    if(error) return reject(error);
                    if(!result) return reject (new Error("Upload success but without return result!"));
                    resolve(result.secure_url);
                
                }
            );
            uploadStream.end(buffer);
        });
    }
    async uploadBase64(base64Image: string, publicId: string): Promise<string> {
        try {
            const result = await cloudinary.uploader.upload(
                base64Image,
                {
                    public_id: publicId,
                    folder: 'manga-covers',
                    overwrite: true,
                }
            );
            return result.secure_url;
        } catch (error) {
            console.error("[CloudinaryService] Error uploading image:", error);
            throw new Error("Failed to upload image to Cloudinary");
        }
    }
}