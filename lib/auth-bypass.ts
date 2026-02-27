const OWNER_BYPASS_PHONE =
    (process.env.OWNER_BYPASS_PHONE || '5322168292').replace(/\D/g, '');

export function isOwnerBypassPhone(phoneRaw: string): boolean {
    const phone = String(phoneRaw || '').replace(/\D/g, '');
    return phone.length === 10 && phone === OWNER_BYPASS_PHONE;
}

