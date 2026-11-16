// Cargamos las variables del .env solo en el servidor: nunca se envían a React.
import 'dotenv/config';
import mongoose from 'mongoose';
// Fallar al arrancar explica qué falta antes de aceptar peticiones.
export function validateEnv() {
  for (const key of ['MONGODB_URI', 'JWT_SECRET', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
    if (!process.env[key] || /USUARIO|REEMPLAZAR|^tu_/.test(process.env[key])) throw new Error(`Configura ${key} en .env`);
  }
  if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
}
export const connectDB = () => mongoose.connect(process.env.MONGODB_URI);
