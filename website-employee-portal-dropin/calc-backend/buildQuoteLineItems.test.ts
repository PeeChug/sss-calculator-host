import { allocateRoomLineCents, buildQuoteLineItems } from './handler.ts';

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

console.log('buildQuoteLineItems tests passed');
