import 'dotenv/config';
import mongoose from 'mongoose';
import { readFile } from 'node:fs/promises';
import { connectDB } from './config.js';
import { Book } from './models.js';
// Esta semilla carga libros desde un array JSON sin tocar usuarios ni sus roles.
try {
  if (!process.env.MONGODB_URI) throw new Error('Configura MONGODB_URI');
  await connectDB();
  const books = JSON.parse(await readFile(new URL('../data/books.json', import.meta.url), 'utf8'));
  for (const book of books) {
    const validated = new Book(book); await validated.validate();
    // Solo insertamos ISBN ausentes: los documentos existentes se conservan.
    await Book.updateOne({ isbn: book.isbn }, { $setOnInsert: book }, { upsert: true, runValidators: true });
  }
  console.log(`Semilla completada: ${books.length} libros; no elimina datos ni duplica ISBN.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
