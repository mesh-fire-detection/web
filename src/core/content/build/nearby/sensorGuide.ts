import type { NearbySensorGuideContent } from '@core/content/types'

/**
 * Field guide shown under the sensor tiles. Ranges are rules of thumb for reading
 * a node in the field, not alert thresholds: the page never declares a fire.
 * Row values may mark spans as `{good|…}`, `{fair|…}` or `{bad|…}`; they render
 * green, yellow and red.
 */
export const sensorGuideContent = {
    entries: {
        'environmentMetrics.temperature': {
            title: 'Temperature',
            summary:
                'Air temperature at the node. Sun on the enclosure can read several degrees above shade air, so compare nodes in similar spots rather than with a weather station.',
            rows: [
                {
                    term: 'Sensor range',
                    value: 'BME680: {good|−40 to 85 °C}. Values {bad|outside it} are not trustworthy.',
                },
                {
                    term: 'Fire weather',
                    value: 'Danger climbs {bad|above about 30 °C}, especially with {bad|humidity under 30 %} and strong wind — the “30-30-30” rule of thumb.',
                },
                {
                    term: 'Possible fire',
                    value: 'A {bad|jump of 10 °C or more within minutes} that nearby nodes do not share means local heat: a fire, or direct sun on the case. Check the particle readings next.',
                },
            ],
        },
        'environmentMetrics.relativeHumidity': {
            title: 'Relative humidity',
            summary:
                'How close the air is to saturation. Dry air dries out dead grass and twigs within hours, and dry fuel is what lets a fire start and spread.',
            rows: [
                { term: 'Sensor range', value: 'BME680: 0–100 %, typically within ±3 %.' },
                {
                    term: 'Fire weather',
                    value: '{fair|Under 30 %} fuel ignites easily; {bad|under 15 %} is extreme. {good|Above 60 %} fires rarely spread.',
                },
                {
                    term: 'Watch for',
                    value: 'Humidity that {bad|does not recover overnight}, staying under 40 %, means the next afternoon starts dry.',
                },
            ],
        },
        'environmentMetrics.barometricPressure': {
            title: 'Pressure',
            summary:
                'Station pressure at the node’s altitude, not corrected to sea level: expect about 12 hPa less for every 100 m of elevation.',
            rows: [
                {
                    term: 'For people',
                    value: 'About {good|1013 hPa} at sea level. People notice little until {bad|roughly 700 hPa} (about 3000 m), where thin air brings altitude sickness.',
                },
                {
                    term: 'Falling fast',
                    value: 'A {bad|drop of more than 3 hPa in 3 hours} signals an approaching front: wind shifts and gusts that push a fire in new directions.',
                },
                {
                    term: 'High and steady',
                    value: 'Dry, stable air. It can {fair|hold smoke close to the ground} for days and keep fuels drying.',
                },
            ],
        },
        'environmentMetrics.gasResistance': {
            title: 'Gas resistance',
            summary:
                'Resistance of the BME680’s heated metal-oxide layer. Smoke and other volatile gases lower it; cleaner air raises it.',
            rows: [
                {
                    term: 'Units',
                    value: 'kΩ. Absolute values differ from sensor to sensor, so compare a node with its own history, not with other nodes.',
                },
                {
                    term: 'Typical',
                    value: '{good|Tens to hundreds of kΩ} outdoors. Humidity lowers it too, so read it alongside humidity.',
                },
                {
                    term: 'Possible smoke',
                    value: 'A {bad|sharp fall} from the node’s usual level together with {bad|rising PM2.5} points to smoke.',
                },
            ],
        },
        'environmentMetrics.iaq': {
            title: 'Air quality index (IAQ)',
            summary:
                'Bosch’s air quality index from 0 to 500, calculated on the node by the BSEC library from gas resistance, humidity and temperature.',
            rows: [
                {
                    term: 'Scale',
                    value: '{good|0–50 good}, {good|51–100 average}, {fair|101–150 slightly bad}, {fair|151–200 bad}, {bad|201–300 worse}, {bad|301–500 very bad}.',
                },
                {
                    term: 'Calibration',
                    value: 'BSEC rates its own calibration from 0 (just started) to 3 (calibrated), but Meshtastic does not send that rating. After power-up the index sits {fair|near 50} until calibrated, which can take hours.',
                },
                {
                    term: 'Outdoors',
                    value: 'Designed for indoor air. Treat it as a relative signal for this node, not a health measure.',
                },
            ],
        },
        'airQualityMetrics.pm10Environmental': {
            title: 'PM1.0',
            summary:
                'Particles smaller than 1 µm. Wildfire smoke is mostly this fine, so PM1.0 and PM2.5 rise together in smoke.',
            rows: [
                { term: 'Clean air', value: 'Usually {good|under 10 µg/m³} outdoors.' },
                {
                    term: 'Possible smoke',
                    value: 'A rise from background to {bad|several tens of µg/m³ within an hour}, while humidity is not near 100 % (fog scatters light too).',
                },
                {
                    term: 'For people',
                    value: 'There is no separate health standard; follow the PM2.5 scale.',
                },
            ],
        },
        'airQualityMetrics.pm25Environmental': {
            title: 'PM2.5',
            summary:
                'Particles smaller than 2.5 µm — the main health measure for wildfire smoke, because they reach deep into the lungs.',
            rows: [
                {
                    term: 'US EPA, 24 h',
                    value: '{good|0–9 good}, {fair|9.1–35.4 moderate}, {fair|35.5–55.4 unhealthy for sensitive groups}, {bad|55.5–125.4 unhealthy}, {bad|125.5–225.4 very unhealthy}, {bad|above that hazardous} (µg/m³).',
                },
                {
                    term: 'Possible smoke',
                    value: '{bad|Above 35 µg/m³} without fog or dust is a likely smoke sign. Close to a fire, values {bad|reach hundreds}.',
                },
                {
                    term: 'Sensor',
                    value: 'PMSA003I counts particles by laser scattering. Humidity {fair|above about 85 %} inflates readings.',
                },
            ],
        },
        'airQualityMetrics.pm100Environmental': {
            title: 'PM10',
            summary: 'Particles smaller than 10 µm: dust and pollen as well as smoke.',
            rows: [
                {
                    term: 'US EPA, 24 h',
                    value: '{good|0–54 good}, {fair|55–154 moderate}, {fair|155–254 unhealthy for sensitive groups}, {bad|255–354 unhealthy}, {bad|355–424 very unhealthy}, {bad|425 and above hazardous} (µg/m³).',
                },
                {
                    term: 'Dust or smoke',
                    value: '{fair|PM10 high while PM2.5 stays low} means coarse dust from roads or wind, not smoke.',
                },
                {
                    term: 'Values shown',
                    value: 'Plantower “atmospheric environment” values, meant for outdoor air. The factory “standard” values are under More details.',
                },
            ],
        },
    },
    unknown: {
        title: 'Other reading',
        summary: 'This metric has no description yet. It is shown under its protocol field name.',
        rows: [],
    },
} as const satisfies NearbySensorGuideContent
