import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickChalkUserForRep, normalizeChalkInitials } from './handler.ts';

const SSS_TEAM = [
  {
    id: '01M0VS1XSPHZ8F3ZPGJK8ASMZ9',
    initials: 'ag',
    name: 'Adrian',
    email: 'superiorstainsolutions@gmail.com',
    active: 1,
  },
  {
    id: '01M13056KTRBYGQ8JAEFK91HNT',
    initials: 'pj',
    name: 'Preston Jones',
    email: 'prestonzjm@gmail.com',
    active: 1,
  },
  {
    id: '01M34FZ04AGSSYAWK7YA077RRE',
    initials: 'tj',
    name: 'Tech - Juan',
    email: 'juangsanchez78@gmail.com',
    active: 1,
  },
];

test('normalize initials the way Chalk Team does', () => {
  assert.equal(normalizeChalkInitials('AG'), 'ag');
  assert.equal(normalizeChalkInitials('pj'), 'pj');
  assert.equal(normalizeChalkInitials('P.J.'), 'pj');
});

test('PJ PIN rep maps to Chalk Preston Jones', () => {
  const picked = pickChalkUserForRep(SSS_TEAM, {
    initials: 'PJ',
    display_name: 'Preston Jones',
    email: null,
  });
  assert.equal(picked?.id, '01M13056KTRBYGQ8JAEFK91HNT');
  assert.equal(picked?.name, 'Preston Jones');
});

test('AG PIN rep maps to Chalk Adrian, not the shared contact@ inbox', () => {
  const picked = pickChalkUserForRep(SSS_TEAM, {
    initials: 'AG',
    display_name: 'Adrian Gluchowski',
    email: 'contact@superiorstainsolutions.com',
  });
  assert.equal(picked?.id, '01M0VS1XSPHZ8F3ZPGJK8ASMZ9');
  assert.equal(picked?.name, 'Adrian');
});

test('unknown initials do not guess a Chalk user', () => {
  const picked = pickChalkUserForRep(SSS_TEAM, { initials: 'XX', display_name: 'Nobody' });
  assert.equal(picked, null);
});

test('dry-run quote bodies for PJ vs AG', () => {
  const ag = pickChalkUserForRep(SSS_TEAM, { initials: 'AG', display_name: 'Adrian Gluchowski' });
  const pj = pickChalkUserForRep(SSS_TEAM, { initials: 'PJ', display_name: 'Preston Jones' });
  const agBody = {
    client_id: 'client_dry',
    property_id: 'prop_dry',
    title: 'Fence Staining',
    salesperson_id: ag?.id,
  };
  const pjBody = {
    client_id: 'client_dry',
    property_id: 'prop_dry',
    title: 'Fence Staining',
    salesperson_id: pj?.id,
  };
  assert.notEqual(agBody.salesperson_id, pjBody.salesperson_id);
  assert.equal(agBody.salesperson_id, '01M0VS1XSPHZ8F3ZPGJK8ASMZ9');
  assert.equal(pjBody.salesperson_id, '01M13056KTRBYGQ8JAEFK91HNT');
});
