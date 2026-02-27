export interface UploadGuardOptions {
    maxBytes?: number;
}

const DEFAULT_MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 15 * 1024 * 1024);
const ALLOWED_MIME = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
]);

export function validateUploadedImage(
    file: File | null | undefined,
    options: UploadGuardOptions = {}
): { ok: true } | { ok: false; error: string } {
    if (!file) return { ok: false, error: 'Gorsel gerekli' };
    if (!(file instanceof File)) return { ok: false, error: 'Gecerli bir gorsel yukleyin' };

    const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
    if (!file.type || !file.type.startsWith('image/')) {
        return { ok: false, error: 'Desteklenmeyen dosya formati. Lutfen bir gorsel yukleyin.' };
    }
    if (!ALLOWED_MIME.has(file.type.toLowerCase())) {
        return { ok: false, error: 'Bu gorsel formati desteklenmiyor. JPEG/PNG/WEBP kullanin.' };
    }
    if (file.size <= 0) {
        return { ok: false, error: 'Bos dosya yuklenemez.' };
    }
    if (file.size > maxBytes) {
        return { ok: false, error: `Dosya boyutu cok buyuk (max ${Math.floor(maxBytes / (1024 * 1024))}MB).` };
    }
    return { ok: true };
}

export function clampText(input: string, maxLength: number): string {
    const text = String(input || '').trim();
    return text.length > maxLength ? text.slice(0, maxLength) : text;
}
