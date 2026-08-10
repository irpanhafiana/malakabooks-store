
/** Kode customer group untuk pembeli kanal online. */
export const CUSTOMER_GROUP_ONLINE = '103';

/** Kode customer group untuk pembeli non-member (harga lebih tinggi). */
export const CUSTOMER_GROUP_NON_MEMBER = '106';

/** UoM code yang dipakai seluruh detail pricing. */
export const PRICING_UOM_CODE = 'JASA';

/** Markup harga non-member terhadap harga online (+20%, target rentang 15–25%). */
export const NON_MEMBER_PRICE_MULTIPLIER = 1.2;

/** Batas akhir masa berlaku default untuk pricing hasil bulk insert. */
export const PRICING_DEFAULT_END_DATE = '2036-12-31T23:59:59.000Z';

/** Seluruh customer group yang dapat dipilih pada detail pricing. */
export const CUSTOMER_GROUP_OPTIONS: { value: string; label: string }[] = [
  { value: '100', label: 'Mitra' },
  { value: '102', label: 'Warung' },
  { value: CUSTOMER_GROUP_ONLINE, label: 'Online' },
  { value: '104', label: 'Grosir' },
  { value: '105', label: 'Member' },
  { value: CUSTOMER_GROUP_NON_MEMBER, label: 'Non Member' }
];
