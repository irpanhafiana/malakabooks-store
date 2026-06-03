import { Category } from '../models/category.model';

export const CATEGORIES_DATA: Category[] = [
  {
    id: 'cat-1',
    name: 'Fiksi',
    slug: 'fiksi',
    description: 'Karya sastra imajinatif seperti novel, cerpen, dan antologi fiksi menarik.',
    icon: 'book-open'
  },
  {
    id: 'cat-2',
    name: 'Non-Fiksi',
    slug: 'non-fiksi',
    description: 'Buku-buku berbasis fakta, biografi, memoar, sejarah, dan dokumentasi nyata.',
    icon: 'newspaper'
  },
  {
    id: 'cat-3',
    name: 'Sejarah',
    slug: 'sejarah',
    description: 'Eksplorasi perjalanan peradaban manusia, arsip sejarah dunia dan Nusantara.',
    icon: 'hourglass'
  },
  {
    id: 'cat-4',
    name: 'Sains',
    slug: 'sains',
    description: 'Buku populer sains, fisika, astronomi, biologi, teknologi, dan eksplorasi ilmu pengetahuan.',
    icon: 'beaker'
  },
  {
    id: 'cat-5',
    name: 'Bisnis',
    slug: 'bisnis',
    description: 'Panduan kewirausahaan, manajemen, investasi, ekonomi makro/mikro, dan strategi bisnis.',
    icon: 'briefcase'
  },
  {
    id: 'cat-6',
    name: 'Self-Help',
    slug: 'self-help',
    description: 'Buku pengembangan diri, kesehatan mental, produktivitas, dan motivasi hidup.',
    icon: 'sparkles'
  },
  {
    id: 'cat-7',
    name: 'Anak-Anak',
    slug: 'anak-anak',
    description: 'Buku cerita bergambar, dongeng, dan media edukasi interaktif anak usia dini.',
    icon: 'face-smile'
  },
  {
    id: 'cat-8',
    name: 'Komik',
    slug: 'komik',
    description: 'Novel grafis, komik lokal, manga Jepang, dan komik barat dengan ilustrasi memukau.',
    icon: 'film'
  }
];
