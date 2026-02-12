export const Storage = {
    async load(k, fb) {
        try {
            const r = await window.storage.get(k);
            return r ? JSON.parse(r.value) : fb;
        } catch {
            return fb;
        }
    },
    async save(k, d) {
        try {
            await window.storage.set(k, JSON.stringify(d));
        } catch { }
    },
};
