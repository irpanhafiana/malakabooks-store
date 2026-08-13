import { describe, it, expect } from 'vitest';
import { claimsToRecord, mapClaimsToUser, readLogoutUrl, BffClaim } from './bff-claims.util';

const baseClaims: BffClaim[] = [
  { type: 'sub', value: 'user-42' },
  { type: 'given_name', value: 'Budi' },
  { type: 'email', value: 'budi@example.com' },
  { type: 'phone_number', value: '08123456789' }
];

describe('claimsToRecord', () => {
  it('collapses repeated claim types into an array', () => {
    const record = claimsToRecord([
      { type: 'role', value: 'Malaka-Customer' },
      { type: 'role', value: 'Malaka-Admin' },
      { type: 'sub', value: 'user-1' }
    ]);

    expect(record['role']).toEqual(['Malaka-Customer', 'Malaka-Admin']);
    expect(record['sub']).toBe('user-1');
  });

  it('skips malformed entries', () => {
    const record = claimsToRecord([{ type: '', value: 'x' }, { type: 'sub', value: 'user-1' }]);
    expect(record['sub']).toBe('user-1');
  });

  it('parses JSON-serialized array claim values', () => {
    const record = claimsToRecord([
      { type: 'role', value: '["Malaka-Admin", "B2CService-Finance"]' },
      { type: 'sub', value: 'user-2' }
    ]);

    expect(record['role']).toEqual(['Malaka-Admin', 'B2CService-Finance']);
    expect(record['sub']).toBe('user-2');
  });
});

describe('mapClaimsToUser', () => {
  it('maps BFF claims to an application user', () => {
    const user = mapClaimsToUser([...baseClaims, { type: 'role', value: 'Malaka-Customer' }]);

    expect(user).toMatchObject({
      id: 'user-42',
      name: 'Budi',
      email: 'budi@example.com',
      role: 'customer',
      phone: '08123456789'
    });
  });

  it('detects an admin from any admin-ish role claim', () => {
    expect(mapClaimsToUser([...baseClaims, { type: 'role', value: 'Malaka-Admin' }])?.role).toBe('admin');
    expect(mapClaimsToUser([...baseClaims, { type: 'role', value: 'SSOnline-Admin' }])?.role).toBe('admin');
  });

  it('detects admin with multiple roles from res.json', () => {
    const claims: BffClaim[] = [
      { type: 'sub', value: 'user-123' },
      { type: 'given_name', value: 'Test Admin' },
      { type: 'role', value: 'Malaka-Admin' },
      { type: 'role', value: 'B2CService-Finance' },
      { type: 'role', value: 'VehicleMaintenance-Admin' },
      { type: 'role', value: 'Administr' },
      { type: 'role', value: 'Customer' }
    ];
    const user = mapClaimsToUser(claims);
    expect(user?.role).toBe('admin');
  });

  it('returns null without a subject claim', () => {
    expect(mapClaimsToUser([{ type: 'given_name', value: 'Budi' }])).toBeNull();
  });

  it('returns null for empty or non-array input', () => {
    expect(mapClaimsToUser([])).toBeNull();
    expect(mapClaimsToUser(null)).toBeNull();
  });
});

describe('readLogoutUrl', () => {
  it('reads the sid-bearing logout url the BFF supplies', () => {
    const claims = [...baseClaims, { type: 'bff:logout_url', value: '/bff/logout?sid=abc' }];
    expect(readLogoutUrl(claims)).toBe('/bff/logout?sid=abc');
  });

  it('returns null when the claim is absent', () => {
    expect(readLogoutUrl(baseClaims)).toBeNull();
    expect(readLogoutUrl(null)).toBeNull();
  });
});
