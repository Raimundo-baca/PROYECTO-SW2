# PROYECTO-SW2

API REST en Node.js para gestionar eventos academicos universitarios, ponentes y asistentes. El proyecto usa MongoDB como base de datos, ofrece respuestas JSON y XML, consume APIs externas y permite cargar un dataset inicial con mas de 1000 asistentes.

## Equipo De Desarrollo

- Ignacio Arvilla
- Raimundo Baca
- Adolfo Blanco
- Carlos Richante
- Pedro Varona
- Alfredo Martinez
- Juan Garcia Obregon

## Requisitos Previos

- Node.js.
- npm.
- MongoDB local arrancado en el puerto `27017`.

No hace falta crear manualmente la base de datos. MongoDB crea `eventos_academicos` cuando se ejecuta el script de carga.

## Instalacion

```bash
npm install
```

## Variables De Entorno

Crea un archivo `.env` en la raiz del proyecto con este contenido:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/eventos_academicos
NOMINATIM_USER_AGENT=proyecto-sw2-eventos-academicos/1.0
```

Tambien existe `.env.example` como plantilla para el equipo.

## Carga De Datos

Con MongoDB local arrancado:

```bash
npm run seed
```

El script limpia las colecciones e inserta:

- `speakers`: 1000 documentos.
- `events`: 1000 documentos.
- `attendees`: 1025 documentos.

Los eventos quedan relacionados con ponentes mediante `ids_ponentes`, y los asistentes quedan asociados a eventos mediante `event_id` e `ids_asistentes`.

## Arranque

Modo desarrollo:

```bash
npm run dev
```

Modo normal:

```bash
npm start
```

La API queda disponible en:

```text
http://localhost:3000
```

Ruta de comprobacion:

```text
GET http://localhost:3000/api/health
```

## Rutas Principales

### Ponentes

```text
GET    /api/speakers
GET    /api/speakers/:id
POST   /api/speakers
PUT    /api/speakers/:id
DELETE /api/speakers/:id
```

Ejemplo de creacion:

```bash
curl -X POST http://localhost:3000/api/speakers ^
  -H "Content-Type: application/json" ^
  -d "{\"nombre\":\"Ada Lovelace\",\"email\":\"ada@universidad.es\",\"departamento\":\"Informatica\",\"especialidad\":\"Bases de Datos\"}"
```

### Eventos

```text
GET    /api/events
GET    /api/events/:id
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id
GET    /api/events/:id/weather
```

Notas:

- `GET /api/events` devuelve JSON.
- `GET /api/events/:id` devuelve XML con schema asociado en `docs/event_schema.xsd`.
- `POST /api/events` consulta Nominatim y Open-Meteo para guardar datos externos en `external_data`.
- `GET /api/events/:id/weather` devuelve los datos externos guardados, sin depender de consultar Open-Meteo en tiempo real.

Ejemplo de creacion:

```bash
curl -X POST http://localhost:3000/api/events ^
  -H "Content-Type: application/json" ^
  -d "{\"titulo\":\"Congreso de IA\",\"descripcion\":\"Evento academico sobre IA\",\"fecha\":\"2026-06-15\",\"lugar\":\"Madrid\",\"ids_ponentes\":[]}"
```

### Asistentes

```text
GET    /api/attendees
GET    /api/attendees/:id
POST   /api/attendees
PUT    /api/attendees/:id
DELETE /api/attendees/:id
```

`GET /api/attendees` soporta paginacion y filtros:

```text
GET /api/attendees?page=1&limit=20
GET /api/attendees?grado=Ingenieria Informatica
GET /api/attendees?event_id=<id_evento>
GET /api/attendees?page=2&limit=50&grado=Ciencia de Datos
```

La respuesta paginada tiene esta forma:

```json
{
  "page": 1,
  "limit": 20,
  "total": 1025,
  "totalPages": 52,
  "data": []
}
```

Ejemplo de creacion:

```bash
curl -X POST http://localhost:3000/api/attendees ^
  -H "Content-Type: application/json" ^
  -d "{\"nombre\":\"Grace Hopper\",\"email\":\"grace@universidad.es\",\"grado\":\"Ingenieria Informatica\",\"event_id\":\"<id_evento>\"}"
```

## APIs Externas

El proyecto no necesita API key para las APIs externas:

- Nominatim / OpenStreetMap se consume en XML para obtener coordenadas desde el campo `lugar`.
- Open-Meteo se consume en JSON para obtener informacion meteorologica desde las coordenadas.

Si Nominatim u Open-Meteo no responden, la API sigue funcionando. En ese caso, el evento se crea igualmente y se guarda:

```json
{
  "available": false,
  "error": "External API unavailable"
}
```

## Scripts Disponibles

```bash
npm test
npm run seed
npm run dev
npm start
```

- `npm test`: comprueba sintaxis y ejecuta los tests del proyecto.
- `npm run seed`: carga el dataset inicial en MongoDB.
- `npm run dev`: arranca el servidor con `nodemon`.
- `npm start`: arranca el servidor con Node.js.

## Documentacion Adicional

- Plan del proyecto: `docs/planning_proyecto.md`
- Diseno REST: `docs/DiseñoInterfazREST.md`
- OpenAPI: `docs/openapi.yaml`
- Schema XML de evento: `docs/event_schema.xsd`
