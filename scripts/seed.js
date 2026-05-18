require('dotenv').config({ quiet: true });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const Event = require('../src/models/Event');
const Speaker = require('../src/models/Speaker');
const Attendee = require('../src/models/Attendee');

const datasetDir = path.join(__dirname, '..', 'dataset');

const readJsonFile = (fileName) => {
  const filePath = path.join(datasetDir, fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const createIdMap = (records) => {
  const idMap = new Map();

  for (const record of records) {
    idMap.set(record.id, new mongoose.Types.ObjectId());
  }

  return idMap;
};

const buildAttendeeAssignments = ({ attendees, events, eventIdMap }) => {
  const assignmentByAttendeeId = new Map();

  for (const event of events) {
    const eventObjectId = eventIdMap.get(event.id);

    for (const attendeeId of event.ids_asistentes || []) {
      if (!assignmentByAttendeeId.has(attendeeId)) {
        assignmentByAttendeeId.set(attendeeId, eventObjectId);
      }
    }
  }

  attendees.forEach((attendee, index) => {
    if (!assignmentByAttendeeId.has(attendee.id)) {
      const fallbackEvent = events[index % events.length];
      assignmentByAttendeeId.set(attendee.id, eventIdMap.get(fallbackEvent.id));
    }
  });

  return assignmentByAttendeeId;
};

const buildSeedDocuments = ({ speakers, events, attendees }) => {
  if (!events.length) {
    throw new Error('El dataset debe incluir al menos un evento');
  }

  const speakerIdMap = createIdMap(speakers);
  const eventIdMap = createIdMap(events);
  const attendeeIdMap = createIdMap(attendees);
  const attendeeAssignments = buildAttendeeAssignments({ attendees, events, eventIdMap });

  const speakerDocs = speakers.map((speaker) => ({
    _id: speakerIdMap.get(speaker.id),
    nombre: speaker.nombre,
    email: speaker.email,
    departamento: speaker.departamento,
    especialidad: speaker.especialidad,
  }));

  const attendeeDocs = attendees.map((attendee) => ({
    _id: attendeeIdMap.get(attendee.id),
    nombre: attendee.nombre,
    email: attendee.email,
    grado: attendee.grado,
    event_id: attendeeAssignments.get(attendee.id),
  }));

  const attendeeIdsByEventId = new Map(events.map((event) => [String(eventIdMap.get(event.id)), []]));

  for (const attendee of attendeeDocs) {
    attendeeIdsByEventId.get(String(attendee.event_id)).push(attendee._id);
  }

  const eventDocs = events.map((event) => ({
    _id: eventIdMap.get(event.id),
    titulo: event.titulo,
    descripcion: event.descripcion,
    fecha: event.fecha,
    lugar: event.lugar,
    ids_ponentes: (event.ids_ponentes || [])
      .map((speakerId) => speakerIdMap.get(speakerId))
      .filter(Boolean),
    ids_asistentes: attendeeIdsByEventId.get(String(eventIdMap.get(event.id))) || [],
    external_data: { available: false },
  }));

  return {
    speakerDocs,
    eventDocs,
    attendeeDocs,
  };
};

const loadDataset = () => ({
  speakers: readJsonFile('ponentes.json'),
  events: readJsonFile('eventos.json'),
  attendees: readJsonFile('asistentes.json'),
});

const runSeed = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI no esta definida en las variables de entorno');
  }

  const dataset = loadDataset();
  const { speakerDocs, eventDocs, attendeeDocs } = buildSeedDocuments(dataset);

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  await Promise.all([Event.deleteMany({}), Speaker.deleteMany({}), Attendee.deleteMany({})]);

  await Speaker.insertMany(speakerDocs);
  await Event.insertMany(eventDocs);
  await Attendee.insertMany(attendeeDocs);

  console.log('Dataset cargado correctamente en MongoDB');
  console.log(`Coleccion speakers: ${speakerDocs.length} documentos`);
  console.log(`Coleccion events: ${eventDocs.length} documentos`);
  console.log(`Coleccion attendees: ${attendeeDocs.length} documentos`);
};

if (require.main === module) {
  runSeed()
    .catch((error) => {
      console.error('Error cargando dataset:', error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.connection.close();
    });
}

module.exports = {
  buildSeedDocuments,
  loadDataset,
  runSeed,
};
