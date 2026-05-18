const assert = require('assert');

const { createExternalDataService } = require('../src/services/externalDataService');

async function testBuildsExternalDataFromNominatimXmlAndOpenMeteoJson() {
  const requestedUrls = [];
  const requestedHeaders = [];

  const fetchImpl = async (url, options = {}) => {
    requestedUrls.push(url);
    requestedHeaders.push(options.headers || {});

    if (url.startsWith('https://nominatim.openstreetmap.org/search')) {
      return {
        ok: true,
        text: async () =>
          '<searchresults><place lat="40.4168" lon="-3.7038" display_name="Madrid, Comunidad de Madrid, España"/></searchresults>',
      };
    }

    if (url.startsWith('https://api.open-meteo.com/v1/forecast')) {
      return {
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 22,
            wind_speed_10m: 8,
          },
        }),
      };
    }

    throw new Error(`Unexpected URL: ${url}`);
  };

  const service = createExternalDataService({
    fetchImpl,
    userAgent: 'proyecto-sw2-test/1.0',
  });

  const externalData = await service.getExternalDataForLocation('Madrid');

  assert.deepStrictEqual(externalData, {
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
  assert.ok(requestedUrls[0].includes('format=xml'));
  assert.ok(requestedUrls[0].includes('q=Madrid'));
  assert.ok(requestedUrls[1].includes('latitude=40.4168'));
  assert.ok(requestedUrls[1].includes('longitude=-3.7038'));
  assert.strictEqual(requestedHeaders[0]['User-Agent'], 'proyecto-sw2-test/1.0');
}

async function testReturnsFallbackWhenExternalApiFails() {
  const service = createExternalDataService({
    fetchImpl: async () => {
      throw new Error('network unavailable');
    },
    userAgent: 'proyecto-sw2-test/1.0',
  });

  const externalData = await service.getExternalDataForLocation('Madrid');

  assert.deepStrictEqual(externalData, {
    available: false,
    error: 'External API unavailable',
  });
}

async function run() {
  await testBuildsExternalDataFromNominatimXmlAndOpenMeteoJson();
  await testReturnsFallbackWhenExternalApiFails();
}

run()
  .then(() => {
    console.log('external-data-service tests passed');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
