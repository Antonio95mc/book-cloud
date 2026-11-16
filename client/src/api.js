// Un único cliente HTTP evita repetir cabeceras y tratamiento de errores.
// El token vive en memoria en App: al recargar hay que volver a iniciar sesión.
export async function api(path, { token, body, method = 'GET', signal } = {}) {
  const isForm = body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    method, signal,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // No fijamos Content-Type en FormData: el navegador añade su boundary.
      ...(body && !isForm ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.errors?.map(issue => issue.message).join('. ');
    const error = new Error(detail || data.message || `Error HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}
