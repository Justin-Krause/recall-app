export const SM2 = {
    make: (front, back) => ({
        id: crypto.randomUUID(),
        front,
        back,
        reps: 0,
        ef: 2.5,
        ivl: 0,
        next: Date.now(),
        created: Date.now(),
        last: null
    }),
    review(c, q) {
        let { reps, ef, ivl } = c;
        const now = Date.now();
        if (q >= 3) {
            ivl = reps === 0 ? 1 : reps === 1 ? 6 : Math.round(ivl * ef);
            reps++;
        } else {
            reps = 0;
            ivl = 1;
        }
        ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
        return { ...c, reps, ef, ivl, next: now + ivl * 864e5, last: now };
    },
    due: (c) => Date.now() >= c.next,
};
