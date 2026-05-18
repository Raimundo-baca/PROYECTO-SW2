# Planning del Proyecto SW2: API REST de Eventos Academicos

## Objetivo

Implementar una API REST en Node.js para gestionar eventos academicos universitarios, ponentes y asistentes, usando MongoDB como base de datos y cumpliendo los requisitos del enunciado del proyecto.

La prioridad es entregar una API funcional, documentada y ejecutable "out-of-the-box", sin desarrollar cliente frontend ni webhook salvo que sobre tiempo al final.

## Requisitos Que Hay Que Cubrir

- API programada en Node.js.
- Base de datos MongoDB.
- Interfaz REST con operaciones CRUD.
- Tres recursos relacionados:
  - `events`
  - `speakers`
  - `attendees`
- Cada recurso debe guardarse en una coleccion distinta.
- Al menos una coleccion debe tener mas de 1000 documentos.
- Debe existir un dataset en el repositorio para inicializar las colecciones.
- Los datos deben poder cargarse automaticamente con un script npm.
- Al menos una ruta debe permitir paginacion sobre la coleccion grande.
- Al menos una ruta debe permitir filtrado sobre la coleccion grande.
- La API debe ofrecer mensajes en JSON y XML.
- Al menos un mensaje XML ofrecido por nuestra API debe tener un schema asociado.
- La API debe consumir informacion de una API externa en XML.
- La API debe consumir informacion de una API externa en JSON.
- La informacion externa consumida debe integrarse con el resto de la API y guardarse en MongoDB.
- La API debe seguir funcionando aunque la API externa este caida.
- El repositorio debe incluir documentacion suficiente para ejecutar el proyecto.

## Decision Tecnica Principal

La API externa se dividira en dos servicios para cumplir claramente el requisito XML + JSON:

- **Nominatim / OpenStreetMap** para geolocalizacion en XML.
  - Se usara para obtener coordenadas a partir del campo `lugar` de un evento.
  - Ejemplo conceptual: `https://nominatim.openstreetmap.org/search?q=Madrid&format=xml&limit=1`
  - Documentacion: https://nominatim.org/release-docs/latest/api/Search/

- **Open-Meteo** para clima en JSON.
  - Se usara para obtener informacion meteorologica a partir de las coordenadas devueltas por Nominatim.
  - Ejemplo conceptual: `https://api.open-meteo.com/v1/forecast?latitude=40.4168&longitude=-3.7038&current=temperature_2m,wind_speed_10m`
  - Documentacion: https://open-meteo.com/en/docs

Esta decision es mejor que usar solo una API externa porque permite explicar de forma muy clara:

- XML externo consumido: Nominatim.
- JSON externo consumido: Open-Meteo.
- XML propio ofrecido por nuestra API: `GET /api/events/:id`.
- JSON propio ofrecido por nuestra API: la mayoria de rutas CRUD.

Importante: las llamadas a Nominatim deben incluir un `User-Agent` identificable, por ejemplo:

```http
User-Agent: proyecto-sw2-eventos-academicos/1.0
```

## Modelo De Datos

### Coleccion `events`

Representa los eventos academicos.

Campos principales:

- `_id`
- `titulo`
- `descripcion`
- `fecha`
- `lugar`
- `ids_ponentes`
- `ids_asistentes`
- `external_data`
- `createdAt`
- `updatedAt`

Ejemplo de `external_data` cuando las APIs externas funcionan:

```json
{
  "available": true,
  "coordinates": {
    "lat": 40.4168,
    "lon": -3.7038,
    "source": "nominatim"
  },
  "weather": {
    "temperature": 22,
    "wind_speed": 8,
    "source": "open-meteo"
  }
}
```

Ejemplo de `external_data` si falla una API externa:

```json
{
  "available": false,
  "error": "External API unavailable"
}
```

### Coleccion `speakers`

Representa los ponentes de los eventos.

Campos principales:

- `_id`
- `nombre`
- `email`
- `departamento`
- `especialidad`

### Coleccion `attendees`

Representa los asistentes inscritos en eventos.

Campos principales:

- `_id`
- `nombre`
- `email`
- `grado`
- `event_id`

Esta sera la coleccion con mas de 1000 documentos.

## Relaciones Entre Recursos

- Un evento puede tener varios ponentes mediante `ids_ponentes`.
- Un ponente puede participar en varios eventos.
- Un evento puede tener muchos asistentes mediante `ids_asistentes`.
- Un asistente queda asociado a un evento mediante `event_id`.

Estas relaciones cumplen el requisito de tener al menos tres recursos relacionados entre ellos.

## Rutas REST

### Eventos

- `GET /api/events`
  - Devuelve la lista de eventos en JSON.

- `GET /api/events/:id`
  - Devuelve el detalle de un evento en XML.
  - El XML debe validarse con `docs/event_schema.xsd`.

- `POST /api/events`
  - Crea un evento.
  - Consume Nominatim en XML para obtener coordenadas.
  - Consume Open-Meteo en JSON para obtener clima.
  - Guarda los datos externos en `external_data`.
  - Si falla la API externa, crea el evento igualmente con `external_data.available = false`.

- `PUT /api/events/:id`
  - Actualiza un evento.
  - Si cambia el campo `lugar`, se vuelven a consultar los datos externos.

- `DELETE /api/events/:id`
  - Elimina un evento.

- `GET /api/events/:id/weather`
  - Devuelve los datos meteorologicos guardados en `external_data.weather`.
  - No debe depender obligatoriamente de llamar a Open-Meteo en tiempo real.

### Ponentes

- `GET /api/speakers`
- `GET /api/speakers/:id`
- `POST /api/speakers`
- `PUT /api/speakers/:id`
- `DELETE /api/speakers/:id`

Todas estas rutas devuelven JSON.

### Asistentes

- `GET /api/attendees`
- `GET /api/attendees/:id`
- `POST /api/attendees`
- `PUT /api/attendees/:id`
- `DELETE /api/attendees/:id`

La ruta `GET /api/attendees` debe soportar paginacion y filtros.

Ejemplos:

```text
/api/attendees?page=1&limit=20
/api/attendees?grado=Ingenieria
/api/attendees?event_id=665f...
/api/attendees?page=2&limit=50&grado=Informatica
```

## XML Y Schema

El endpoint `GET /api/events/:id` sera el mensaje XML principal ofrecido por nuestra API.

Archivo requerido:

```text
docs/event_schema.xsd
```

Estructura esperada del XML:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<event xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="event_schema.xsd">
  <id>665f...</id>
  <titulo>Congreso Internacional de Inteligencia Artificial</titulo>
  <descripcion>Evento academico sobre IA.</descripcion>
  <fecha>2026-05-15</fecha>
  <lugar>Madrid</lugar>
  <ids_ponentes>
    <ponente_id>665a...</ponente_id>
  </ids_ponentes>
  <ids_asistentes>
    <asistente_id>665b...</asistente_id>
  </ids_asistentes>
</event>
```

Este XML es independiente del XML consumido desde Nominatim. Hay que explicar ambos en la documentacion:

- XML consumido desde fuera: respuesta de Nominatim.
- XML devuelto por nuestra API: detalle de evento.

## Dataset Y Seed

Crear carpeta:

```text
data/
```

Archivos recomendados:

```text
data/events.json
data/speakers.json
data/attendees.json
```

Requisitos del dataset:

- `attendees.json` debe contener al menos 1000 asistentes.
- Los asistentes deben tener valores variados de `grado`.
- Los asistentes deben estar repartidos entre varios eventos mediante `event_id`.
- Los eventos deben estar relacionados con ponentes mediante `ids_ponentes`.

Crear script:

```text
scripts/seed.js
```

Script npm:

```json
{
  "scripts": {
    "seed": "node scripts/seed.js"
  }
}
```

El comando esperado sera:

```bash
npm run seed
```

El script debe:

- Conectar a MongoDB.
- Limpiar las colecciones.
- Insertar ponentes.
- Insertar eventos.
- Insertar asistentes.
- Relacionar asistentes y ponentes con eventos.
- Mostrar por consola cuantos documentos se han cargado.

## Orden De Trabajo Recomendado

### Fase 1: Corregir Documentacion De Diseno

- Actualizar `docs/DiseñoInterfazREST.md`.
- Corregir la parte de API externa:
  - Nominatim XML para coordenadas.
  - Open-Meteo JSON para clima.
- Aclarar que `GET /api/events/:id` devuelve XML con schema.
- Unificar nombres de campos con `docs/openapi.yaml`.

### Fase 2: Crear Proyecto Node.js

- Inicializar `package.json`.
- Instalar dependencias principales:
  - `express`
  - `mongoose`
  - `dotenv`
  - `cors`
  - `fast-xml-parser`
  - `xmlbuilder2`
- Instalar dependencia de desarrollo:
  - `nodemon`
- Crear servidor base.
- Crear conexion a MongoDB.
- Configurar variables de entorno.

### Fase 3: Crear Modelos Mongoose

- Crear modelo `Event`.
- Crear modelo `Speaker`.
- Crear modelo `Attendee`.
- Activar timestamps.
- Validar campos obligatorios basicos:
  - `titulo`, `fecha`, `lugar` en eventos.
  - `nombre`, `email` en ponentes.
  - `nombre`, `email`, `event_id` en asistentes.

### Fase 4: CRUD De Ponentes

- Implementar rutas de ponentes.
- Implementar controlador de ponentes.
- Verificar crear, listar, obtener por id, actualizar y eliminar.

### Fase 5: CRUD De Eventos

- Implementar rutas de eventos.
- Implementar controlador de eventos.
- Integrar eventos con ponentes mediante `ids_ponentes`.
- Preparar el campo `external_data`.

### Fase 6: Integracion Externa

- Crear servicio para Nominatim.
- Consumir Nominatim con `format=xml`.
- Parsear XML para extraer `lat` y `lon`.
- Crear servicio para Open-Meteo.
- Consumir Open-Meteo en JSON usando las coordenadas.
- Guardar resultado procesado en `external_data`.
- Implementar fallback si falla Nominatim u Open-Meteo.

### Fase 7: CRUD De Asistentes

- Implementar rutas de asistentes.
- Implementar controlador de asistentes.
- Asociar cada asistente a un evento con `event_id`.
- Actualizar `ids_asistentes` en el evento correspondiente cuando se cree una inscripcion.

### Fase 8: Paginacion Y Filtros

- Implementar en `GET /api/attendees`:
  - `page`
  - `limit`
  - `grado`
  - `event_id`
- Devolver metadatos utiles:

```json
{
  "page": 1,
  "limit": 20,
  "total": 1000,
  "totalPages": 50,
  "data": []
}
```

### Fase 9: XML Propio Y XSD

- Crear generador XML para eventos.
- Crear `docs/event_schema.xsd`.
- Hacer que `GET /api/events/:id` responda con `Content-Type: application/xml`.
- Validar manualmente que el XML cumple el schema.

### Fase 10: Dataset Y Script De Carga

- Crear dataset JSON.
- Crear `scripts/seed.js`.
- Añadir `npm run seed`.
- Verificar que la coleccion `attendees` supera los 1000 documentos.

### Fase 11: OpenAPI

- Actualizar `docs/openapi.yaml`.
- Documentar todas las rutas.
- Documentar parametros de paginacion y filtro.
- Documentar respuesta XML de `GET /events/{id}`.
- Documentar respuesta de `/events/{id}/weather`.
- Documentar respuestas de error principales:
  - `400`
  - `404`
  - `500`

### Fase 12: README

Actualizar `README.md` con:

- Descripcion del proyecto.
- Miembros del grupo.
- Requisitos previos:
  - Node.js.
  - MongoDB local.
- Instalacion:

```bash
npm install
```

- Variables de entorno:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/eventos_academicos
NOMINATIM_USER_AGENT=proyecto-sw2-eventos-academicos/1.0
```

- Carga de datos:

```bash
npm run seed
```

- Arranque:

```bash
npm run dev
```

- Ejemplos de uso de las rutas principales.
- Explicacion de que no se necesita API key para Nominatim ni Open-Meteo.
- Nota sobre fallback si las APIs externas no responden.

## Verificacion Manual Antes De Entregar

Comprobar:

- `npm install` funciona en una copia limpia del repositorio.
- MongoDB local esta arrancado.
- `npm run seed` carga correctamente los datos.
- Hay mas de 1000 asistentes en MongoDB.
- `npm run dev` arranca la API.
- `GET /api/speakers` funciona.
- `POST /api/speakers` funciona.
- `GET /api/events` funciona.
- `POST /api/events` crea un evento y guarda `external_data`.
- `GET /api/events/:id` devuelve XML.
- El XML de evento tiene schema asociado.
- `GET /api/events/:id/weather` devuelve datos guardados de clima.
- `GET /api/attendees?page=1&limit=20` pagina correctamente.
- `GET /api/attendees?grado=Ingenieria` filtra correctamente.
- `GET /api/attendees?event_id=...` filtra correctamente.
- Si Nominatim u Open-Meteo fallan, se puede seguir creando el evento.
- El README permite ejecutar el proyecto sin preguntar nada al grupo.

## Preparacion De La Demo

La presentacion dura como maximo 10 minutos. Orden recomendado:

1. Explicar objetivo del proyecto.
2. Enseñar los tres recursos y sus relaciones.
3. Enseñar MongoDB con las tres colecciones.
4. Ejecutar `npm run seed`.
5. Mostrar la coleccion `attendees` con mas de 1000 documentos.
6. Probar CRUD basico en JSON.
7. Probar paginacion y filtros de asistentes.
8. Probar `GET /api/events/:id` en XML.
9. Enseñar `docs/event_schema.xsd`.
10. Crear un evento y enseñar los datos externos guardados.
11. Explicar fallback si la API externa falla.

## Trabajo Opcional Solo Si Sobra Tiempo

No es parte del alcance principal.

- Tests automaticos de rutas.
- Webhook.
- Cliente frontend desacoplado.

La recomendacion es hacer primero la API obligatoria completa y documentada. El cliente frontend no es necesario para cumplir el proyecto y puede consumir mucho tiempo.

