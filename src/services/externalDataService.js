const { XMLParser } = require('fast-xml-parser');

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_USER_AGENT = 'proyecto-sw2-eventos-academicos/1.0';
const EXTERNAL_API_ERROR = 'External API unavailable';

const createExternalDataService = ({
  fetchImpl = global.fetch,
  userAgent = process.env.NOMINATIM_USER_AGENT || DEFAULT_USER_AGENT,
} = {}) => {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });

  const geocodeLocation = async (location) => {
    if (!fetchImpl) {
      throw new Error('fetch is not available');
    }

    const url = new URL(NOMINATIM_SEARCH_URL);
    url.searchParams.set('q', location);
    url.searchParams.set('format', 'xml');
    url.searchParams.set('limit', '1');

    const response = await fetchImpl(url.toString(), {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim responded with ${response.status}`);
    }

    const xml = await response.text();
    const parsedXml = parser.parse(xml);
    const place = Array.isArray(parsedXml?.searchresults?.place)
      ? parsedXml.searchresults.place[0]
      : parsedXml?.searchresults?.place;

    const lat = Number(place?.lat);
    const lon = Number(place?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new Error('Nominatim did not return coordinates');
    }

    return {
      lat,
      lon,
      source: 'nominatim',
    };
  };

  const fetchWeather = async ({ lat, lon }) => {
    if (!fetchImpl) {
      throw new Error('fetch is not available');
    }

    const url = new URL(OPEN_METEO_FORECAST_URL);
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('current', 'temperature_2m,wind_speed_10m');

    const response = await fetchImpl(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo responded with ${response.status}`);
    }

    const body = await response.json();
    const current = body.current || body.current_weather || {};

    return {
      temperature: current.temperature_2m ?? current.temperature,
      wind_speed: current.wind_speed_10m ?? current.windspeed,
      source: 'open-meteo',
    };
  };

  const getExternalDataForLocation = async (location) => {
    try {
      const coordinates = await geocodeLocation(location);
      const weather = await fetchWeather(coordinates);

      return {
        available: true,
        coordinates,
        weather,
      };
    } catch (error) {
      return {
        available: false,
        error: EXTERNAL_API_ERROR,
      };
    }
  };

  return {
    geocodeLocation,
    fetchWeather,
    getExternalDataForLocation,
  };
};

module.exports = {
  ...createExternalDataService(),
  createExternalDataService,
};
