/**
 * QR Code Generator Utilities for Hộ Kinh Doanh Phan Nguyên
 * Supports generating dynamic QR codes for sharing the app with parents, students, and teachers.
 */

export interface QRCodeOptions {
  size?: number;
  color?: string;
  bgColor?: string;
  margin?: number;
}

/**
 * Returns a high-resolution QR Code image URL for quick rendering and sharing
 */
export function getQRCodeImageUrl(data: string, size = 300): string {
  const encoded = encodeURIComponent(data.trim());
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=2&qzone=2`;
}

/**
 * Generates an SVG representation of a QR placeholder / visual matrix
 * for instant offline or fallback preview
 */
export function generateQRCodeSvg(data: string, size = 240): string {
  // Hash data to create deterministic visual pattern
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0;
  }

  const moduleCount = 29; // 29x29 standard version 3
  const cellSize = size / moduleCount;

  // Build grid
  const cells: string[] = [];

  // Corner markers (Finder patterns)
  const addFinderPattern = (rowStart: number, colStart: number) => {
    // 7x7 outer square
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          cells.push(
            `<rect x="${(colStart + c) * cellSize}" y="${(rowStart + r) * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1e293b" />`
          );
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(0, moduleCount - 7);
  addFinderPattern(moduleCount - 7, 0);

  // Timing patterns
  for (let i = 8; i < moduleCount - 8; i += 2) {
    cells.push(
      `<rect x="${6 * cellSize}" y="${i * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1e293b" />`
    );
    cells.push(
      `<rect x="${i * cellSize}" y="${6 * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1e293b" />`
    );
  }

  // Deterministic data pseudo-modules
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      // Skip finder zones
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= moduleCount - 8) ||
        (r >= moduleCount - 8 && c < 8) ||
        r === 6 ||
        c === 6
      ) {
        continue;
      }

      const bit = ((hash ^ (r * 31 + c * 17)) + (r * c)) % 3 === 0;
      if (bit) {
        cells.push(
          `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1e293b" rx="1" />`
        );
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="${size}" height="${size}" fill="#ffffff" rx="8" />
    ${cells.join('')}
  </svg>`;
}
