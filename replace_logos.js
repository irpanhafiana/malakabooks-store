const fs = require('fs');
const path = require('path');

const dir = 'D:/MALAKABOOKS/malakabooks-store/src';
const logoPath = '/logo-mardika.png';

function replaceInFile(filePath, oldRegex, newStr) {
    const fullPath = path.join(dir, filePath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(oldRegex, newStr);
        fs.writeFileSync(fullPath, content, 'utf8');
    }
}

// admin-layout
replaceInFile(
    'app/layouts/admin-layout/admin-layout.component.html',
    /<div[^>]*>\s*<i class="bx bx-store-alt text-xl"><\/i>\s*<\/div>/,
    '<img src="' + logoPath + '" class="h-10 w-auto object-contain shrink-0" alt="Logo">'
);

// customer-layout
replaceInFile(
    'app/layouts/customer-layout/customer-layout.component.html',
    /<div[^>]*>\s*<i class="bx bx-store-alt text-xl"><\/i>\s*<\/div>/,
    '<img src="' + logoPath + '" class="h-9 w-auto object-contain shrink-0" alt="Logo">'
);

// register
replaceInFile(
    'app/features/auth/register/register.component.html',
    /<div[^>]*>\s*<i class="bx bx-store-alt text-3xl"><\/i>\s*<\/div>/,
    '<img src="' + logoPath + '" class="h-14 w-auto object-contain shrink-0" alt="Logo">'
);

// welcome
replaceInFile(
    'app/features/auth/welcome/welcome.component.html',
    /<div[^>]*>\s*<i class="bx bx-store-alt text-5xl text-primary-600"><\/i>\s*<\/div>/,
    '<div class="h-20 w-auto mb-8 mx-auto flex justify-center"><img src="' + logoPath + '" class="h-full w-auto object-contain" alt="Logo"></div>'
);

// also fix the desktop header and footer if they used malaka-books.svg
replaceInFile('app/layouts/desktop/desktop-header/desktop-header.component.html', /\/logo\/malakabooks-logo\.svg/g, logoPath);
replaceInFile('app/layouts/desktop/desktop-header/desktop-header.component.html', /\/malaka-books\.svg/g, logoPath);

replaceInFile('app/layouts/desktop/desktop-footer/desktop-footer.component.html', /\/logo\/malakabooks-logo\.svg/g, logoPath);
replaceInFile('app/layouts/desktop/desktop-footer/desktop-footer.component.html', /\/malaka-books\.svg/g, logoPath);

