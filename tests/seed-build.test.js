const assert = require('assert');
const mongoose = require('mongoose');

const { buildSeedDocuments, loadDataset, validateDataset } = require('../scripts/seed');

const speakers = [
  {
    id: 1,
    nombre: 'Ada Lovelace',
    email: 'ada@universidad.es',
    departamento: 'Departamento de Informatica',
    especialidad: 'Bases de Datos',
  },
];

const events = [
  {
    id: 10,
    titulo: 'Seminario de datos',
    descripcion: 'Evento academico',
    fecha: '2026-06-01',
    lugar: 'Campus de Mostoles',
    ids_ponentes: [1],
    ids_asistentes: [100, 101],
  },
  {
    id: 20,
    titulo: 'Taller web',
    descripcion: 'Evento academico',
    fecha: '2026-07-01',
    lugar: 'Campus de Fuenlabrada',
    ids_ponentes: [1],
    ids_asistentes: [101],
  },
];

const attendees = [
  {
    id: 100,
    nombre: 'Grace Hopper',
    email: 'grace@universidad.es',
    grado: 'Ingenieria Informatica',
  },
  {
    id: 101,
    nombre: 'Katherine Johnson',
    email: 'katherine@universidad.es',
    grado: 'Ciencia de Datos',
  },
  {
    id: 102,
    nombre: 'Hedy Lamarr',
    email: 'hedy@universidad.es',
    grado: 'Ingenieria del Software',
  },
];

const { speakerDocs, eventDocs, attendeeDocs } = buildSeedDocuments({
  speakers,
  events,
  attendees,
});

assert.strictEqual(speakerDocs.length, 1);
assert.strictEqual(eventDocs.length, 2);
assert.strictEqual(attendeeDocs.length, 3);

assert.ok(speakerDocs[0]._id instanceof mongoose.Types.ObjectId);
assert.ok(eventDocs[0]._id instanceof mongoose.Types.ObjectId);
assert.ok(attendeeDocs[0]._id instanceof mongoose.Types.ObjectId);

assert.strictEqual(eventDocs[0].ids_ponentes.length, 1);
assert.ok(eventDocs[0].ids_ponentes[0].equals(speakerDocs[0]._id));

for (const attendee of attendeeDocs) {
  assert.ok(attendee.event_id instanceof mongoose.Types.ObjectId);
}

const attendee100 = attendeeDocs.find((attendee) => attendee.email === 'grace@universidad.es');
const attendee101 = attendeeDocs.find((attendee) => attendee.email === 'katherine@universidad.es');
const attendee102 = attendeeDocs.find((attendee) => attendee.email === 'hedy@universidad.es');

assert.ok(attendee100.event_id.equals(eventDocs[0]._id));
assert.ok(attendee101.event_id.equals(eventDocs[0]._id));
assert.ok(attendee102.event_id.equals(eventDocs[0]._id));

assert.strictEqual(eventDocs[0].ids_asistentes.length, 3);
assert.strictEqual(eventDocs[1].ids_asistentes.length, 0);
assert.ok(eventDocs[0].ids_asistentes.some((id) => id.equals(attendee101._id)));
assert.ok(!eventDocs[1].ids_asistentes.some((id) => id.equals(attendee101._id)));

assert.deepStrictEqual(eventDocs[0].external_data, { available: false });

const realDataset = loadDataset();

assert.throws(
  () => validateDataset({ speakers, events, attendees: attendees.slice(0, 1) }),
  /mas de 1000 asistentes/,
);

validateDataset(realDataset);

assert.ok(realDataset.attendees.length > 1000);
assert.ok(realDataset.speakers.length > 0);
assert.ok(realDataset.events.length > 0);
assert.ok(new Set(realDataset.attendees.map((attendee) => attendee.grado)).size > 1);
assert.ok(realDataset.events.some((event) => (event.ids_ponentes || []).length > 0));

console.log('seed-build tests passed');
