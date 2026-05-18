# Diseño de la Interfaz REST: Gestión de Eventos Académicos

Este documento describe la interfaz REST diseñada para una plataforma de gestión de eventos académicos universitarios. La API se estructura en torno a tres recursos principales relacionados entre sí: **Eventos**, **Ponentes** y **Asistentes**.

La API trabajará con MongoDB, ofrecerá mensajes en JSON y XML, y consumirá información de servicios externos en los dos formatos exigidos por el enunciado:

- XML externo consumido: Nominatim / OpenStreetMap para geolocalización.
- JSON externo consumido: Open-Meteo para información meteorológica.
- XML propio ofrecido por la API: detalle de evento en `GET /api/events/{id}`.
- JSON propio ofrecido por la API: la mayoría de rutas CRUD.

## 1. Listado de Endpoints

### Recurso: Eventos (`/events`)

Este recurso gestiona la información principal de los actos académicos, como conferencias, congresos y talleres.

| Método | Endpoint | Descripción | Formato |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/events` | Obtener un listado de todos los eventos. | JSON |
| **GET** | `/api/events/{id}` | Obtener el detalle de un evento específico. | **XML** con schema asociado |
| **POST** | `/api/events` | Crear un nuevo evento académico y enriquecerlo con datos externos. | JSON |
| **PUT** | `/api/events/{id}` | Actualizar los datos de un evento existente. | JSON |
| **DELETE** | `/api/events/{id}` | Eliminar un evento del sistema. | N/A |
| **GET** | `/api/events/{id}/weather` | Consultar los datos meteorológicos guardados para el evento. | JSON |

### Recurso: Ponentes (`/speakers`)

Gestiona la información de los expertos que imparten o participan en los eventos.

| Método | Endpoint | Descripción | Formato |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/speakers` | Obtener un listado de todos los ponentes. | JSON |
| **GET** | `/api/speakers/{id}` | Obtener el perfil público de un ponente. | JSON |
| **POST** | `/api/speakers` | Registrar un nuevo ponente en el sistema. | JSON |
| **PUT** | `/api/speakers/{id}` | Editar la información de un ponente. | JSON |
| **DELETE** | `/api/speakers/{id}` | Eliminar a un ponente de la base de datos. | N/A |

### Recurso: Asistentes (`/attendees`)

Gestiona las inscripciones a los eventos. Esta colección será el dataset principal con más de 1000 documentos.

| Método | Endpoint | Descripción | Formato |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/attendees` | Listar asistentes con paginación y filtros. | JSON |
| **GET** | `/api/attendees/{id}` | Obtener los datos de inscripción de un asistente. | JSON |
| **POST** | `/api/attendees` | Registrar un nuevo asistente a un evento. | JSON |
| **PUT** | `/api/attendees/{id}` | Modificar los datos de un asistente registrado. | JSON |
| **DELETE** | `/api/attendees/{id}` | Cancelar la inscripción de un asistente. | N/A |

---

## 2. Justificación del Diseño y Requisitos Cumplidos

Para dar cumplimiento a los requisitos técnicos del proyecto, el diseño presenta las siguientes características:

- **Relaciones entre recursos en MongoDB:**
  - Cada **Evento** puede estar vinculado a varios **Ponentes** mediante `ids_ponentes`.
  - Cada **Evento** puede estar vinculado a varios **Asistentes** mediante `ids_asistentes`.
  - Cada **Asistente** referencia el evento al que asiste mediante `event_id`.

- **Paginación y filtrado sobre dataset masivo:**
  - La colección `attendees` contendrá más de 1000 documentos.
  - El endpoint `GET /api/attendees` aceptará parámetros de paginación: `page` y `limit`.
  - El endpoint `GET /api/attendees` aceptará filtros como `grado` y `event_id`.

- **Mensajes JSON y XML ofrecidos por la API:**
  - Las rutas CRUD responderán principalmente en JSON.
  - El endpoint `GET /api/events/{id}` responderá en XML.
  - El XML de evento tendrá un schema asociado en `docs/event_schema.xsd`.

- **Consumo de API externa en XML y JSON:**
  - Nominatim se consumirá en XML para obtener coordenadas a partir de `lugar`.
  - Open-Meteo se consumirá en JSON para obtener clima a partir de las coordenadas.
  - Los datos externos se integrarán en el documento del evento dentro de `external_data`.

- **Tolerancia a fallos externos:**
  - Si Nominatim u Open-Meteo no responden, el evento se creará igualmente.
  - En ese caso se guardará `external_data.available = false` junto con un mensaje de error.

---

## 3. Ejemplos de Mensajes

A continuación se muestran ejemplos representativos de las respuestas de la API, cubriendo los formatos JSON y XML exigidos.

### Ejemplo JSON: Detalle de un Asistente

**Endpoint:** `GET /api/attendees/60d5ec49f1b2c86734211111`

Este mensaje devuelve la información de un documento de la colección de asistentes, incluyendo la referencia al evento (`event_id`) al que está inscrito.

```json
{
  "_id": "60d5ec49f1b2c86734211111",
  "nombre": "Ana García",
  "email": "ana.garcia@universidad.edu",
  "grado": "Ingeniería Informática",
  "event_id": "60d5ec49f1b2c86734222222"
}
```

### Ejemplo XML: Detalle de un Evento

**Endpoint:** `GET /api/events/60d5ec49f1b2c86734222222`

Para satisfacer el requisito de interoperabilidad, este endpoint devuelve los datos del evento en formato XML. Este XML es un mensaje ofrecido por nuestra API y tendrá un schema XSD asociado.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<event xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="event_schema.xsd">
  <id>60d5ec49f1b2c86734222222</id>
  <titulo>Congreso Internacional de Inteligencia Artificial</titulo>
  <descripcion>Un evento para explorar el futuro de la IA en la educación superior.</descripcion>
  <fecha>2026-05-15</fecha>
  <lugar>Madrid</lugar>
  <ids_ponentes>
    <ponente_id>60d5ec49f1b2c86734233333</ponente_id>
  </ids_ponentes>
  <ids_asistentes>
    <asistente_id>60d5ec49f1b2c86734211111</asistente_id>
  </ids_asistentes>
</event>
```

### Schema Asociado (`docs/event_schema.xsd`)

El XML anterior estará validado por un schema XSD. Este schema define los campos y tipos esperados para el mensaje XML de evento.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="event">
    <xs:complexType>
      <xs:sequence>
        <xs:element name="id" type="xs:string"/>
        <xs:element name="titulo" type="xs:string"/>
        <xs:element name="descripcion" type="xs:string"/>
        <xs:element name="fecha" type="xs:date"/>
        <xs:element name="lugar" type="xs:string"/>
        <xs:element name="ids_ponentes">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="ponente_id" type="xs:string" minOccurs="0" maxOccurs="unbounded"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
        <xs:element name="ids_asistentes">
          <xs:complexType>
            <xs:sequence>
              <xs:element name="asistente_id" type="xs:string" minOccurs="0" maxOccurs="unbounded"/>
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
</xs:schema>
```

### Ejemplo JSON: Evento con Datos Externos Integrados

```json
{
  "_id": "60d5ec49f1b2c86734222222",
  "titulo": "Congreso Internacional de Inteligencia Artificial",
  "descripcion": "Un evento para explorar el futuro de la IA en la educación superior.",
  "fecha": "2026-05-15",
  "lugar": "Madrid",
  "ids_ponentes": ["60d5ec49f1b2c86734233333"],
  "ids_asistentes": ["60d5ec49f1b2c86734211111"],
  "external_data": {
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
}
```

---

## 4. Diseño de la Integración con API Externa

Para cumplir con los requisitos de consumo de servicios externos, la API enriquecerá automáticamente los eventos académicos con coordenadas y clima.

La integración se realizará durante la creación de un evento (`POST /api/events`). También se podrá repetir durante la actualización (`PUT /api/events/{id}`) si cambia el campo `lugar`.

### 4.1. Consumo XML: Nominatim / OpenStreetMap

Nominatim se usará para obtener las coordenadas del lugar del evento.

Ejemplo conceptual:

```text
https://nominatim.openstreetmap.org/search?q=Madrid&format=xml&limit=1
```

Características:

- La respuesta externa se consumirá en XML mediante `format=xml`.
- Se extraerán los valores de latitud y longitud.
- La petición debe incluir un `User-Agent` identificable.

Ejemplo de cabecera:

```http
User-Agent: proyecto-sw2-eventos-academicos/1.0
```

Datos que se guardarán en MongoDB:

```json
{
  "coordinates": {
    "lat": 40.4168,
    "lon": -3.7038,
    "source": "nominatim"
  }
}
```

### 4.2. Consumo JSON: Open-Meteo

Open-Meteo se usará para obtener información meteorológica usando las coordenadas obtenidas previamente.

Ejemplo conceptual:

```text
https://api.open-meteo.com/v1/forecast?latitude=40.4168&longitude=-3.7038&current=temperature_2m,wind_speed_10m
```

Características:

- La respuesta externa se consumirá en JSON.
- No requiere API key.
- Se guardarán datos meteorológicos procesados, no toda la respuesta externa sin filtrar.

Datos que se guardarán en MongoDB:

```json
{
  "weather": {
    "temperature": 22,
    "wind_speed": 8,
    "source": "open-meteo"
  }
}
```

### 4.3. Persistencia en la Base de Datos

La información consumida desde Nominatim y Open-Meteo no se devolverá simplemente al cliente al vuelo. Se procesará, se integrará y se guardará dentro del documento del evento en MongoDB.

Estructura completa recomendada:

```json
{
  "_id": "60d5ec49f1b2c86734222222",
  "titulo": "Congreso Internacional de IA",
  "lugar": "Madrid",
  "external_data": {
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
}
```

### 4.4. Fallback si la API Externa Falla

La API debe seguir funcionando aunque Nominatim u Open-Meteo estén caídos.

Si ocurre un error al consumir servicios externos:

- El evento se crea igualmente.
- No se bloquea el CRUD principal.
- Se guarda un estado de indisponibilidad en `external_data`.

Ejemplo:

```json
{
  "_id": "60d5ec49f1b2c86734222222",
  "titulo": "Congreso Internacional de IA",
  "lugar": "Madrid",
  "external_data": {
    "available": false,
    "error": "External API unavailable"
  }
}
```

---

## 5. Consultas con Paginación y Filtros

La colección `attendees` será la colección grande del proyecto, con más de 1000 documentos.

El endpoint `GET /api/attendees` permitirá paginación:

```text
/api/attendees?page=1&limit=20
```

También permitirá filtrado:

```text
/api/attendees?grado=Ingenieria
/api/attendees?event_id=60d5ec49f1b2c86734222222
/api/attendees?page=2&limit=50&grado=Informatica
```

Ejemplo de respuesta paginada:

```json
{
  "page": 1,
  "limit": 20,
  "total": 1000,
  "totalPages": 50,
  "data": [
    {
      "_id": "60d5ec49f1b2c86734211111",
      "nombre": "Ana García",
      "email": "ana.garcia@universidad.edu",
      "grado": "Ingeniería Informática",
      "event_id": "60d5ec49f1b2c86734222222"
    }
  ]
}
```

---

## 6. Fuentes de las APIs Externas

- Nominatim Search API: https://nominatim.org/release-docs/latest/api/Search/
- Nominatim Output Formats: https://nominatim.org/release-docs/latest/api/Output/
- Open-Meteo Forecast API: https://open-meteo.com/en/docs
