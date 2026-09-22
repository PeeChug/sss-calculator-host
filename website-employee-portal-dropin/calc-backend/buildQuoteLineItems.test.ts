import { allocateRoomLineCents, buildQuoteLineItems, buildChalkOfficeNotes, suggestionFromPhoton, suggestionFromNominatim, suggestionFromParts, stateToAbbr, rankAddressSuggestions } from './handler.ts';

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

function eq(a: unknown, b: unknown, msg: string): void {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa !== sb) throw new Error(`${msg}: ${sa} !== ${sb}`);
}

// Broken payload: project total dumped on line 1, rest $0.
{
  const rooms = [
    { name: 'Interior Painting — Living', totalPrice: 2579 },
    { name: 'Interior Painting — Bedroom', totalPrice: 0 },
    { name: 'Interior Painting — Bath', totalPrice: 0 },
  ];
  const cents = allocateRoomLineCents(rooms, 2579);
  assert(cents.every((c) => c > 0), 'reallocated lines must all have cents');
  assert(cents[0] !== 257900, 'line 1 must not keep the project total');
  eq(
    cents.reduce((s, c) => s + c, 0),
    257900,
    'reallocated cents must sum to the project',
  );
}

// Healthy payload: keep per-room dollars.
{
  const rooms = [
    { name: 'Living', totalPrice: 980, unit_price_cents: 98000 },
    { name: 'Bedroom', totalPrice: 860, unit_price_cents: 86000 },
    { name: 'Bath', totalPrice: 739, unit_price_cents: 73900 },
  ];
  const cents = allocateRoomLineCents(rooms, 2579);
  eq(cents, [98000, 86000, 73900], 'pass through real per-room cents');
}

{
  const payload = {
    projects: [
      {
        type: 'fence',
        _jobberName: 'Fence Staining',
        preDiscountSubtotal: 2640,
      },
      {
        type: 'interior',
        _jobberName: 'Interior Painting',
        preDiscountSubtotal: 2579,
        _jobberDescription: 'PAINT (ESTIMATED ORDER)\n~6 gal',
        _jobberRoomLineItems: [
          { name: 'Interior Painting — Living Room', description: '12 × 14', totalPrice: 980, unitPrice: 980, unit_price_cents: 98000 },
          { name: 'Interior Painting — Bedroom', description: '11 × 12', totalPrice: 860, unitPrice: 860, unit_price_cents: 86000 },
          { name: 'Interior Painting — Bath', description: '8 × 10', totalPrice: 739, unitPrice: 739, unit_price_cents: 73900 },
        ],
      },
    ],
    totals: { bundleDiscount: 0, totalDiscountSavings: 0, final: 5219 },
  };
  const { line_items } = buildQuoteLineItems(payload);
  eq(line_items.length, 4, 'fence one line + 3 interior rooms');
  assert(!line_items.some((l: any) => l.product_id), 'never product_id');
  const paint = line_items.filter((l: any) => String(l.name).startsWith('Interior'));
  eq(paint.map((l: any) => l.unit_price_cents), [98000, 86000, 73900], 'each paint line has its own cents');
  eq(
    paint.reduce((s: number, l: any) => s + l.unit_price_cents, 0),
    257900,
    'paint lines sum to the interior project',
  );
  eq(line_items[0].unit_price_cents, 264000, 'stain stays one priced line');
  assert(String(paint[2].description).includes('PAINT (ESTIMATED ORDER)'), 'paint order stays on last paint line');
}

{
  const { line_items } = buildQuoteLineItems({
    projects: [
      {
        type: 'interior',
        preDiscountSubtotal: 2100,
        _jobberRoomLineItems: [
          { name: 'Interior Painting — A', totalPrice: 2100 },
          { name: 'Interior Painting — B' },
          { name: 'Interior Painting — C', totalPrice: 0 },
        ],
      },
    ],
    totals: {},
  });
  const cents = line_items.map((l: any) => l.unit_price_cents);
  assert(cents[0] !== 210000, 'must not keep project total on line 1');
  assert(cents.every((c: number) => c > 0), 'every fan-out line priced');
  eq(cents.reduce((s: number, c: number) => s + c, 0), 210000, 'fan-out sums to project');
}

{
  const payload = {
    projects: [
      {
        type: 'fence',
        _jobberName: 'Fence Staining & Restoration',
        preDiscountSubtotal: 2640,
      },
      {
        type: 'deck',
        _jobberName: 'Deck Staining & Restoration',
        preDiscountSubtotal: 1920,
      },
      {
        type: 'interior',
        _jobberName: 'Interior Painting',
        preDiscountSubtotal: 2100,
        _jobberDescription: 'PAINT (ESTIMATED ORDER)\n~8 gal SuperPaint',
        _jobberRoomLineItems: [
          { name: 'Interior Painting — Living Room', description: '14 × 12', totalPrice: 1240, unitPrice: 1240, unit_price_cents: 124000 },
          { name: 'Interior Painting — Bedroom', description: '12 × 11', totalPrice: 860, unitPrice: 860, unit_price_cents: 86000 },
        ],
      },
      {
        type: 'exterior',
        _jobberName: 'Exterior Painting',
        preDiscountSubtotal: 5400,
        _jobberDescription: 'PAINT (ESTIMATED ORDER)\n~12 gal Duration',
        _jobberRoomLineItems: [
          { name: 'Exterior Painting — Front', description: '40 × 10', totalPrice: 2400, unitPrice: 2400, unit_price_cents: 240000 },
          { name: 'Exterior Painting — Rear', description: '36 × 10', totalPrice: 2160, unitPrice: 2160, unit_price_cents: 216000 },
          { name: 'Exterior Painting — trim, doors & details', description: 'Entry doors', totalPrice: 840, unitPrice: 840, unit_price_cents: 84000 },
        ],
      },
    ],
    totals: { bundleDiscount: 0, totalDiscountSavings: 0, final: 12060 },
  };
  const { line_items } = buildQuoteLineItems(payload);
  eq(
    line_items.map((l: any) => [l.name, l.unit_price_cents]),
    [
      ['Fence Staining & Restoration', 264000],
      ['Deck Staining & Restoration', 192000],
      ['Interior Painting — Living Room', 124000],
      ['Interior Painting — Bedroom', 86000],
      ['Exterior Painting — Front', 240000],
      ['Exterior Painting — Rear', 216000],
      ['Exterior Painting — trim, doors & details', 84000],
    ],
    'mixed quote: stain one line each, paint rooms/sides own cents',
  );
  assert(!line_items.some((l: any) => l.product_id), 'mixed quote never product_id');
  assert(line_items[0].unit_price_cents !== 1206000, 'must not dump quote total on line 1');
  const interior = line_items.filter((l: any) => String(l.name).startsWith('Interior'));
  const exterior = line_items.filter((l: any) => String(l.name).startsWith('Exterior'));
  eq(interior.reduce((s: number, l: any) => s + l.unit_price_cents, 0), 210000, 'interior rooms sum to interior project');
  eq(exterior.reduce((s: number, l: any) => s + l.unit_price_cents, 0), 540000, 'exterior sides sum to exterior project');
  assert(String(interior[interior.length - 1].description).includes('PAINT (ESTIMATED ORDER)'), 'interior gallons on last interior line');
  assert(String(exterior[exterior.length - 1].description).includes('PAINT (ESTIMATED ORDER)'), 'exterior gallons on last exterior line');
  assert(!String(line_items[0].description || '').includes('PAINT (ESTIMATED ORDER)'), 'stain line has no paint gallons');
}

console.log('buildQuoteLineItems tests passed');

{
  const payload = {
    projects: [
      {
        type: 'interior',
        _jobberName: 'Interior Painting',
        preDiscountSubtotal: 2324,
        selectedColor: { name: 'Room-by-room wall, ceiling & trim colors' },
        measurements: {
          rooms: [
            { id: 'room-a', label: 'Living Room' },
            { id: 'room-b', label: 'Bedroom' },
          ],
          colorPlan: {
            mode: 'perRoom',
            perRoom: {
              'room-a': {
                wall: { name: 'Agreeable Gray', code: 'SW 7029' },
                ceiling: { name: 'Extra White', code: 'SW 7006' },
                trim: { name: 'Greek Villa', code: 'SW 7551' },
              },
              'room-b': {
                wall: { name: 'Naval', code: 'SW 6244' },
                ceiling: { name: 'Untinted Ceiling White', code: 'no tint' },
                trim: { name: 'To be determined', tbd: true },
              },
            },
          },
        },
        _jobberRoomLineItems: [
          {
            name: 'Interior Painting — Living Room',
            description: '14 × 12 ft, 8 ft ceilings\n- Wall: Agreeable Gray (SW 7029)\n- Ceiling: Extra White (SW 7006)\n- Trim: Greek Villa (SW 7551)',
            totalPrice: 1240, unitPrice: 1240, unit_price_cents: 124000,
          },
          {
            name: 'Interior Painting — Bedroom',
            description: '12 × 11 ft, 8 ft ceilings\n- Wall: Naval (SW 6244)\n- Ceiling: Untinted Ceiling White (no tint)\n- Trim: To be determined',
            totalPrice: 1084, unitPrice: 1084, unit_price_cents: 108400,
          },
        ],
      },
    ],
    totals: { bundleDiscount: 0, totalDiscountSavings: 0, final: 2324 },
  };
  const { line_items } = buildQuoteLineItems(payload);
  eq(line_items.length, 2, 'per-room stays two priced lines, not six');
  assert(!line_items.some((l: any) => l.product_id), 'per-room never product_id');
  eq(line_items.map((l: any) => l.unit_price_cents), [124000, 108400], 'each room keeps its own cents');
  assert(String(line_items[0].description).includes('Wall: Agreeable Gray (SW 7029)'), 'living wall on line');
  assert(String(line_items[0].description).includes('Ceiling: Extra White (SW 7006)'), 'living ceiling on line');
  assert(String(line_items[0].description).includes('Trim: Greek Villa (SW 7551)'), 'living trim on line');
  assert(String(line_items[1].description).includes('Trim: To be determined'), 'bedroom trim TBD on line');
  const notes = buildChalkOfficeNotes(payload);
  assert(notes.includes('Living Room — walls Agreeable Gray (SW 7029) / ceiling Extra White (SW 7006) / trim Greek Villa (SW 7551)'), 'office notes living colors');
  assert(notes.includes('Bedroom — walls Naval (SW 6244)'), 'office notes bedroom wall');
  assert(notes.includes('trim To be determined'), 'office notes bedroom trim TBD');
}

console.log('per-room wall/ceiling/trim line + office note tests passed');

{
  eq(stateToAbbr('South Carolina'), 'SC', 'SC abbr');
  const photon = suggestionFromPhoton({
    properties: {
      housenumber: '100',
      street: 'N Main St',
      city: 'Greenville',
      state: 'South Carolina',
      postcode: '29601',
      countrycode: 'us',
    },
  });
  eq(photon && photon.street1, '100 N Main St', 'photon street');
  eq(photon && photon.city, 'Greenville', 'photon city');
  eq(photon && photon.province, 'SC', 'photon state');
  eq(photon && photon.postalCode, '29601', 'photon zip');
  eq(photon && photon.source, 'places', 'photon source');
  assert(!suggestionFromPhoton({ properties: { name: 'Main Street', city: 'Paris', countrycode: 'fr' } }), 'reject non-US');
  assert(!suggestionFromParts({ street1: 'Main Street', city: 'Greenville', province: 'SC' }), 'require a house number');
  const nom = suggestionFromNominatim({
    address: {
      house_number: '201',
      road: 'W Washington St',
      city: 'Greenville',
      state: 'South Carolina',
      postcode: '29601',
      country_code: 'us',
    },
  });
  eq(nom && nom.street1, '201 W Washington St', 'nominatim street');
  eq(nom && nom.province, 'SC', 'nominatim state');

  const ranked = rankAddressSuggestions(
    [
      { source: 'chalk', street1: '319 Starling Ave', city: 'Easley', province: 'SC', postalCode: '', label: '319 Starling Ave, Easley, SC' },
      { source: 'places', street1: '100 N Main St', city: 'Greenville', province: 'SC', postalCode: '29601', label: '100 N Main St, Greenville, SC 29601' },
    ],
    '100 N Main Greenville SC',
    5,
  );
  eq(ranked.length, 1, 'unrelated Chalk streets dropped');
  eq(ranked[0].street1, '100 N Main St', 'Places street ranks first');
}

console.log('address suggestion tests passed');

