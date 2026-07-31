import fs from 'fs';
import path from 'path';

const markSVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-label="YourStylist Mark">
  <rect width="512" height="512" fill="#FAF9F6"/>
  <!-- Y monogram representing fabric folds / collar -->
  <path d="M156 120 L256 270 L356 120 L310 120 L256 200 L202 120 Z" fill="#2B3A2C"/>
  <rect x="236" y="270" width="40" height="122" fill="#2B3A2C"/>
</svg>`;

const markDarkSVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-label="YourStylist Mark Dark">
  <rect width="512" height="512" fill="#1A1A1A"/>
  <!-- Y monogram representing fabric folds / collar -->
  <path d="M156 120 L256 270 L356 120 L310 120 L256 200 L202 120 Z" fill="#FAF9F6"/>
  <rect x="236" y="270" width="40" height="122" fill="#FAF9F6"/>
</svg>`;

const wordmarkSVG = `<svg width="512" height="120" viewBox="0 0 512 120" xmlns="http://www.w3.org/2000/svg" aria-label="YourStylist">
  <text x="256" y="80" font-family="'Noto Serif Thai', serif" font-size="64" font-weight="600" text-anchor="middle" fill="#2B3A2C" letter-spacing="2">YourStylist</text>
</svg>`;

const lockupSVG = `<svg width="512" height="632" viewBox="0 0 512 632" xmlns="http://www.w3.org/2000/svg" aria-label="YourStylist Lockup">
  <rect width="512" height="632" fill="#FAF9F6"/>
  <path d="M156 120 L256 270 L356 120 L310 120 L256 200 L202 120 Z" fill="#2B3A2C"/>
  <rect x="236" y="270" width="40" height="122" fill="#2B3A2C"/>
  <text x="256" y="520" font-family="'Noto Serif Thai', serif" font-size="64" font-weight="600" text-anchor="middle" fill="#2B3A2C" letter-spacing="2">YourStylist</text>
</svg>`;

const lockupDarkSVG = `<svg width="512" height="632" viewBox="0 0 512 632" xmlns="http://www.w3.org/2000/svg" aria-label="YourStylist Lockup Dark">
  <rect width="512" height="632" fill="#1A1A1A"/>
  <path d="M156 120 L256 270 L356 120 L310 120 L256 200 L202 120 Z" fill="#FAF9F6"/>
  <rect x="236" y="270" width="40" height="122" fill="#FAF9F6"/>
  <text x="256" y="520" font-family="'Noto Serif Thai', serif" font-size="64" font-weight="600" text-anchor="middle" fill="#FAF9F6" letter-spacing="2">YourStylist</text>
</svg>`;

const faviconSVG = `<svg width="64" height="64" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#FAF9F6"/>
  <path d="M156 120 L256 270 L356 120 L310 120 L256 200 L202 120 Z" fill="#2B3A2C"/>
  <rect x="236" y="270" width="40" height="122" fill="#2B3A2C"/>
</svg>`;

const brandDir = path.join(process.cwd(), 'public', 'brand');
if (!fs.existsSync(brandDir)) {
  fs.mkdirSync(brandDir, { recursive: true });
}

fs.writeFileSync(path.join(brandDir, 'yourstylist-mark.svg'), markSVG);
fs.writeFileSync(path.join(brandDir, 'yourstylist-mark-dark.svg'), markDarkSVG);
fs.writeFileSync(path.join(brandDir, 'yourstylist-wordmark.svg'), wordmarkSVG);
fs.writeFileSync(path.join(brandDir, 'yourstylist-lockup.svg'), lockupSVG);
fs.writeFileSync(path.join(brandDir, 'yourstylist-lockup-dark.svg'), lockupDarkSVG);
fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.svg'), faviconSVG);
console.log('Created SVGs');
