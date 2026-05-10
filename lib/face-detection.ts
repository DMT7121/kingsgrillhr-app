/**
 * Face Detection & Recognition wrapper using @vladmandic/face-api
 * Runs 100% client-side (TensorFlow.js / WebAssembly)
 */

let faceapi: any = null;
let modelsLoaded = false;

/* ──── Load face-api + models ──── */
export async function loadFaceModels(): Promise<boolean> {
  if (modelsLoaded) return true;
  try {
    // Dynamic import to avoid SSR issues
    faceapi = await import("@vladmandic/face-api");

    const MODEL_URL = "/models";
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    return true;
  } catch (err) {
    console.error("Failed to load face models:", err);
    return false;
  }
}

/* ──── Detect face from video element ──── */
export async function detectFace(
  video: HTMLVideoElement
): Promise<{ descriptor: Float32Array; score: number } | null> {
  if (!faceapi || !modelsLoaded) return null;
  try {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
      .withFaceLandmarks(true) // useTinyModel
      .withFaceDescriptor();

    if (!detection) return null;

    return {
      descriptor: detection.descriptor,
      score: detection.detection.score,
    };
  } catch {
    return null;
  }
}

/* ──── Compare two descriptors (Euclidean distance) ──── */
export function compareFaces(
  descriptor1: Float32Array,
  descriptor2: Float32Array | number[]
): number {
  const d2 = descriptor2 instanceof Float32Array ? descriptor2 : new Float32Array(descriptor2);
  if (descriptor1.length !== d2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    sum += (descriptor1[i] - d2[i]) ** 2;
  }
  return Math.sqrt(sum);
}

/* ──── Match against stored descriptors ──── */
export interface FaceMatchResult {
  matched: boolean;
  employeeId: string | null;
  employeeName: string | null;
  distance: number;
  confidence: number; // 0-100%
}

export function matchFace(
  liveDescriptor: Float32Array,
  storedFaces: { employeeId: string; employeeName: string; descriptor: number[] }[],
  threshold: number = 0.5
): FaceMatchResult {
  let bestMatch: FaceMatchResult = {
    matched: false,
    employeeId: null,
    employeeName: null,
    distance: Infinity,
    confidence: 0,
  };

  for (const stored of storedFaces) {
    const dist = compareFaces(liveDescriptor, stored.descriptor);
    if (dist < bestMatch.distance) {
      bestMatch = {
        matched: dist < threshold,
        employeeId: stored.employeeId,
        employeeName: stored.employeeName,
        distance: dist,
        confidence: Math.max(0, Math.round((1 - dist / threshold) * 100)),
      };
    }
  }

  return bestMatch;
}

/* ──── Extract descriptor for registration ──── */
export async function extractDescriptor(
  video: HTMLVideoElement
): Promise<Float32Array | null> {
  const result = await detectFace(video);
  return result?.descriptor ?? null;
}
