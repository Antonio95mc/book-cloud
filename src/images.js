import { v2 as cloudinary } from 'cloudinary';
// Aislamos Cloudinary en un servicio sustituible para probar sin subir imágenes reales.
export const images = {
  upload(buffer) {
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
    // upload_stream transforma el Buffer de Multer en una subida firmada.
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: 'biblioteca/users', resource_type: 'image', allowed_formats: ['jpg', 'png', 'webp'], transformation: [{ width: 600, height: 600, crop: 'limit' }] }, (err, result) => err ? reject(err) : resolve(result)).end(buffer);
    });
  },
  // Invalidar la caché ayuda a retirar también las copias del CDN.
  // Un recurso ya eliminado se considera éxito para permitir reintentos seguros.
  async destroy(id) {
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
    const result = await cloudinary.uploader.destroy(id, { invalidate: true });
    if (!['ok', 'not found'].includes(result.result)) throw new Error('No se pudo borrar la imagen');
  }
};
