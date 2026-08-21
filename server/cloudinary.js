import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'et8ihd4g',
  api_key: process.env.CLOUDINARY_API_KEY || '572471945166596',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'yF_DAxW5XIvusgzc1SA1EixLH8k',
  secure: true,
});

export default cloudinary;
