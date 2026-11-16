import mongoose from 'mongoose';
const { Schema, model } = mongoose;
// El usuario tiene referencias a otra colección, no copias completas de sus libros.
const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  // select:false evita devolver el hash por accidente en las consultas normales.
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  image: { type: String, required: true },
  // Cloudinary necesita este identificador para borrar el recurso, no su URL pública.
  imagePublicId: { type: String, required: true, select: false },
  books: [{ type: Schema.Types.ObjectId, ref: 'Book' }]
}, { timestamps: true });
export const User = model('User', userSchema);
// El ISBN único permite repetir la semilla sin introducir duplicados.
export const Book = model('Book', new Schema({
  title: { type: String, required: true, trim: true, maxlength: 150 },
  author: { type: String, required: true, trim: true, maxlength: 100 },
  isbn: { type: String, required: true, unique: true, match: /^\d{13}$/ }
}, { timestamps: true }));
