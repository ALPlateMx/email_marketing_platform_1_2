# Workana MailHub - Plataforma de Email Marketing

## 1. Arquitectura Actual (Fase 1 Completada)

Hemos desarrollado una plataforma funcional con arquitectura Cliente-Servidor (Frontend-Backend) lista para pruebas locales y despliegue inicial.

### Frontend (Interfaz de Usuario)
- **Tecnología**: HTML5, CSS3, JavaScript Vanilla.
- **Ubicación**: Carpeta `public/`
- **Características**:
  - Panel interactivo para seleccionar plantillas de correo.
  - Vista previa en tiempo real (Desktop/Móvil) conectada al backend.
  - Formulario de despacho con soporte para múltiples destinatarios.
  - Tabla de historial de envíos (cargada dinámicamente).
  - Incorporación del Logotipo oficial de Workana.

### Backend (Lógica de Negocio y Envíos)
- **Tecnología**: Python 3.13 con framework **Flask**.
- **Ubicación**: Archivo `app.py`.
- **Características**:
  - **API RESTful**:
    - `GET /api/templates/<id>/preview`: Compila y sirve la vista previa HTML.
    - `POST /api/campaigns/send`: Procesa y envía los correos.
    - `GET & DELETE /api/campaigns/history`: Gestiona el historial.
  - **Motor de Plantillas**: Lee archivos HTML locales (`templates/emails/`) y reemplaza variables dinámicas como `{nombre}`.
  - **Módulo SMTP**: Integración nativa con `smtplib` y soporte para correos en formato `UTF-8` (garantizando correcta visualización de tildes y eñes).
  - **Persistencia de Datos**: Almacenamiento local ligero en `history.json` para el registro de envíos.

## 2. Flujo de Funcionamiento

1. **Usuario**: Selecciona Plantilla y escribe una etiqueta `{nombre}`.
2. **Frontend**: Solicita la vista previa al backend.
3. **Backend**: Devuelve HTML compilado en vivo.
4. **Usuario**: Hace clic en "Despachar Campaña".
5. **Backend**: Conecta mediante SMTP (usando credenciales del archivo `.env`), formatea con codificación `UTF-8` y envía el correo.
6. **Backend**: Guarda el registro en `history.json`.
7. **Frontend**: Muestra éxito y actualiza la tabla del historial.

## 3. Próximas Fases Sugeridas (Plan Futuro)

### Fase 2: Mejora de Datos y Plantillas
- **Base de Datos Relacional**: Migrar `history.json` a una base de datos real (como SQLite o PostgreSQL) para manejar miles de envíos.
- **Editor Visual de Plantillas**: Integrar un editor "Drag and Drop" o TinyMCE para editar los correos desde la misma plataforma web en lugar de modificar los archivos HTML manualmente.

### Fase 3: Analíticas y Seguimiento
- **Tracking de Aperturas**: Insertar un píxel invisible en los correos para registrar cuándo los destinatarios abren el correo.
- **Estadísticas Visuales**: Añadir gráficos (con Chart.js) en el panel principal mostrando % de éxito, aperturas y rebotes.

### Fase 4: Despliegue a Producción (Internet)
- **Hosting / Servidor Nube**: Subir el proyecto a un servidor real (como Heroku, Render o un VPS en Google Cloud).
- **Autenticación (Login)**: Proteger la plataforma con usuario y contraseña para que solo tú puedas enviar campañas.
