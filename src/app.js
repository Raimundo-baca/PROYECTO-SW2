const express = require('express');
const cors = require('cors');

const attendeeRoutes = require('./routes/attendeeRoutes');
const eventRoutes = require('./routes/eventRoutes');
const speakerRoutes = require('./routes/speakerRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'API REST de Eventos Academicos',
    docs: '/api/health',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'proyecto-sw2-eventos-academicos',
  });
});

app.use('/api/attendees', attendeeRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/speakers', speakerRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
  });
});

module.exports = app;
