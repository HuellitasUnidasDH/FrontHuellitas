# 🐾 Huellitas Unidas Dolores Hidalgo - Frontend Web App & PWA

[![Angular](https://img.shields.io/badge/Angular-22.x-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Signals](https://img.shields.io/badge/Angular-Signals_Reactive-blueviolet?style=flat)](https://angular.dev/guide/signals)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)
[![Vitest Tests](https://img.shields.io/badge/Tests-6%2F6%20Passing-brightgreen?style=flat&logo=vitest)](https://vitest.dev/)

Aplicación web progresiva (PWA) y Single Page Application (SPA) de última generación diseñada para la comunidad de **Dolores Hidalgo Cuna de la Independencia Nacional, Gto.** 

Facilita la adopción responsable de animales, el reporte geolocalizado de mascotas extraviadas o rescatadas, un muro comunitario de participación ciudadana, directorios de aliados veterinarios y el seguimiento post-adopción.

---

## 🏛️ Arquitectura del Proyecto

El frontend está construido sobre **Angular 22** utilizando *Standalone Components*, **Angular Signals** para reactividad de grano fino, y el nuevo sistema declarativo de flujo de control (`@if`, `@for`, `@switch`):

```text
FrontHuellitas/
├── src/
│   ├── app/
│   │   ├── core/                       # Servicios singleton, modelos y utilidades globales
│   │   │   ├── constants/              # Configuración de marca de Dolores Hidalgo
│   │   │   ├── guards/                 # Functional Guards (authGuard, roleGuard)
│   │   │   ├── interceptors/           # Interceptor HTTP para inyección de JWT y refresh tokens
│   │   │   ├── models/                 # Modelos TypeScript (User, Pet, LostPet, Adoption, Colonia, Ally)
│   │   │   └── services/               # AuthService, UserService, PetService, LostPetService, ThemeService
│   │   ├── features/                   # Módulos de vista cargados perezosamente (Lazy Loading)
│   │   │   ├── admin/                  # Panel de administración, auditoría y moderación
│   │   │   ├── adoptions/              # Catálogo público y solicitud formal de adopción
│   │   │   ├── allies/                 # Directorio de veterinarias, albergues y esterilizadores de DH
│   │   │   ├── auth/                   # Login, Registro, Recuperación y Restablecimiento de contraseña
│   │   │   ├── community-feed/         # Muro Comunitario social tipo red social
│   │   │   ├── dashboard/              # Panel general y métricas clínicas
│   │   │   ├── groups/                 # Cuidado compartido y Familias con código de unión
│   │   │   ├── lost-pets/              # Extravíos, avistamientos en cascada y mapa por colonia
│   │   │   ├── pets/                   # Expedientes y fichas médicas de mascotas
│   │   │   ├── profile/                # NUEVA Pantalla de Perfil de Usuario y Mis Publicaciones
│   │   │   ├── rescuer-dashboard/      # Seguimiento post-adopción a 7, 30 y 90 días
│   │   │   └── verification/           # Asistente de verificación de adoptante (Niveles 1-3)
│   │   ├── shared/                     # Componentes visuales reutilizables
│   │   │   ├── components/             # Navbar flotante minimalista, Footer, Notificaciones
│   │   │   └── pipes/                  # Pipes de formato y presentación
│   │   ├── app.config.ts               # Configuración de proveedores, HTTP Client y enrutamiento
│   │   └── app.routes.ts               # Definición de rutas protegidas y públicas
│   ├── environments/                   # Configuración para desarrollo y producción
│   └── styles.css                      # Sistema de diseño Liquid Glassmorphism y TailwindCSS
├── angular.json                        # Configuración de compilación Angular
├── vercel.json                         # Redirecciones SPA para despliegue en Vercel
└── package.json                        # Dependencias y scripts
```

---

## 🎨 Innovaciones en Interfaz de Usuario y Experiencia (UI/UX)

### 1. 🧭 Barra de Navegación Despejada (Navbar Minimalista)
- **Modo Navegador / Escritorio Limpio**: Se eliminó la saturación visual reduciendo los accesos directos principales a **solo 3 secciones primordiales**:
  1. 📰 **Muro**: El espacio social de noticias y reportes de la comunidad.
  2. 🏠 **Adopciones**: Peluditos buscando un hogar responsable.
  3. 🚨 **Perdidos**: Alertas inmediatas de extravío y hallazgo.
- **Menú Desplegable "Explorar ▾"**: Una sutil flecha despliega un menú compacto con las secciones secundarias (Directorio de Aliados, Panel de Rescatista, Verificación, Dashboard, Mascotas, Familias y Panel Admin).
- **Control Integrado en el Avatar del Usuario**:
  - Los botones sueltos de **Modo Oscuro/Claro** y de **Cerrar Sesión** fueron removidos de la barra principal para no saturar.
  - Ahora se encuentran organizados dentro del menú desplegable del avatar del usuario junto con el enlace directo a **Mi Perfil**.

### 2. 👤 Nueva Pantalla de Perfil de Usuario (`/perfil`)
- **Cabecera de Perfil**: Foto de avatar personal con insignia de rol, nivel de verificación, correo, teléfono y colonia de Dolores Hidalgo.
- **Cambio Rápido de Foto de Avatar**: Modal interactivo para actualizar la URL de la fotografía de perfil con previsualización en tiempo real y sincronización reactiva inmediata en la barra superior sin recargar la página.
- **Edición de Datos Personales**: Formulario para modificar nombre completo, teléfono y selección de colonia oficial de Dolores Hidalgo.
- **Pestañas de Publicaciones Propias**:
  - 🏠 **Mis Mascotas en Adopción**: Tarjetas con estado de adopción y enlace a su ficha.
  - 🚨 **Mis Reportes de Extravío / Rescate**: Visualización de reportes activos y contador de **avistamientos en cascada** reportados por la comunidad.
  - 📋 **Mis Solicitudes de Adopción**: Historial y estado actual (*PENDIENTE*, *APROBADA*, *RECHAZADA*).

### 3. 📱 Experiencia Móvil de Calidad Nativa
- **Dock de Navegación Inferior**: Barra flotante inferior tipo app móvil ergonómica para interacción con el pulgar.
- **Cajón Lateral Deslizable (Drawer)**: Menú completo con información del usuario, acceso a su perfil, cambio de tema y cierre de sesión.

### 4. 📰 Muro Comunitario Social Reactivo (Angular 22 Zoneless)
- **Búsqueda Instantánea con Signals**: Filtro reactivo en tiempo real con normalización Unicode (`normalize('NFD')`) que busca a través de título, historia, especie, raza, colonia, ubicación y temperamento.
- **Filtros Rápidos Flexibles**: Botones de un toque para *"Bueno con niños"* y *"Convive con mascotas"* compatibles tanto con catálogo de adopciones como reportes vecinales.
- **Títulos Completos en Móviles**: Eliminación de truncamiento forzado (`line-clamp-1` -> `leading-snug break-words`) para lectura clara en pantallas pequeñas.
- **Comentarios Optimistas en 0ms**: Publicación visual inmediata con rollback defensivo si ocurre un fallo de red.
- **Recarga Silenciosa**: Polling de comentarios cada 8s únicamente en tarjetas abiertas y verificación de nuevos posts cada 35s manteniendo la posición exacta del scroll.

### 5. ⚡ Carga Multimedia Ultra-Rápida y Galería Lightbox (3 a 6 Fotos)
- **Cero Lag en Móviles**: Sustitución de cadenas Base64 pesadas por `URL.createObjectURL(file)` en una única actualización atómica de Signals.
- **Liberación de Memoria**: Invocación automática de `URL.revokeObjectURL()` al remover miniaturas o cerrar modales.
- **Límites por Rol**: Soporte de hasta 3 fotografías para usuarios generales y hasta 6 fotografías para rescatistas y administradores.
- **Visor Lightbox a Pantalla Completa**: Interfaz inmersiva con navegación táctil, teclas de flechas y miniaturas inferiores.

### 6. 🛡️ Aprobación de Verificación de Adoptantes (Niveles 2 y 3)
- **Pestaña en Panel de Rescatista**: Interfaz dedicada para que Rescatistas Verificados y Administradores revisen cuestionarios y autoricen o rechacen solicitudes de Nivel 2 y 3.
- **Bloqueo Defensivo del Nivel 3**: Candado interactivo que impide enviar o activar Nivel 3 mientras Nivel 2 permanezca en revisión o sin aprobar.

### 7. 📍 Catálogo Territorial Inteligente (138 Colonias con Consumo Único)
- **Ahorro Extremo de Datos**: Implementación de triple nivel (memoria + `localStorage` con clave `huellitas_colonias_dh_cache_v4` + `shareReplay(1)`).
- **Filtro por Código Postal en Modales**: Permite escribir el C.P. (ej. 37800, 37804, 37806) o el nombre para autocompletar la colonia en segundos.

### 8. 🔔 Enlace Profundo (Deep-Linking) desde Notificaciones
- Al pulsar cualquier notificación de comentario o avistamiento, la app navega a `/?postId=lost-{id}` o `/?postId=pet-{id}`, abre los comentarios y hace scroll automático con un anillo de resalte esmeralda.

### 9. 🔒 Protección de Creación de Publicaciones para Invitados
- Ocultamiento de la barra de redacción y botones de publicación cuando no se tiene sesión activa.
- Guardas en TypeScript en `openPublicationModal()`, `openAdoptionModal()` y `openSightingModal()` que impiden abrir formularios sin login, evitando pérdida de tiempo.

### 10. 🔑 Recuperación de Contraseña Intuitiva
- Flujo guiado de dos pasos (`/auth/forgot-password` y `/auth/reset-password`).
- Verificación de coincidencias de contraseña en tiempo real e indicadores de seguridad.

---

## 🛡️ Seguridad y Buenas Prácticas en el Frontend

| Aspecto | Implementación Técnica |
| :--- | :--- |
| **Protección de Rutas** | `authGuard` protege rutas privadas; `roleGuard` restringe acceso exclusivo a administradores. |
| **Inyección Transparente de Tokens** | `authInterceptor` añade el encabezado `Authorization: Bearer <token>` a cada llamada HTTP. |
| **Renovación Silenciosa de Sesión** | Si el servidor devuelve código `401 Unauthorized`, el interceptor intenta refrescar el token automáticamente sin interrumpir al usuario. |
| **Defensa contra XSS** | Uso estricto de enlace de propiedades (`[textContent]`, interpolación segura `{{ }}`) y el `DomSanitizer` de Angular. |
| **Persistencia Segura** | Almacenamiento desacoplado mediante `StorageService` con gestión controlada de cierre de sesión y purga de caché. |
| **Manejo Centralizado de Errores** | `NotificationService` con alertas tostada (*toast notifications*) elegantes y amigables. |

---

## ⚙️ Configuración de Entornos

Las URLs base de conexión con la API se configuran en `src/environments/`:

- **Desarrollo (`environment.ts`)**:
  ```typescript
  export const environment = {
    production: false,
    apiUrl: 'http://localhost:3000/api/v1',
  };
  ```

- **Producción (`environment.prod.ts`)**:
  ```typescript
  export const environment = {
    production: true,
    apiUrl: 'https://huellitas-backend.onrender.com/api/v1',
  };
  ```

---

## 🧪 Pruebas Unitarias y Compilación

```bash
# 1. Instalar dependencias
npm install

# 2. Correr pruebas unitarias (Vitest)
npm test -- --watch=false

# 3. Compilar la aplicación para producción
npm run build

# 4. Iniciar servidor de desarrollo local
npm start
```
El servidor local iniciará en `http://localhost:4200/`.

