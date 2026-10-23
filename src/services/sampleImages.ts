// Lightweight SVG-to-DataURL helpers for realistic test photos in the browser
export interface SamplePhotoPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  dataUrl: string;
}

// Generate high quality SVG data URLs that depict campus maintenance issues
function createSvgDataUrl(title: string, subtitle: string, bgColor: string, iconSvg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor}" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
    </defs>
    <rect width="600" height="400" fill="url(#grad)" />
    <rect x="20" y="20" width="560" height="360" rx="12" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
    <g transform="translate(250, 100)" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      ${iconSvg}
    </g>
    <text x="300" y="240" font-family="system-ui, sans-serif" font-size="22" font-weight="700" fill="#ffffff" text-anchor="middle">${title}</text>
    <text x="300" y="275" font-family="system-ui, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">${subtitle}</text>
    <rect x="210" y="305" width="180" height="28" rx="6" fill="rgba(15, 23, 42, 0.6)" />
    <text x="300" y="324" font-family="monospace" font-size="11" fill="#38bdf8" text-anchor="middle">CAMPUS CCTV / MOBILE SNAPSHOT</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export const SAMPLE_CAMPUS_PHOTOS: SamplePhotoPreset[] = [
  {
    id: 'wifi_drop',
    name: 'Library 2F - WiFi Dropping Out',
    category: 'Internet Connectivity',
    description: 'Screenshot showing 85% packet loss on Eduroam near quiet study pods.',
    dataUrl: createSvgDataUrl(
      'WiFi Ping Failure: 85% Packet Loss',
      'SSID: Campus-Secure | Channel 36 | AP-LIB-2E',
      '#0e3a53',
      `<path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" transform="scale(3.5) translate(-3, -2)" stroke="#38bdf8" stroke-width="1.8"/>`
    ),
  },
  {
    id: 'pipe_leak',
    name: 'Chem Lab 104 - Sink Pipe Burst',
    category: 'Plumbing',
    description: 'Water spraying from copper pipe fitting under laboratory wash basin.',
    dataUrl: createSvgDataUrl(
      'Active Water Leak Under Basin',
      'Science Complex B - Room 104 Lab Sink',
      '#034548',
      `<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" transform="scale(3.2) translate(-3, -1)" stroke="#2dd4bf" stroke-width="1.8" fill="rgba(45,212,191,0.2)"/>`
    ),
  },
  {
    id: 'light_flicker',
    name: 'Hall 202 - Ballast Buzzing & Sparks',
    category: 'Electricity',
    description: 'Fluorescent ceiling ballast strobing and discolored near lecture podium.',
    dataUrl: createSvgDataUrl(
      'Flickering Overhead Tube & Ballast',
      'Engineering Hall - Lecture Room 202',
      '#451a03',
      `<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" transform="scale(3.2) translate(-3, -1)" stroke="#f59e0b" stroke-width="1.8" fill="rgba(245,158,11,0.2)"/>`
    ),
  },
  {
    id: 'coffee_spill',
    name: 'Student Center - Liquid & Glass Slip Risk',
    category: 'Cleanliness',
    description: 'Beverage puddle with broken mug fragments across marble floor entryway.',
    dataUrl: createSvgDataUrl(
      'Shattered Mug & Spilled Liquid',
      'Student Center - Main Concourse South Entry',
      '#3b0764',
      `<circle cx="12" cy="12" r="10" transform="scale(3.2) translate(-3, -1)" stroke="#c084fc" stroke-width="1.8"/><path d="M12 8v4M12 16h.01" transform="scale(3.2) translate(-3, -1)" stroke="#c084fc" stroke-width="2"/>`
    ),
  },
];
