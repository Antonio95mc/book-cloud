# Book Cloud ☁️📚

Book Cloud es una biblioteca virtual que he desarrollado como proyecto del máster para aplicar los conocimientos de Node.js, Backend y React.

La aplicación permite consultar un catálogo de libros, crear una cuenta con foto de perfil y guardar libros favoritos. También incluye un panel de administración para gestionar el catálogo y los usuarios.

## Tecnologías que he utilizado

### Frontend

- React.
- Vite.
- Chakra UI.
- React Router DOM.
- React Hook Form.
- Lucide React para los iconos.
- CSS para personalizar el diseño y las ilustraciones.

### Backend

- Node.js y Express.
- MongoDB Atlas y Mongoose.
- Cloudinary para almacenar las imágenes.
- Multer para recibir los archivos.
- bcryptjs para proteger las contraseñas.
- JSON Web Token para la autenticación.
- Zod para validar los datos.
- Helmet y Express Rate Limit.

### Pruebas

- Node.js Test Runner.
- Supertest.
- MongoDB Memory Server.

## Funcionalidades

He implementado las siguientes funciones:

- Registro con nombre, correo, contraseña y fotografía.
- Inicio y cierre de sesión.
- Consulta y búsqueda de libros por título o autor.
- Biblioteca personal de favoritos.
- Edición del nombre del usuario.
- Eliminación de la cuenta y de su fotografía en Cloudinary.
- Gestión de libros por parte de los administradores.
- Gestión de usuarios y roles desde el panel de administración.
- Catálogo inicial de 24 libros mediante una semilla.

## Diseño

He llamado a la aplicación Book Cloud y he utilizado una identidad visual inspirada en su logotipo:

- Azul marino: `#06264D`.
- Turquesa: `#00A6A0`.
- Fondos claros.
- Tipografías sans serif similares a las del logo.

He preparado el diseño para adaptarse a diferentes tamaños de pantalla mediante los breakpoints de Chakra UI y media queries.

Las portadas de los libros son ilustraciones realizadas con CSS; no son las cubiertas comerciales originales.

## Estructura del proyecto

He separado el servidor y la interfaz para organizar sus responsabilidades.

- `src/`: configuración, modelos, rutas, middlewares, servicios y arranque del servidor.
- `data/books.json`: catálogo utilizado por la semilla.
- `test/`: pruebas automatizadas.
- `client/src/pages/`: páginas de la aplicación.
- `client/src/components/`: componentes reutilizables.
- `client/src/context/`: contexto de autenticación.
- `client/src/hooks/`: hooks personalizados.
- `client/src/api.js`: comunicación con la API.
- `client/src/styles.css`: estilos personalizados.
- `client/public/`: archivos públicos, incluido el logo.

He añadido comentarios en español para explicar las partes principales del código.

## Requisitos para ejecutarlo

Para utilizar el proyecto necesito:

- Node.js 22.12 o superior.
- npm.
- Una cuenta de MongoDB Atlas.
- Una cuenta de Cloudinary.

## Instalación

Desde la carpeta raíz del proyecto instalo las dependencias del servidor:

```bash
npm install
```

Después instalo las dependencias del frontend:

```bash
npm --prefix client install
```

## Variables de entorno

Creo un archivo `.env` en la raíz del proyecto, junto a `package.json`, con esta configuración:

```env
PORT=3000

MONGODB_URI=mongodb+srv://USUARIO:CONTRASENA@TU_CLUSTER.mongodb.net/bookcloud?retryWrites=true&w=majority

JWT_SECRET=SECRETO_ALEATORIO_DE_AL_MENOS_32_CARACTERES

CLOUDINARY_CLOUD_NAME=TU_CLOUD_NAME
CLOUDINARY_API_KEY=TU_API_KEY
CLOUDINARY_API_SECRET=TU_API_SECRET
```

Sustituyo los valores de ejemplo por mis credenciales reales.

Si la contraseña de MongoDB contiene caracteres reservados de una URL, debo codificarlos antes de incluirla en la cadena de conexión.

En Atlas también autorizo la IP desde la que voy a ejecutar el servidor.

He incluido `.env` en `.gitignore` para evitar publicar credenciales. Como referencia de configuración, incluyo `.env.example` en el repositorio.

### Generación del secreto de sesión

Para generar un valor aleatorio para `JWT_SECRET`, ejecuto:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copio el resultado en la variable correspondiente de mi `.env`.

## Carga inicial del catálogo

Para cargar los libros en MongoDB ejecuto:

```bash
npm run seed
```

La semilla utiliza el array de `data/books.json`.

He utilizado el ISBN como identificador único y la operación `$setOnInsert` para poder repetir la carga sin duplicar los libros ni sobrescribir los que ya existen.

Los ISBN del catálogo son datos de demostración y no deben utilizarse como referencia de ediciones comerciales.

La semilla no crea usuarios ni administradores.

## Ejecución en desarrollo

Utilizo dos terminales abiertas dentro de la carpeta raíz del proyecto.

### Terminal 1: servidor

```bash
npm run dev
```

El servidor se ejecuta por defecto en:

```text
http://localhost:3000
```

### Terminal 2: interfaz

```bash
npm run dev:client
```

Abro en el navegador la dirección que muestra Vite, normalmente:

```text
http://localhost:5173
```

Mantengo ambos procesos funcionando al mismo tiempo.

He configurado un proxy en Vite para reenviar las peticiones de `/api` al servidor Express del puerto 3000.

## Compilación

Para generar los archivos del frontend ejecuto:

```bash
npm run build:client
```

Después puedo servir la interfaz compilada y la API desde Express:

```bash
npm start
```

En ese caso accedo a:

```text
http://localhost:3000
```

He preparado Express para que las páginas de React Router también funcionen al abrir directamente su URL o recargarlas.

## Páginas de la aplicación

He utilizado `react-router-dom` para definir estas rutas:

| Ruta | Página | Acceso |
| --- | --- | --- |
| `/` | Catálogo y búsqueda | Público |
| `/acceso` | Inicio de sesión | Público |
| `/registro` | Registro con fotografía | Público |
| `/mi-biblioteca` | Libros favoritos | Usuario autenticado |
| `/mi-cuenta` | Perfil y eliminación de cuenta | Usuario autenticado |
| `/administracion` | Gestión de usuarios y roles | Administrador |

En **Explorar** busco entre los libros del catálogo.

En **Mi biblioteca** busco únicamente entre los libros que he guardado como favoritos.

## Modelos de datos

### Usuario: User

He definido los siguientes campos:

- `name`: nombre.
- `email`: correo único.
- `password`: contraseña protegida mediante hash.
- `role`: `user` o `admin`.
- `image`: URL de la fotografía.
- `imagePublicId`: identificador del recurso en Cloudinary.
- `books`: array de referencias a libros.
- Fechas de creación y actualización.

No devuelvo el hash de la contraseña ni el identificador privado de la imagen en las respuestas normales de la API.

### Libro: Book

He definido estos campos:

- `title`: título.
- `author`: autor.
- `isbn`: identificador único de 13 dígitos.
- Fechas de creación y actualización.

Relaciono ambos modelos mediante el array `books` del usuario, que contiene referencias ObjectId a la colección de libros.

Utilizo `populate` para recuperar la información de los libros relacionados.

## Autenticación y permisos

He separado la autenticación de la autorización.

La autenticación comprueba quién realiza la petición mediante un JWT. La autorización comprueba si esa persona tiene permiso para realizar la operación.

He aplicado estas reglas:

- Todas las cuentas se registran con el rol `user`.
- El registro rechaza un campo `role` enviado por el cliente.
- Solo un administrador puede modificar roles.
- Un usuario puede eliminar su propia cuenta.
- Un administrador puede eliminar otras cuentas.
- Un usuario normal no puede eliminar cuentas ajenas.
- Solo los administradores pueden crear, editar o eliminar libros.

He protegido estas operaciones en Express. Ocultar los botones de administración en React es una ayuda visual, pero los permisos se verifican también en el servidor.

### Creación del primer administrador

Para crear el primer administrador:

1. Registro una cuenta desde Book Cloud.
2. Entro en MongoDB Atlas.
3. Abro la base de datos `bookcloud` y la colección `users`.
4. Localizo mi usuario por su correo.
5. Cambio manualmente `role` de `user` a `admin`.
6. Guardo el documento.
7. Cierro sesión y vuelvo a entrar en la aplicación.

No he incluido una contraseña de administrador predeterminada. La cuenta conserva la contraseña que elegí al registrarla.

### Sesiones

Los tokens caducan a las dos horas.

En cada petición privada consulto el usuario en MongoDB para comprobar su existencia y su rol actual.

En el frontend mantengo la sesión en memoria. Por tanto, al recargar la página tengo que volver a iniciar sesión.

## Imágenes con Cloudinary

He implementado la subida de fotografías mediante este flujo:

1. El usuario selecciona una imagen de su equipo.
2. El formulario la envía como `multipart/form-data`.
3. Multer recibe el archivo en memoria.
4. El servidor lo sube a Cloudinary.
5. Guardo su URL y su identificador en MongoDB.

Acepto imágenes JPG, PNG y WebP de hasta 5 MB.

Al eliminar una cuenta, primero intento eliminar su imagen de Cloudinary. Si el servicio falla, conservo la cuenta para poder reintentar la operación.

Si falla el registro después de subir la imagen, intento eliminar el archivo subido para evitar recursos huérfanos.

## Favoritos sin duplicados

Para añadir favoritos utilizo:

```js
$addToSet: {
  books: {
    $each: ids
  }
}
```

He elegido esta operación porque:

- Conserva los favoritos anteriores.
- Evita añadir una referencia repetida.
- Permite incorporar varios libros en una actualización atómica.

Antes de añadir las referencias compruebo que todos los libros existen.

Para quitar un favorito utilizo `$pull`.

## API

Las rutas privadas requieren esta cabecera:

```text
Authorization: Bearer TU_TOKEN
```

### Autenticación

| Método | Ruta | Función |
| --- | --- | --- |
| POST | `/api/auth/register` | Registrar una cuenta con imagen |
| POST | `/api/auth/login` | Iniciar sesión |

### Usuarios

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/api/users/me` | Usuario autenticado |
| GET | `/api/users` | Administrador |
| PATCH | `/api/users/:id` | Propietario o administrador |
| PATCH | `/api/users/:id/role` | Administrador |
| DELETE | `/api/users/:id` | Propietario o administrador |
| POST | `/api/users/:id/books` | Propietario o administrador |
| DELETE | `/api/users/:id/books/:bookId` | Propietario o administrador |

La edición general del usuario permite modificar su nombre. El cambio de rol tiene una ruta independiente.

### Libros

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/api/books` | Público |
| GET | `/api/books/:id` | Público |
| POST | `/api/books` | Administrador |
| PATCH | `/api/books/:id` | Administrador |
| DELETE | `/api/books/:id` | Administrador |

Al eliminar un libro, elimino también sus referencias en los favoritos de los usuarios mediante una transacción de MongoDB.

### Estado del servidor

```text
GET /health
```

Utilizo esta ruta para consultar el estado de la conexión con la base de datos.

## Uso de React

### Estados

He utilizado estados para gestionar datos y comportamientos concretos:

- Sesión del usuario.
- Catálogo de libros.
- Carga y errores de las peticiones.
- Texto del buscador.
- Libro que estoy editando.
- Estado de las acciones y mensajes de resultado.

### useEffect

Utilizo `useEffect` para cargar datos al entrar en las páginas y cancelar las peticiones cuando el componente se desmonta.

También lo utilizo para crear y liberar la URL temporal de la vista previa de la fotografía.

### Contexto

He creado `AuthContext` para compartir la sesión entre las páginas y la navegación.

He separado las acciones de autenticación en `AuthActionsContext`.

Consumo ambos contextos mediante los hooks `useAuth` y `useAuthActions`.

### Hooks personalizados

- `useBooks`: carga del catálogo, errores, cancelación y reintento.
- `useAction`: ejecución de acciones, bloqueo de dobles clics y mensajes.
- `useAuth`: acceso a los datos de sesión.
- `useAuthActions`: acceso a las acciones de autenticación.

### Formularios

He utilizado React Hook Form en:

- Registro.
- Inicio de sesión.
- Edición del nombre.
- Creación y edición de libros.

### Componentes reutilizables

He separado componentes como:

- `Layout`.
- `Brand`.
- `Field`.
- `BookCard`.
- `BookForm`.
- `Notice`.

### Renderizados

Para reducir trabajo innecesario:

- Mantengo el estado local dentro de la página que lo necesita.
- Utilizo `memo` en las tarjetas de libros.
- Utilizo `useCallback` para mantener estables sus funciones.
- Utilizo `useMemo` para el filtrado y el índice de favoritos.
- Utilizo formularios con campos no controlados mediante React Hook Form.

Los renderizados provocados por cambios de datos o de sesión siguen siendo necesarios. La medición con React Profiler queda pendiente de comprobar.

## Catálogo de demostración

Si la API no está disponible, muestro un catálogo local identificado como demostración.

En ese modo desactivo los favoritos y no simulo registros ni escrituras en MongoDB.

Cuando el servidor responde correctamente, utilizo los libros reales de la base de datos. Si la colección está vacía, tengo que ejecutar la semilla.

## Pruebas

npm test

## Comprobaciones realizadas

Durante la configuración he comprobado:

- Instalación de las dependencias.
- Compilación del frontend.
- Ejecución correcta de las cinco pruebas.
- Conexión real con MongoDB Atlas.
- Carga de los 24 libros.
- Registro de una cuenta con fotografía.
- Cambio manual del primer usuario a administrador.
- Funcionamiento de la búsqueda en el catálogo.

Antes de entregar todavía debo completar la revisión manual de favoritos, permisos con una segunda cuenta, eliminación de su imagen, diseño móvil y renderizados.

## Límites y mejoras pendientes

He limitado las listas de libros y usuarios a 100 resultados. La búsqueda del frontend filtra los libros cargados, por lo que una ampliación del catálogo requeriría paginación y búsqueda en el servidor.

MongoDB y Cloudinary no comparten una transacción. He incluido reintentos y compensaciones básicas, pero algunos fallos entre ambos servicios pueden requerir una revisión manual.

La validación y la adición de favoritos no forman una transacción conjunta con el borrado de libros. Una operación concurrente podría dejar una referencia obsoleta; para una versión de producción tendría que reforzar esa coordinación.

También dejo como mejoras:

- Optimizar el tamaño del JavaScript generado.
- Añadir recuperación de contraseña.
- Añadir verificación del correo.

