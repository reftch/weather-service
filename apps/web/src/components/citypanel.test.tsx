import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/preact';

import CityPanel from './citypanel';
import type { City } from '../lib/model';

/** Builds a fully-populated city; override fields per test. */
const makeCity = (overrides: Partial<City> = {}): City => ({
  id: 1,
  city: 'Berlin',
  state: 'Berlin',
  country: 'Germany',
  coordinate: { latitude: 52.52, longitude: 13.405 },
  current: {
    temperature_2m: 21.5,
    interval: 1,
    time: '2026-11-22T12:00:00Z',
    weather_code: 2,
  },
  elevation: 35,
  ...overrides,
});

/** Returns the <div> row containing the given label. */
const row = (label: string): HTMLElement => {
  const el = screen.getByText(`${label}:`);
  return el.parentElement as HTMLElement;
};

describe('CityPanel', () => {
  it('renders flat string/number properties when details is absent', () => {
    const city = makeCity({
      district: 'Mitte',
      postcode: '10115',
      countrycode: 'DE',
      housenumber: 12,
    });
    render(<CityPanel city={city} />);

    expect(row('City')).toHaveTextContent('Berlin');
    expect(row('State')).toHaveTextContent('Berlin');
    expect(row('Country')).toHaveTextContent('Germany');
    expect(row('District')).toHaveTextContent('Mitte');
    expect(row('Postcode')).toHaveTextContent('10115');
    expect(row('Countrycode')).toHaveTextContent('DE');
    expect(row('Housenumber')).toHaveTextContent('12');
  });

  it('prefers the details payload over the flat city properties', () => {
    const city = makeCity({
      details: { city: 'Vienna', type: 'city', osm_key: 'place' },
    });
    render(<CityPanel city={city} />);

    expect(row('City')).toHaveTextContent('Vienna');
    expect(row('Type')).toHaveTextContent('city');
    // Underscores and OSM are normalised in labels.
    expect(row('OSM Key')).toHaveTextContent('place');

    // Flat properties are not duplicated when details is present.
    expect(screen.queryByText('Berlin')).not.toBeInTheDocument();
  });

  it('formats numeric elevation with a metres suffix', () => {
    const { unmount } = render(<CityPanel city={makeCity({ elevation: 35 })} />);
    expect(row('Elevation')).toHaveTextContent('35m');
    unmount();

    render(<CityPanel city={makeCity({ details: { elevation: 350 } })} />);
    expect(row('Elevation')).toHaveTextContent('350m');
  });

  it('treats a non-numeric elevation as a plain value without a suffix', () => {
    const city = makeCity({ details: { elevation: '35' } });
    render(<CityPanel city={city} />);
    expect(row('Elevation')).toHaveTextContent('35');
    expect(screen.queryByText('35m')).not.toBeInTheDocument();
  });

  it('humanises keys containing underscores, dots and camelCase', () => {
    const city = makeCity({
      details: { foo_bar: 'x', 'a.b': 'y', someValue: 'z' },
    });
    render(<CityPanel city={city} />);

    expect(row('Foo Bar')).toHaveTextContent('x');
    expect(row('A B')).toHaveTextContent('y');
    expect(row('Some Value')).toHaveTextContent('z');
  });

  it('skips null, undefined and non-primitive values', () => {
    const city = makeCity({
      // Values typed as string | number, but the component must survive
      // anything the backend may send at runtime.
      details: {
        elevation: 35,
        broken: { nested: true } as unknown as string,
        hidden: null as unknown as string,
      },
    });
    render(<CityPanel city={city} />);

    expect(screen.queryByText('Broken:')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden:')).not.toBeInTheDocument();
    expect(row('Elevation')).toBeInTheDocument();
  });

  it('always renders coordinates with six decimal places', () => {
    render(
      <CityPanel city={makeCity({ coordinate: { latitude: 52.52, longitude: 13.405 } })} />,
    );
    expect(screen.getByText('Coordinates:')).toBeInTheDocument();
    expect(screen.getByText('52.520000, 13.405000')).toBeInTheDocument();
  });

  it('renders temperature and time when current weather is present', () => {
    render(
      <CityPanel
        city={makeCity({
          current: {
            temperature_2m: 21.5,
            interval: 1,
            time: '2026-11-22T12:00:00Z',
            weather_code: 2,
          },
        })}
      />,
    );
    expect(row('Temperature')).toHaveTextContent('21.5°C');
    expect(row('Time')).toHaveTextContent('2026-11-22T12:00:00Z');
  });

  it('omits the weather section when current weather is missing', () => {
    const city = makeCity();
    const withoutCurrent = { ...city, current: undefined } as unknown as City;
    render(<CityPanel city={withoutCurrent} />);

    expect(screen.queryByText('Temperature:')).not.toBeInTheDocument();
    expect(screen.queryByText('Time:')).not.toBeInTheDocument();
    // The remaining rows are still rendered.
    expect(row('City')).toBeInTheDocument();
  });
});
