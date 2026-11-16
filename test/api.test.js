import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { User, Book } from '../src/models.js';
process.env.JWT_SECRET = 'test-secret-with-more-than-thirty-two-characters';
let db, app, counter = 0, removed = [], failure = false;
// El MongoDB temporal se crea para esta suite y se elimina al terminar.
before(async () => {
  db = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(db.getUri());
  await Promise.all([User.init(), Book.init()]);
  // Este doble simula subidas y fallos de Cloudinary sin utilizar credenciales.
  app = createApp({ upload: async () => ({ secure_url: 'https://example.com/avatar.jpg', public_id: `test/${++counter}` }), destroy: async id => { if (failure) throw Error('Cloudinary unavailable'); removed.push(id); } });
});
after(async () => { await mongoose.disconnect(); await db?.stop(); });
const signup = (email, extra = {}) => {
  let req = request(app).post('/api/auth/register').field('name', 'Alumno').field('email', email).field('password', 'password123');
  for (const [k,v] of Object.entries(extra)) req = req.field(k,v);
  return req.attach('image', Buffer.from('mock image; Cloudinary is mocked'), { filename: 'avatar.png', contentType: 'image/png' });
};
const login = async email => (await request(app).post('/api/auth/login').send({ email, password: 'password123' }).expect(200)).body.token;
test('registro, permisos, relaciones y eliminación de imagen', async () => {
  await signup('attack@example.com', { role: 'admin' }).expect(400);
  const a = (await signup('a@example.com').expect(201)).body;
  const b = (await signup('b@example.com').expect(201)).body;
  assert.equal(a.role, 'user'); assert.equal(a.password, undefined); assert.equal(a.imagePublicId, undefined);
  await signup('a@example.com').expect(409);
  const tokenA = await login(a.email), tokenB = await login(b.email);
  const asA = req => req.set('Authorization', `Bearer ${tokenA}`);
  const asB = req => req.set('Authorization', `Bearer ${tokenB}`);
  await asA(request(app).patch(`/api/users/${a._id}/role`)).send({ role: 'admin' }).expect(403);
  await asA(request(app).patch(`/api/users/${b._id}/role`)).send({ role: 'admin' }).expect(403);
  await asA(request(app).patch(`/api/users/${a._id}`)).send({ role: 'admin' }).expect(400);
  await asA(request(app).delete(`/api/users/${b._id}`)).expect(403);
  await request(app).get('/api/users/me').expect(401);
  await asA(request(app).post('/api/books')).send({ title: 'Uno', author: 'Autor', isbn: '1234567890123' }).expect(403);
  // El primer administrador se crea directamente en la base de datos, igual que en Atlas.
  await User.updateOne({ _id: a._id }, { $set: { role: 'admin' } });
  const book = (await asA(request(app).post('/api/books')).send({ title: 'Uno', author: 'Autor', isbn: '1234567890123' }).expect(201)).body;
  const book2 = (await asA(request(app).post('/api/books')).send({ title: 'Dos', author: 'Autor', isbn: '1234567890124' }).expect(201)).body;
  await asB(request(app).post(`/api/users/${b._id}/books`)).send({ books: [book._id, book._id] }).expect(200);
  await Promise.all([book._id, book2._id].map(bookId => asB(request(app).post(`/api/users/${b._id}/books`)).send({ books: [bookId] }).expect(200)));
  let me = (await asB(request(app).get('/api/users/me')).expect(200)).body;
  assert.equal(me.books.length, 2);
  await asB(request(app).post(`/api/users/${b._id}/books`)).send({ books: ['000000000000000000000000'] }).expect(404);
  await asA(request(app).delete(`/api/books/${book._id}`)).expect(204);
  me = (await asB(request(app).get('/api/users/me')).expect(200)).body;
  assert.equal(me.books.length, 1); assert.equal(me.books[0]._id, book2._id);
  await asA(request(app).patch(`/api/users/${b._id}/role`)).send({ role: 'admin' }).expect(200);
  await asB(request(app).get('/api/users')).expect(200);
  await asA(request(app).patch(`/api/users/${b._id}/role`)).send({ role: 'user' }).expect(200);
  await asB(request(app).get('/api/users')).expect(403); // El JWT no conserva privilegios antiguos.
  failure = true;
  await asA(request(app).delete(`/api/users/${b._id}`)).expect(500);
  assert.ok(await User.exists({ _id: b._id }));
  failure = false;
  await asA(request(app).delete(`/api/users/${b._id}`)).expect(204);
  assert.ok(removed.includes('test/2'));
  await asB(request(app).get('/api/users/me')).expect(401);
  await asA(request(app).delete(`/api/users/${a._id}`)).expect(204);
  assert.ok(removed.includes('test/1'));
});
