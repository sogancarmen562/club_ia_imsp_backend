import { v2 as cloudinary } from "cloudinary";
import BadRequestException from "../exceptions/BadRequestException";

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFiles(files: Express.Multer.File[], folder = "emails") {
    try {
      const uploads = files.map(
        (file) =>
          new Promise((resolve, reject) => {
            cloudinary.uploader
              .upload_stream({ folder }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
              })
              .end(file.buffer);
          }),
      );

      const results = await Promise.all(uploads);

      return results as {secure_url: string}[];
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
