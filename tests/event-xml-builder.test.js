const assert = require('assert');

const { buildEventXml } = require('../src/utils/eventXmlBuilder');

const xml = buildEventXml({
  _id: 'event-1',
  titulo: 'Congreso Internacional de Inteligencia Artificial',
  descripcion: 'Evento academico sobre IA.',
  fecha: '2026-05-15T00:00:00.000Z',
  lugar: 'Madrid',
  ids_ponentes: ['speaker-1', { _id: 'speaker-2' }],
  ids_asistentes: ['attendee-1', { _id: 'attendee-2' }],
});

assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
assert.ok(xml.includes('<event xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="event_schema.xsd">'));
assert.ok(xml.includes('<id>event-1</id>'));
assert.ok(xml.includes('<titulo>Congreso Internacional de Inteligencia Artificial</titulo>'));
assert.ok(xml.includes('<fecha>2026-05-15</fecha>'));
assert.ok(xml.includes('<ponente_id>speaker-1</ponente_id>'));
assert.ok(xml.includes('<ponente_id>speaker-2</ponente_id>'));
assert.ok(xml.includes('<asistente_id>attendee-1</asistente_id>'));
assert.ok(xml.includes('<asistente_id>attendee-2</asistente_id>'));

console.log('event-xml-builder tests passed');
