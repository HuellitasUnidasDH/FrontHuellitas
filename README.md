# 🐶 VetRegistro Web - Frontend de Gestión de Mascotas y Clínica

[![Angular](https://img.shields.io/badge/Angular-22.x-DD0031?style=flat&logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)
[![CSS3](https://img.shields.io/badge/CSS3-Modern_Design-1572B6?style=flat&logo=css3&logoColor=white)](https://www.w3.org/Style/CSS/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](#)

Aplicación web moderna de tipo **Single Page Application (SPA)** desarrollada en Angular para la administración clínica de pacientes animales, carnets digitales de salud, perfiles de dueños y panel de supervisión veterinaria. Diseñada con un enfoque centrado en la experiencia de usuario (UI/UX), alto rendimiento y diseño responsivo.

---

## 🛠️ Tecnologías Utilizadas

| Categoría | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Framework Web** | **Angular 22** | SPA moderna utilizando *Standalone Components* y la nueva sintaxis de Control Flow (`@if`, `@for`). |
| **Lenguaje** | **TypeScript 5** | Tipado estricto de interfaces, servicios y contratos de API. |
| **Gestión de Estado** | **Angular Signals & RxJS** | Reactividad granular de alto rendimiento para el estado de autenticación y carga de datos. |
| **Enrutamiento** | **Angular Router** | Carga perezosa (*Lazy Loading*) por módulo para reducir el bundle inicial. |
| **Seguridad de Rutas** | **Functional Route Guards** | `authGuard` y `roleGuard` protegiendo accesos a usuarios no autorizados. |
| **Comunicación HTTP** | **HttpClient + Interceptors** | Inyección transparente de tokens JWT Bearer y manejo centralizado de respuestas y errores. |
| **Formularios** | **Reactive Forms** | Formularios reactivos con validaciones visuales instantáneas y prevención de envíos inválidos. |
| **Estilos & UI** | **Vanilla CSS Moderno** | Diseño sin dependencias pesadas, paleta de colores curada, efectos glassmorphism y microanimaciones. |
| **Alojamiento Cloud** | **Vercel** | Despliegue continuo (CI/CD) conectado a GitHub con redirecciones SPA (`vercel.json`). |

---

## 🚀 Capacidades y Funcionalidades

### 1. Sistema de Autenticación y Sesión
- **Login y Registro Reactivos**: Formularios con validación en tiempo real de correos, contraseñas seguras y campos obligatorios.
- **Persistencia de Sesión Segura**: Almacenamiento seguro de tokens (`accessToken` y `refreshToken`) en el almacenamiento del navegador.
- **Intercepción Automática**: El `authInterceptor` añade el encabezado `Authorization: Bearer <token>` a cada solicitud hacia la API.
- **Cierre de Sesión Limpio**: Limpieza de estado en memoria y redirección automática hacia la pantalla de inicio de sesión.

### 2. Panel Principal (Dashboard)
- Visualización de estadísticas rápidas: Mascotas registradas, últimas visitas clínicas y recordatorios de citas.
- Accesos directos para dar de alta nuevas mascotas o generar consultas médicas.

### 3. Módulo de Mascotas (`/pets`)
- **Catálogo de Mascotas**: Tarjetas visuales con fotografía, nombre, raza, especie, edad calculada y peso.
- **Filtros Dinámicos**: Búsqueda en tiempo real por nombre, especie o número de microchip.
- **Formulario de Alta y Edición**: Registro detallado con datos generales, estado de esterilización, sexo y observaciones.
- **Ficha Clínica Individual**: Vista detallada de la mascota con su historial médico cronológico, vacunas y prescripciones.

### 4. Panel de Administración (`/admin`)
- Vista exclusiva para usuarios con rol `ADMIN`.
- Visualización de bitácora de auditoría y supervisión de actividades recientes del sistema.

### 5. Experiencia de Usuario y Accesibilidad
- **Diseño Adaptativo (Mobile-First)**: Interfaz que se adapta fluidamente a pantallas de teléfonos, tablets y computadoras de escritorio.
- **Feedback Visual**: Indicadores de carga (*spinners*), alertas descriptivas ante errores de red o credenciales incorrectas.

---

## 📁 Estructura del Proyecto

```text
FrontRegistroMascotas/
├── src/
│   ├── app/
│   │   ├── core/               # Núcleo de la aplicación (singleton)
│   │   │   ├── guards/         # authGuard y roleGuard
│   │   │   ├── interceptors/   # authInterceptor para JWT
│   │   │   ├── models/         # Interfaces TypeScript (User, Pet, MedicalRecord, ApiResponse)
│   │   │   └── services/       # AuthService, PetsService, ApiService
│   │   ├── features/           # Módulos de funcionalidad (Lazy Loaded)
│   │   │   ├── admin/          # Panel administrativo y auditoría
│   │   │   ├── auth/           # Vistas de Login y Registro
│   │   │   ├── dashboard/      # Panel de inicio y métricas
│   │   │   └── pets/           # Lista, detalle y formularios de mascotas
│   │   ├── shared/             # Componentes, pipes y directivas compartidas
│   │   ├── app.config.ts       # Configuración global de proveedores y enrutamiento
│   │   └── app.routes.ts       # Definición de rutas protegidas
│   ├── environments/           # Variables de entorno (desarrollo y producción)
│   │   ├── environment.ts      # Apunta a http://localhost:3000/api/v1
│   │   └── environment.prod.ts # Apunta a https://mismascotasback.onrender.com/api/v1
│   └── styles.css              # Tokens de diseño, variables CSS y estilos globales
├── angular.json                # Configuración de compilación y reemplazo de entornos
├── vercel.json                 # Reglas de reescritura para rutas SPA en Vercel
└── package.json                # Dependencias de Angular y scripts
```

---

## ⚙️ Configuración de Entornos

Las URLs de la API se configuran en la carpeta `src/environments/`:

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
    apiUrl: 'https://mismascotasback.onrender.com/api/v1',
  };
  ```

> `angular.json` está configurado con `fileReplacements` para intercambiar automáticamente el archivo durante la compilación en producción (`ng build`).

---

## 💻 Ejecución Local

### Prerrequisitos
- Node.js 20+ y NPM instalados.

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm start
# o: ng serve

# 3. Abrir en el navegador
# http://localhost:4200
```

---

## ☁️ Despliegue en Producción (Vercel)

La aplicación incluye [vercel.json](vercel.json) para soportar navegación directa en cualquier ruta sin error 404:

```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Pasos para desplegar:
1. Conecta tu repositorio de GitHub en [Vercel](https://vercel.com).
2. Vercel detectará el preset de **Angular**.
3. Asegúrate de que el **Output Directory** esté en: `dist/FrontRegistroMascotas/browser`.
4. Haz clic en **Deploy** y tu sitio quedará publicado con HTTPS y CDN global en cuestión de segundos.
