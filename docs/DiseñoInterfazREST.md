# Diseño de la Interfaz REST: Gestión de Eventos Académicos

En este documento se detalla la interfaz REST diseñada para la plataforma de gestión de eventos académicos universitarios. La API está estructurada en torno a tres recursos principales relacionados entre sí: **Eventos**, **Ponentes** y **Asistentes**.

## 1. Listado de Endpoints

### Recurso: Eventos (`/events`)
Este recurso gestiona la información principal de los actos académicos (conferencias, congresos, talleres).

| Método | Endpoint | Descripción | Formato |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/events` | Obtener un listado de todos los eventos. | JSON |
| **GET** | `/api/events/{id}` | Obtener el detalle de un evento específico. | **XML** (Con Schema asociado) |
| **POST** | `/api/events` | Crear un nuevo evento académico. | JSON |
| **PUT** | `/api/events/{id}` | Actualizar los datos de un evento existente. | JSON |
| **DELETE** | `/api/events/{id}` | Eliminar un evento del sistema. | N/A |
| **GET** | `/api/events/{id}/weather`| Consultar el clima en la ubicación del evento mediante una **API Externa**. | JSON / XML |

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
Gestiona las inscripciones a los eventos. *Nota: Esta colección albergará el dataset principal con más de 1000 documentos.*

| Método | Endpoint | Descripción | Formato |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/attendees` | Listar asistentes. **Incluye paginación y filtros**. | JSON |
| **GET** | `/api/attendees/{id}` | Obtener los datos de inscripción de un asistente. | JSON |
| **POST** | `/api/attendees` | Registrar un nuevo asistente a un evento. | JSON |
| **PUT** | `/api/attendees/{id}` | Modificar los datos de un asistente registrado. | JSON |
| **DELETE** | `/api/attendees/{id}` | Cancelar la inscripción de un asistente. | N/A |

---

## 2. Justificación del Diseño y Requisitos Cumplidos

Para dar cumplimiento a los requisitos técnicos del proyecto, el diseño presenta las siguientes características:

* **Relaciones entre recursos (MongoDB):**
    * Cada **Evento** está vinculado a un **Ponente** a través de su identificador (`speaker_id`).
    * Cada **Asistente** está vinculado al **Evento** al que asiste a través del identificador del evento (`event_id`).
* **Paginación y Filtrado (Dataset masivo):**
    * El endpoint `GET /api/attendees` está diseñado para manejar eficientemente la colección de más de 1000 registros. Aceptará parámetros de consulta (query parameters) para paginación (ej. `?page=1&limit=20`) y para filtrado (ej. `?university=UCM` o `?event_id=123`).
* **Formato XML y Schema:**
    * El endpoint `GET /api/events/{id}` está explícitamente diseñado para devolver la información estructurada en formato **XML**. Dicho XML estará estrictamente respaldado y validado por un archivo `.xsd` (XML Schema Definition).

---

## 3. Ejemplos de Mensajes

A continuación se muestran ejemplos representativos de las respuestas de nuestra API, cubriendo los formatos JSON y XML exigidos.

### Ejemplo JSON: Detalle de un Asistente
**Endpoint:** `GET /api/attendees/60d5ec49f1b2c86734211111`

Este mensaje devuelve la información de un documento de la colección de asistentes, incluyendo la referencia al evento (`event_id`) al que está inscrito.

```json
{
  "_id": "60d5ec49f1b2c86734211111",
  "first_name": "Ana",
  "last_name": "García",
  "email": "ana.garcia@universidad.edu",
  "university": "Universidad Complutense de Madrid",
  "event_id": "60d5ec49f1b2c86734222222",
  "registration_date": "2026-04-05T10:30:00Z"
}
```

### Ejemplo JSON: Detalle de un evento
**Endpoint:** `GET /api/events/60d5ec49f1b2c86734222222`

Para satisfacer el requisito de interoperabilidad, este endpoint devuelve los datos del evento en formato XML, referenciando a su vez el ID del ponente asignado (speaker_id).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<event xmlns:xsi="[http://www.w3.org/2001/XMLSchema-instance](http://www.w3.org/2001/XMLSchema-instance)" xsi:noNamespaceSchemaLocation="event_schema.xsd">
    <id>60d5ec49f1b2c86734222222</id>
    <title>Congreso Internacional de Inteligencia Artificial</title>
    <date>2026-05-15</date>
    <location>Madrid</location>
    <speaker_id>60d5ec49f1b2c86734233333</speaker_id>
    <description>Un evento para explorar el futuro de la IA en la educación superior.</description>
</event>
```

### Schema Asociado (event_schema.xsd)

El XML anterior está estrictamente validado por el siguiente esquema, el cual asegura que los tipos de datos (como la fecha) sean correctos:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="[http://www.w3.org/2001/XMLSchema](http://www.w3.org/2001/XMLSchema)">
    <xs:element name="event">
        <xs:complexType>
            <xs:sequence>
                <xs:element name="id" type="xs:string"/>
                <xs:element name="title" type="xs:string"/>
                <xs:element name="date" type="xs:date"/>
                <xs:element name="location" type="xs:string"/>
                <xs:element name="speaker_id" type="xs:string"/>
                <xs:element name="description" type="xs:string"/>
            </xs:sequence>
        </xs:complexType>
    </xs:element>
</xs:schema>
```

## 4. Diseño de la Integración con API Externa

Para cumplir con los requisitos de consumo de servicios de terceros, nuestra API interactuará con servicios externos (por ejemplo, **OpenWeatherMap** o **Geocode**) para enriquecer automáticamente la información de los eventos académicos.

### 4.1. Lógica de Integración

El sistema consumirá datos externos en los dos formatos requeridos por el enunciado durante la creación de un evento (`POST /api/events`):

* **Consumo de mensaje en JSON:** Al recibir la ciudad donde se celebrará el evento (`location`), el servidor hará una petición a una API de geolocalización que responderá en formato JSON para obtener las coordenadas exactas (latitud y longitud).
* **Consumo de segundo mensaje en JSON:** Con esas coordenadas, el servidor hará una segunda petición a la API meteorológica para obtener un pronóstico o el estado climático general de la zona.

### 4.2. Persistencia en la Base de Datos

Toda la información consumida **no** será simplemente devuelta al cliente al vuelo, sino que será procesada, integrada y **guardada en la base de datos MongoDB**. 

El esquema del documento del evento en la base de datos se actualizará automáticamente para incluir estos datos externos:
```json
{
  "_id": "60d5ec...",
  "title": "Congreso Internacional de IA",
  "location": "Madrid",
  "external_data": {
     "coordinates": {"lat": 40.4165, "lon": -3.7026}, 
     "weather_forecast": "Clear" 
  }
}