const assert = require('assert');

const { createAttendeeController } = require('../src/controllers/attendeeController');

const createResponse = () => {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    send() {
      this.sent = true;
      return this;
    },
  };

  return res;
};

const createAttendeeModel = () => {
  const attendees = [
    {
      _id: 'attendee-1',
      nombre: 'Grace Hopper',
      email: 'grace@universidad.es',
      grado: 'Ingenieria Informatica',
      event_id: 'event-1',
    },
  ];

  function Attendee(payload) {
    Object.assign(this, payload);
  }

  Attendee.find = async () => attendees;
  Attendee.findById = async (id) => attendees.find((attendee) => attendee._id === id);
  Attendee.findByIdAndUpdate = async (id, payload) => {
    const attendee = attendees.find((item) => item._id === id);
    if (!attendee) return null;
    Object.assign(attendee, payload);
    return attendee;
  };
  Attendee.findByIdAndDelete = async (id) => {
    const index = attendees.findIndex((attendee) => attendee._id === id);
    if (index === -1) return null;
    const [deleted] = attendees.splice(index, 1);
    return deleted;
  };
  Attendee.prototype.save = async function save() {
    this._id = 'attendee-created';
    attendees.push(this);
    return this;
  };

  return Attendee;
};

const createEventModel = () => {
  const events = [
    {
      _id: 'event-1',
      ids_asistentes: ['attendee-1'],
    },
    {
      _id: 'event-2',
      ids_asistentes: [],
    },
  ];

  const updates = [];

  return {
    updates,
    findById: async (id) => events.find((event) => event._id === id),
    findByIdAndUpdate: async (id, update) => {
      updates.push({ id, update });
      const event = events.find((item) => item._id === id);
      if (!event) return null;

      if (update.$addToSet?.ids_asistentes && !event.ids_asistentes.includes(update.$addToSet.ids_asistentes)) {
        event.ids_asistentes.push(update.$addToSet.ids_asistentes);
      }

      if (update.$pull?.ids_asistentes) {
        event.ids_asistentes = event.ids_asistentes.filter((attendeeId) => attendeeId !== update.$pull.ids_asistentes);
      }

      return event;
    },
  };
};

async function run() {
  const Attendee = createAttendeeModel();
  const Event = createEventModel();
  const controller = createAttendeeController(Attendee, Event);

  let res = createResponse();
  await controller.getAttendees({}, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.length, 1);
  assert.strictEqual(res.body[0].nombre, 'Grace Hopper');

  res = createResponse();
  await controller.getAttendeeById({ params: { id: 'attendee-1' } }, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.event_id, 'event-1');

  res = createResponse();
  await controller.getAttendeeById({ params: { id: 'missing' } }, res);
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(res.body, { error: 'Asistente no encontrado' });

  res = createResponse();
  await controller.createAttendee(
    {
      body: {
        nombre: 'Katherine Johnson',
        email: 'katherine@universidad.es',
        grado: 'Ciencia de Datos',
        event_id: 'event-2',
      },
    },
    res,
  );
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body._id, 'attendee-created');
  assert.deepStrictEqual(Event.updates.at(-1), {
    id: 'event-2',
    update: { $addToSet: { ids_asistentes: 'attendee-created' } },
  });

  res = createResponse();
  await controller.createAttendee(
    {
      body: {
        nombre: 'Evento incorrecto',
        email: 'sin-evento@universidad.es',
        grado: 'Ingenieria',
        event_id: 'missing-event',
      },
    },
    res,
  );
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.body, { error: 'Evento no encontrado' });

  res = createResponse();
  await controller.updateAttendee(
    {
      params: { id: 'attendee-1' },
      body: { grado: 'Ingenieria del Software', event_id: 'event-2' },
    },
    res,
  );
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.grado, 'Ingenieria del Software');
  assert.strictEqual(res.body.event_id, 'event-2');
  assert.deepStrictEqual(Event.updates.at(-2), {
    id: 'event-1',
    update: { $pull: { ids_asistentes: 'attendee-1' } },
  });
  assert.deepStrictEqual(Event.updates.at(-1), {
    id: 'event-2',
    update: { $addToSet: { ids_asistentes: 'attendee-1' } },
  });

  res = createResponse();
  await controller.updateAttendee(
    {
      params: { id: 'missing' },
      body: { grado: 'Ingenieria' },
    },
    res,
  );
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(res.body, { error: 'Asistente no encontrado' });

  res = createResponse();
  await controller.deleteAttendee({ params: { id: 'attendee-1' } }, res);
  assert.strictEqual(res.statusCode, 204);
  assert.strictEqual(res.sent, true);
  assert.deepStrictEqual(Event.updates.at(-1), {
    id: 'event-2',
    update: { $pull: { ids_asistentes: 'attendee-1' } },
  });

  res = createResponse();
  await controller.deleteAttendee({ params: { id: 'missing' } }, res);
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(res.body, { error: 'Asistente no encontrado' });
}

run()
  .then(() => {
    console.log('attendee-controller tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
