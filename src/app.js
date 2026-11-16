// Express organiza las rutas HTTP; cada middleware valida una parte de la petición.
import express from 'express';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { z } from 'zod';
import { User, Book } from './models.js';
import { images } from './images.js';
// Usamos errores con status para centralizar las respuestas en el middleware final.
const fail = (status, message) => Object.assign(new Error(message), { status });
const id = z.string().regex(/^[a-fA-F0-9]{24}$/, 'ObjectId no válido');
// Los esquemas estrictos rechazan campos no permitidos: nunca aceptamos role en el registro.
const credentials = z.object({ email: z.email().max(254).transform(v => v.toLowerCase()), password: z.string().min(8).max(72) }).strict();
const register = credentials.extend({ name: z.string().trim().min(1).max(80) });
const bookData = z.object({ title: z.string().trim().min(1).max(150), author: z.string().trim().min(1).max(100), isbn: z.string().regex(/^\d{13}$/) }).strict();
const parse = schema => (req, res, next) => { req.input = schema.parse(req.body); next(); };
const validId = (req, res, next) => { id.parse(req.params.id); next(); };
// 1. Verificamos la firma y caducidad del JWT. 2. Recuperamos el usuario actual.
// Consultar MongoDB aquí permite aplicar cambios de rol sin esperar a que caduque el token.
async function auth(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw fail(401, 'Falta el token Bearer');
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { throw fail(401, 'Token inválido o caducado'); }
  req.user = await User.findById(payload.sub);
  if (!req.user) throw fail(401, 'La cuenta ya no existe');
  next();
}
// Autenticación identifica a la persona; estos middlewares deciden qué puede hacer.
const admin = (req, res, next) => { if (req.user.role !== 'admin') throw fail(403, 'Solo administradores'); next(); };
const owner = (req, res, next) => { if (req.user.role !== 'admin' && req.user.id !== req.params.id) throw fail(403, 'Solo tu propia cuenta'); next(); };
// Multer recibe la imagen en RAM: no guardamos archivos temporales en el servidor.
// El límite protege la memoria; Cloudinary comprueba después que el contenido sea una imagen.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 3 }, fileFilter(req, file, cb) {
  cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
}}).single('image');
export function createApp(imageService = images) {
  const app = express();
  // Permitimos imágenes HTTPS de Cloudinary; scripts y estilos del cliente se sirven localmente.
  // Chakra/Emotion inyecta estilos en ejecución y necesita permitir estilos inline.
  app.use(helmet({ contentSecurityPolicy: { directives: {
    'img-src': ["'self'", 'https:', 'data:', 'blob:'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : null
  } } }), express.json({ limit: '32kb' }));
  app.get('/health', (req, res) => res.json({ status: mongoose.connection.readyState === 1 ? 'ok' : 'database-disconnected' }));
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });
  // Registro: validar antes de subir evita crear imágenes para formularios incorrectos.
  app.post('/api/auth/register', limiter, upload, parse(register), async (req, res) => {
    if (!req.file) throw fail(400, 'Envía image: JPG, PNG o WebP (máximo 5 MB)');
    if (await User.exists({ email: req.input.email })) throw fail(409, 'Email registrado');
    // Nunca almacenamos la contraseña original: bcrypt genera un hash con salt.
    const password = await bcrypt.hash(req.input.password, 12);
    const asset = await imageService.upload(req.file.buffer);
    let user;
    try { user = await User.create({ ...req.input, password, role: 'user', image: asset.secure_url, imagePublicId: asset.public_id, books: [] }); }
    catch (error) {
      // Compensación: si MongoDB falla, intentamos deshacer la subida de Cloudinary.
      try { await imageService.destroy(asset.public_id); } catch (cleanupError) { console.error('Imagen pendiente de limpieza:', asset.public_id, cleanupError.message); }
      throw error;
    }
    const output = user.toObject(); delete output.password; delete output.imagePublicId;
    res.status(201).json(output);
  });
  // Login: las credenciales válidas se intercambian por un token de duración limitada.
  app.post('/api/auth/login', limiter, parse(credentials), async (req, res) => {
    const user = await User.findOne({ email: req.input.email }).select('+password');
    if (!user || !await bcrypt.compare(req.input.password, user.password)) throw fail(401, 'Credenciales incorrectas');
    res.json({ token: jwt.sign({}, process.env.JWT_SECRET, { subject: user.id, expiresIn: '2h', algorithm: 'HS256' }) });
  });
  app.get('/api/users/me', auth, async (req, res) => res.json(await User.findById(req.user.id).populate('books')));
  app.get('/api/users', auth, admin, async (req, res) => res.json(await User.find().limit(100)));
  app.patch('/api/users/:id', auth, validId, owner, parse(z.object({ name: z.string().trim().min(1).max(80) }).strict()), async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { $set: req.input }, { new: true, runValidators: true });
    if (!user) throw fail(404, 'Usuario no encontrado'); res.json(user);
  });
  // Esta es la única ruta HTTP que cambia roles y siempre exige ser admin.
  app.patch('/api/users/:id/role', auth, admin, validId, parse(z.object({ role: z.enum(['user', 'admin']) }).strict()), async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { $set: req.input }, { new: true, runValidators: true });
    if (!user) throw fail(404, 'Usuario no encontrado'); res.json(user);
  });
  app.delete('/api/users/:id', auth, validId, owner, async (req, res) => {
    const user = await User.findById(req.params.id).select('+imagePublicId');
    if (!user) throw fail(404, 'Usuario no encontrado');
    // Borrar primero la imagen: si Cloudinary falla, se conserva la cuenta para reintentar.
    await imageService.destroy(user.imagePublicId);
    await User.deleteOne({ _id: user.id }); res.status(204).end();
  });
  // Validamos todos los libros antes de añadir referencias al array del usuario.
  app.post('/api/users/:id/books', auth, validId, owner, parse(z.object({ books: z.array(id).min(1).max(100) }).strict()), async (req, res) => {
    const ids = [...new Set(req.input.books.map(v => v.toLowerCase()))];
    if (await Book.countDocuments({ _id: { $in: ids } }) !== ids.length) throw fail(404, 'Algún libro no existe');
    // Operación atómica: añade sin duplicar ni sobrescribir los favoritos anteriores.
    const user = await User.findByIdAndUpdate(req.params.id, { $addToSet: { books: { $each: ids } } }, { new: true, runValidators: true }).populate('books');
    if (!user) throw fail(404, 'Usuario no encontrado'); res.json(user);
  });
  app.delete('/api/users/:id/books/:bookId', auth, validId, owner, async (req, res) => {
    id.parse(req.params.bookId);
    const user = await User.findByIdAndUpdate(req.params.id, { $pull: { books: req.params.bookId } }, { new: true }).populate('books');
    if (!user) throw fail(404, 'Usuario no encontrado'); res.json(user);
  });
  // El catálogo es público; crear, editar y eliminar libros requiere un administrador.
  app.get('/api/books', async (req, res) => res.json(await Book.find().limit(100)));
  app.get('/api/books/:id', validId, async (req, res) => {
    const book = await Book.findById(req.params.id); if (!book) throw fail(404, 'Libro no encontrado'); res.json(book);
  });
  app.post('/api/books', auth, admin, parse(bookData), async (req, res) => res.status(201).json(await Book.create(req.input)));
  app.patch('/api/books/:id', auth, admin, validId, parse(bookData.partial()), async (req, res) => {
    const book = await Book.findByIdAndUpdate(req.params.id, { $set: req.input }, { new: true, runValidators: true });
    if (!book) throw fail(404, 'Libro no encontrado'); res.json(book);
  });
  app.delete('/api/books/:id', auth, admin, validId, async (req, res) => {
    // Atlas permite transacciones: eliminación y limpieza de referencias se confirman juntas.
    await mongoose.connection.transaction(async session => {
      const book = await Book.findByIdAndDelete(req.params.id, { session });
      if (!book) throw fail(404, 'Libro no encontrado');
      await User.updateMany({ books: book._id }, { $pull: { books: book._id } }, { session });
    }); res.status(204).end();
  });
  // Tras npm run build:client, Express también sirve la interfaz compilada.
  // Las rutas API se registran antes para que una página HTML nunca oculte un error HTTP.
  app.use(express.static(fileURLToPath(new URL('../client/dist/', import.meta.url))));
  // BrowserRouter necesita devolver index.html al recargar una URL de la interfaz.
  // Limitamos el fallback a sus páginas: una ruta API inexistente sigue siendo JSON 404.
  app.get(['/', '/acceso', '/registro', '/mi-biblioteca', '/mi-cuenta', '/administracion'], (req, res, next) => {
    res.sendFile(fileURLToPath(new URL('../client/dist/index.html', import.meta.url)), error => { if (error) next(); });
  });
  app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));
  // Express 5 envía aquí los errores de los controladores async automáticamente.
  // No exponemos detalles internos ni claves de los servicios externos.
  app.use((err, req, res, next) => {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Datos no válidos', errors: err.issues });
    if (err instanceof multer.MulterError) return res.status(400).json({ message: err.message });
    if (err.code === 11000) return res.status(409).json({ message: 'Email o ISBN ya registrado' });
    const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
    if (status === 500) console.error(err.message);
    res.status(status).json({ message: status === 500 ? 'Error interno o servicio externo no disponible' : err.message });
  });
  return app;
}
