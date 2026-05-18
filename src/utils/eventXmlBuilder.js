const { create } = require('xmlbuilder2');

const idToString = (value) => {
  if (!value) {
    return '';
  }

  if (value._id) {
    return String(value._id);
  }

  return String(value);
};

const formatDate = (value) => {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
};

const buildEventXml = (event) => {
  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('event', {
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:noNamespaceSchemaLocation': 'event_schema.xsd',
    });

  root.ele('id').txt(idToString(event._id)).up();
  root.ele('titulo').txt(event.titulo || '').up();
  root.ele('descripcion').txt(event.descripcion || '').up();
  root.ele('fecha').txt(formatDate(event.fecha)).up();
  root.ele('lugar').txt(event.lugar || '').up();

  const speakerIds = root.ele('ids_ponentes');
  (event.ids_ponentes || []).forEach((speakerId) => {
    speakerIds.ele('ponente_id').txt(idToString(speakerId)).up();
  });
  speakerIds.up();

  const attendeeIds = root.ele('ids_asistentes');
  (event.ids_asistentes || []).forEach((attendeeId) => {
    attendeeIds.ele('asistente_id').txt(idToString(attendeeId)).up();
  });
  attendeeIds.up();

  return root.end({ prettyPrint: true });
};

module.exports = {
  buildEventXml,
};
