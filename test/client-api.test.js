import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../client/src/api.js';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

// Estas pruebas verifican el contrato HTTP del cliente sin navegador ni servicios externos.
test('el cliente envía JSON y el token Bearer', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/users/123/books');
    assert.equal(options.headers.Authorization, 'Bearer prueba');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), { books: ['abc'] });
    return Response.json({ books: ['abc'] });
  };
  assert.deepEqual(await api('/users/123/books', { token: 'prueba', method: 'POST', body: { books: ['abc'] } }), { books: ['abc'] });
});
test('FormData conserva su boundary automático', async () => {
  const form = new FormData(); form.set('name', 'Ana');
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers['Content-Type'], undefined);
    assert.equal(options.body, form);
    return Response.json({ name: 'Ana' }, { status: 201 });
  };
  await api('/auth/register', { method: 'POST', body: form });
});
test('una eliminación 204 no intenta interpretar JSON', async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await api('/users/123', { method: 'DELETE' }), null);
});
test('los errores mantienen el status y los detalles de validación', async () => {
  globalThis.fetch = async () => Response.json({ message: 'Datos no válidos', errors: [{ message: 'Email incorrecto' }] }, { status: 400 });
  await assert.rejects(api('/auth/login'), error => error.status === 400 && error.message === 'Email incorrecto');
});
