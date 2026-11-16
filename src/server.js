import { validateEnv, connectDB } from './config.js';
import { createApp } from './app.js';
import mongoose from 'mongoose';
// Primero validamos la configuración y conectamos MongoDB; después abrimos el puerto.
try {
  validateEnv(); await connectDB();
  const server = createApp().listen(process.env.PORT || 3000, () => console.log('API iniciada'));
  // Un cierre ordenado termina las conexiones al detener el proceso.
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(async () => { await mongoose.disconnect(); process.exit(0); }));
} catch (error) { console.error(error.message); process.exitCode = 1; }
