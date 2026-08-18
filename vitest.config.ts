import { defineConfig } from 'vitest/config';
import fs from 'fs';
import path from 'path';

function angularComponentPlugin() {
  return {
    name: 'vite-plugin-angular-template',
    transform(code: string, id: string) {
      if (!id.endsWith('.ts') || id.endsWith('.spec.ts')) return;

      let transformed = code;

      // Replace templateUrl: './foo.html' with template: '...'
      transformed = transformed.replace(/templateUrl:\s*['"]([^'"]+)['"]/g, (match, url) => {
        const filePath = path.resolve(path.dirname(id), url);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          return `template: ${JSON.stringify(content)}`;
        }
        return match;
      });

      // Replace styleUrl: './foo.css' with styles: ['...']
      transformed = transformed.replace(/styleUrl:\s*['"]([^'"]+)['"]/g, (match, url) => {
        const filePath = path.resolve(path.dirname(id), url);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          return `styles: [${JSON.stringify(content)}]`;
        }
        return match;
      });

      // Replace styleUrls: [...] with styles: []
      transformed = transformed.replace(/styleUrls:\s*\[([^\]]+)\]/g, () => {
        return `styles: []`;
      });

      return { code: transformed, map: null };
    }
  };
}

export default defineConfig({
  plugins: [angularComponentPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 30,
        functions: 30
      }
    }
  }
});
