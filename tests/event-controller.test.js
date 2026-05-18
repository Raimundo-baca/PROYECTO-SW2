const assert = require('assert');

const { createEventController } = require('../src/controllers/eventController');

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

const createQuery = (value) => ({
  populatePath: undefined,
  populate(path) {
    this.populatePath = path;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        item.populatedPath = path;
      });
    } else if (value) {
      value.populatedPath = path;
    }
    return this;
  },
  then(resolve, reject) {
    return Promise.resolve(value).then(resolve, reject);
  },
});

const createEventModel = () => {
  const events = [
    {
      _id: 'event-1',
      titulo: 'Seminario de datos',
      descripcion: 'Evento academico',
      fecha: '2026-06-01',
      lugar: 'Campus de Mostoles',
      ids_ponentes: ['speaker-1'],
      ids_asistentes: [],
      external_data: { available: false },
      populate(path) {
        this.populatedPath = path;
        return Promise.resolve(this);
      },
    },
  ];

  function Event(payload) {
    Object.assign(this, payload);
  }

  Event.find = () => createQuery(events);
  Event.findById = (id) => createQuery(events.find((event) => event._id === id));
  Event.findByIdAndUpdate = async (id, payload) => {
    const event = events.find((item) => item._id === id);
    if (!event) return null;
    Object.assign(event, payload);
    return event;
  };
  Event.findByIdAndDelete = async (id) => {
    const index = events.findIndex((event) => event._id === id);
    if (index === -1) return null;
    const [deleted] = events.splice(index, 1);
    return deleted;
  };
  Event.prototype.save = async function save() {
    this._id = 'event-created';
    events.push(this);
    return this;
  };

  return Event;
};

const createSpeakerModel = () => ({
  countDocuments: async (query) => {
    const knownSpeakers = new Set(['speaker-1', 'speaker-2']);
    return query._id.$in.filter((id) => knownSpeakers.has(id)).length;
  },
});

async function run() {
  const Event = createEventModel();
  const Speaker = createSpeakerModel();
  const externalDataService = {
    calls: [],
    async getExternalDataForLocation(location) {
      this.calls.push(location);
      return {
        available: true,
        coordinates: {
          lat: 40.4168,
          lon: -3.7038,
          source: 'nominatim',
        },
        weather: {
          temperature: 22,
          wind_speed: 8,
          source: 'open-meteo',
        },
      };
    },
  };
  const controller = createEventController(Event, Speaker, externalDataService);

  let res = createResponse();
  await controller.getEvents({}, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.length, 1);
  assert.strictEqual(res.body[0].titulo, 'Seminario de datos');

  res = createResponse();
  await controller.getEventById({ params: { id: 'event-1' } }, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.lugar, 'Campus de Mostoles');
  assert.strictEqual(res.body.populatedPath, 'ids_ponentes');

  res = createResponse();
  await controller.getEventById({ params: { id: 'missing' } }, res);
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(res.body, { error: 'Evento no encontrado' });

  res = createResponse();
  await controller.createEvent(
    {
      body: {
        titulo: 'Congreso de IA',
        descripcion: 'Evento academico sobre IA',
        fecha: '2026-09-20',
        lugar: 'Madrid',
        ids_ponentes: ['speaker-1', 'speaker-2'],
      },
    },
    res,
  );
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body._id, 'event-created');
  assert.deepStrictEqual(res.body.external_data, {
    available: true,
    coordinates: {
      lat: 40.4168,
      lon: -3.7038,
      source: 'nominatim',
    },
    weather: {
      temperature: 22,
      wind_speed: 8,
      source: 'open-meteo',
    },
  });
  assert.deepStrictEqual(externalDataService.calls, ['Madrid']);

  res = createResponse();
  await controller.createEvent(
    {
      body: {
        titulo: 'Evento invalido',
        fecha: '2026-09-20',
        lugar: 'Madrid',
        ids_ponentes: ['speaker-unknown'],
      },
    },
    res,
  );
  assert.strictEqual(res.statusCode, 400);
  assert.deepStrictEqual(res.body, { error: 'Algunos ponentes no existen' });

  res = createResponse();
  await controller.updateEvent(
    {
      params: { id: 'event-1' },
      body: { lugar: 'Campus de Monteprincipe', ids_ponentes: ['speaker-2'] },
    },
    res,
  );
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.lugar, 'Campus de Monteprincipe');
  assert.deepStrictEqual(res.body.ids_ponentes, ['speaker-2']);
  assert.deepStrictEqual(res.body.external_data, {
    available: true,
    coordinates: {
      lat: 40.4168,
      lon: -3.7038,
      source: 'nominatim',
    },
    weather: {
      temperature: 22,
      wind_speed: 8,
      source: 'open-meteo',
    },
  });
  assert.deepStrictEqual(externalDataService.calls, ['Madrid', 'Campus de Monteprincipe']);

  res = createResponse();
  await controller.updateEvent(
    {
      params: { id: 'missing' },
      body: { lugar: 'Madrid' },
    },
    res,
  );
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(res.body, { error: 'Evento no encontrado' });

  res = createResponse();
  await controller.deleteEvent({ params: { id: 'event-1' } }, res);
  assert.strictEqual(res.statusCode, 204);
  assert.strictEqual(res.sent, true);

  res = createResponse();
  await controller.deleteEvent({ params: { id: 'missing' } }, res);
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(res.body, { error: 'Evento no encontrado' });
}

run()
  .then(() => {
    console.log('event-controller tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
