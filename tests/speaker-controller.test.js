const assert = require('assert');

const { createSpeakerController } = require('../src/controllers/speakerController');

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

const createSpeakerModel = () => {
  const speakers = [
    {
      _id: 'speaker-1',
      nombre: 'Ada Lovelace',
      email: 'ada@universidad.es',
      departamento: 'Informatica',
      especialidad: 'Bases de Datos',
    },
  ];

  function Speaker(payload) {
    Object.assign(this, payload);
  }

  Speaker.find = async () => speakers;
  Speaker.findById = async (id) => speakers.find((speaker) => speaker._id === id);
  Speaker.findByIdAndUpdate = async (id, payload) => {
    const speaker = speakers.find((item) => item._id === id);
    if (!speaker) return null;
    Object.assign(speaker, payload);
    return speaker;
  };
  Speaker.findByIdAndDelete = async (id) => {
    const index = speakers.findIndex((speaker) => speaker._id === id);
    if (index === -1) return null;
    const [deleted] = speakers.splice(index, 1);
    return deleted;
  };
  Speaker.prototype.save = async function save() {
    this._id = 'speaker-created';
    speakers.push(this);
    return this;
  };

  return Speaker;
};

async function run() {
  const Speaker = createSpeakerModel();
  const controller = createSpeakerController(Speaker);

  let res = createResponse();
  await controller.getSpeakers({}, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.length, 1);
  assert.strictEqual(res.body[0].nombre, 'Ada Lovelace');

  res = createResponse();
  await controller.getSpeakerById({ params: { id: 'speaker-1' } }, res);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.email, 'ada@universidad.es');

  res = createResponse();
  await controller.getSpeakerById({ params: { id: 'missing' } }, res);
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(res.body, { error: 'Ponente no encontrado' });

  res = createResponse();
  await controller.createSpeaker(
    {
      body: {
        nombre: 'Grace Hopper',
        email: 'grace@universidad.es',
        departamento: 'Informatica',
        especialidad: 'Compiladores',
      },
    },
    res,
  );
  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body._id, 'speaker-created');
  assert.strictEqual(res.body.nombre, 'Grace Hopper');

  res = createResponse();
  await controller.updateSpeaker(
    {
      params: { id: 'speaker-1' },
      body: { especialidad: 'Programacion' },
    },
    res,
  );
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.especialidad, 'Programacion');

  res = createResponse();
  await controller.updateSpeaker(
    {
      params: { id: 'missing' },
      body: { especialidad: 'Programacion' },
    },
    res,
  );
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(res.body, { error: 'Ponente no encontrado' });

  res = createResponse();
  await controller.deleteSpeaker({ params: { id: 'speaker-1' } }, res);
  assert.strictEqual(res.statusCode, 204);
  assert.strictEqual(res.sent, true);

  res = createResponse();
  await controller.deleteSpeaker({ params: { id: 'missing' } }, res);
  assert.strictEqual(res.statusCode, 404);
  assert.deepStrictEqual(res.body, { error: 'Ponente no encontrado' });
}

run()
  .then(() => {
    console.log('speaker-controller tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
