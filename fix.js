const fs = require('fs');
let content = fs.readFileSync('src/app/features/home/home.component.html', 'utf8');

// 1. A11y and Sizes in Hero section
const heroOld1 = `<div
            class="relative w-44 sm:w-56 aspect-[3/4.2] rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/30 border border-slate-200/90 -rotate-6 hover:-rotate-2 hover:scale-105 transition-all duration-500 z-10 group cursor-pointer bg-white"
            (click)="buyDirect('mikir')">
            <img src="/images/books/makanya-mikir-mockup.jpg" alt="Cover Buku Makanya Mikir"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />`;
const heroNew1 = `<div role="button" tabindex="0"
            class="relative block text-left w-52 sm:w-72 aspect-[3/4.2] rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/30 border border-slate-200/90 -rotate-6 focus:outline-none focus:ring-4 focus:ring-slate-700 transition-shadow duration-300 z-10 cursor-pointer bg-white"
            (click)="buyDirect('mikir')" (keyup.enter)="buyDirect('mikir')" (keyup.space)="buyDirect('mikir')">
            <img src="/images/books/makanya-mikir.jpg" alt="Cover Buku Makanya Mikir"
              class="w-full h-full object-cover" />`;
content = content.replace(heroOld1, heroNew1);

const heroOld2 = `<div
            class="relative w-44 sm:w-56 aspect-[3/4.2] rounded-2xl overflow-hidden shadow-2xl shadow-slate-950/40 border border-slate-700/80 -ml-12 sm:-ml-16 mt-8 sm:mt-10 rotate-6 hover:-rotate-2 hover:scale-105 transition-all duration-500 z-20 group cursor-pointer bg-slate-900"
            (click)="buyDirect('ekonomi')">
            <img src="/images/books/prinsipil-ekonomi-mockup.jpg" alt="Cover Buku Prinsipil Ekonomi"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />`;
const heroNew2 = `<div role="button" tabindex="0"
            class="relative block text-left w-52 sm:w-72 aspect-[3/4.2] rounded-2xl overflow-hidden shadow-2xl shadow-slate-950/40 border border-slate-700/80 -ml-16 sm:-ml-24 mt-8 sm:mt-12 rotate-6 focus:outline-none focus:ring-4 focus:ring-slate-700 transition-shadow duration-300 z-20 cursor-pointer bg-slate-900"
            (click)="buyDirect('ekonomi')" (keyup.enter)="buyDirect('ekonomi')" (keyup.space)="buyDirect('ekonomi')">
            <img src="/images/books/prinsipil-ekonomi.jpg" alt="Cover Buku Prinsipil Ekonomi"
              class="w-full h-full object-cover" />`;
content = content.replace(heroOld2, heroNew2);

content = content.replace(
  '<div class="relative w-full max-w-md sm:max-w-lg flex items-center justify-center py-6">',
  '<div class="relative w-full max-w-lg sm:max-w-xl lg:max-w-2xl flex items-center justify-center py-6">'
);

// 2. Bento Grid Mockup Images
content = content.replace(
  '<img src="/images/books/makanya-mikir-mockup.jpg"',
  '<img src="/images/books/makanya-mikir.jpg"'
);
content = content.replace(
  '<img src="/images/books/prinsipil-ekonomi-mockup.jpg"',
  '<img src="/images/books/prinsipil-ekonomi.jpg"'
);

// 3. Dual Bundle mockups
const bundleOld = `<img src="/images/books/dual-books-bundle.jpg" alt="Paket Dua Buku Masterpiece Malakabooks"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />`;
const bundleNew = `<div class="w-full h-full flex flex-row">
          <img src="/images/books/makanya-mikir.jpg" alt="Makanya Mikir"
            class="w-1/2 h-full object-cover group-hover:scale-105 transition-transform duration-700 origin-right border-r border-slate-200/50" />
          <img src="/images/books/prinsipil-ekonomi.jpg" alt="Prinsipil Ekonomi"
            class="w-1/2 h-full object-cover group-hover:scale-105 transition-transform duration-700 origin-left" />
        </div>`;
content = content.replace(bundleOld, bundleNew);

// 4. Color replacements for #FFD028 and amber-400
const colorReplacements = [
  ['bg-[#FFD028]/25', 'bg-slate-700/25'],
  ['bg-[#FFD028]/15', 'bg-slate-700/15'],
  ['bg-[#FFD028]/10', 'bg-slate-700/10'],
  ['bg-[#FFD028]/20', 'bg-slate-700/20'],
  ['bg-[#FFD028]/30', 'bg-slate-700/30'],
  ['focus:ring-[#FFD028]', 'focus:ring-slate-700'],
  ['focus:ring-amber-400', 'focus:ring-slate-700'],
  ['bg-[#FFD028] hover:bg-[#ffc914] text-slate-950', 'bg-slate-700 hover:bg-slate-800 text-white'],
  ['hover:bg-[#FFD028]', 'hover:bg-slate-700'],
  ['bg-[#FFD028] text-slate-950', 'bg-slate-700 text-white'],
  ['bg-[#FFD028]', 'bg-slate-700'],
  ['shadow-[#FFD028]/25', 'shadow-slate-700/25'],
  ['text-[#FFD028]', 'text-slate-700'],
  ['text-amber-300', 'text-slate-300'],
  ['text-amber-400', 'text-slate-300'],
  ['bg-amber-400 text-slate-950', 'bg-slate-700 text-white'],
  ['ring-amber-400', 'ring-slate-700'],
  ['shadow-amber-400', 'shadow-slate-700'],
  ['bg-amber-400', 'bg-slate-700']
];

for (const [search, replace] of colorReplacements) {
  content = content.split(search).join(replace);
}

// Fix dark texts back to white on dark mockup panels
content = content.replace('<span class="font-bold text-slate-700">Rp 119.000', '<span class="font-bold text-white">Rp 119.000');
content = content.replace('<span class="font-bold text-slate-300">Rp 125.000', '<span class="font-bold text-white">Rp 125.000');
content = content.replace('<span class="font-bold block text-slate-300">Makanya, Mikir!</span>', '<span class="font-bold block text-white">Makanya, Mikir!</span>');
content = content.replace('<span class="font-bold block text-slate-300">Prinsipil Ekonomi</span>', '<span class="font-bold block text-white">Prinsipil Ekonomi</span>');

fs.writeFileSync('src/app/features/home/home.component.html', content, 'utf8');
console.log('Update complete.');
