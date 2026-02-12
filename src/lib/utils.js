export const strip = (h) => {
    if (!h) return "";
    const d = document.createElement("div");
    d.innerHTML = h;
    return d.textContent || "";
};

export const hasMed = (h) => h && (h.includes("<img") || h.includes("<table"));
