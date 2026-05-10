/**
 * Attendance utilities: GPS, Reverse Geocoding, Haversine, Watermark
 */

/* ──── Haversine distance (meters) ──── */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ──── GPS Position ──── */
export interface GpsPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export function getCurrentPosition(): Promise<GpsPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ GPS"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(new Error(`GPS error: ${err.message}`)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/* ──── Reverse Geocoding (Nominatim) ──── */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "vi" } }
    );
    const data = await res.json();
    if (data.display_name) {
      return data.display_name;
    }
    // Fallback: build from address parts
    const a = data.address || {};
    const parts = [a.house_number, a.road, a.suburb, a.city || a.town, a.state].filter(Boolean);
    return parts.join(", ") || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

/* ──── Watermark: burn info onto photo canvas ──── */
export function watermarkCanvas(
  canvas: HTMLCanvasElement,
  info: {
    address: string;
    dateTime: string;
    employeeName: string;
    employeeCode: string;
    action: string; // "Vào ca" | "Ra ca"
  }
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  const padding = 12;
  const lineHeight = 18;
  const fontSize = 13;
  const boxHeight = padding * 2 + lineHeight * 3 + 4;

  // Semi-transparent dark background at bottom-left
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  const boxWidth = Math.min(w - 16, 380);
  const boxX = 8;
  const boxY = h - boxHeight - 8;

  // Rounded rect
  const radius = 10;
  ctx.beginPath();
  ctx.moveTo(boxX + radius, boxY);
  ctx.lineTo(boxX + boxWidth - radius, boxY);
  ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
  ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
  ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
  ctx.lineTo(boxX + radius, boxY + boxHeight);
  ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
  ctx.lineTo(boxX, boxY + radius);
  ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
  ctx.closePath();
  ctx.fill();

  // Text
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.textBaseline = "top";

  const textX = boxX + padding;
  let textY = boxY + padding;

  // Line 1: Address (truncate if too long)
  const maxChars = Math.floor((boxWidth - padding * 2) / (fontSize * 0.55));
  const addrText = info.address.length > maxChars
    ? "📍 " + info.address.slice(0, maxChars - 3) + "..."
    : "📍 " + info.address;
  ctx.fillText(addrText, textX, textY);
  textY += lineHeight;

  // Line 2: Date/Time
  ctx.fillText("🕐 " + info.dateTime, textX, textY);
  textY += lineHeight;

  // Line 3: Employee info
  ctx.fillText(`👤 ${info.employeeName} · ${info.employeeCode} · ${info.action}`, textX, textY);
}

/* ──── Capture frame from video + watermark → Blob ──── */
export function captureWatermarkedPhoto(
  video: HTMLVideoElement,
  info: {
    address: string;
    dateTime: string;
    employeeName: string;
    employeeCode: string;
    action: string;
  }
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) { resolve(null); return; }

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply watermark
    watermarkCanvas(canvas, info);

    // Export as JPEG blob
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
  });
}
