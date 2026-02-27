export function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
    if (typeof dataUrl !== 'string' || dataUrl.length < 16) {
        throw new Error('Gecersiz gorsel data URL formati.');
    }
    if (!dataUrl.startsWith('data:')) {
        throw new Error('Gecersiz gorsel data URL formati.');
    }
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex <= 5 || commaIndex >= dataUrl.length - 1) {
        throw new Error('Gecersiz gorsel data URL formati.');
    }
    const header = dataUrl.slice(5, commaIndex);
    const base64 = dataUrl.slice(commaIndex + 1);
    const semicolonIndex = header.indexOf(';');
    const mimeType = semicolonIndex > 0 ? header.slice(0, semicolonIndex) : header;
    if (!mimeType || !header.includes(';base64')) {
        throw new Error('Gecersiz gorsel data URL formati.');
    }
    return { mimeType, base64 };
}
