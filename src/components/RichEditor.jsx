import React, { useState, useEffect, useRef } from "react";
import { Icons } from "../assets/icons";
import MiniModal from "./MiniModal";

export default function RichEditor({ value, onChange, placeholder, autoFocus }) {
    const ref = useRef(null);
    const [modal, setModal] = useState(null); // 'img' | 'tbl' | 'lnk' | null
    const [imgUrl, setImgUrl] = useState("");
    const [tblR, setTblR] = useState(3);
    const [tblC, setTblC] = useState(3);
    const [lnkU, setLnkU] = useState("");
    const [lnkT, setLnkT] = useState("");
    const init = useRef(false);

    useEffect(() => {
        if (ref.current && !init.current) {
            // Only set if not empty to avoid overwriting if there's already something (unlikely on mount)
            if (value) ref.current.innerHTML = value;
            init.current = true;
            if (autoFocus) setTimeout(() => ref.current?.focus(), 50);
        }
    }, []);

    // This effect might be fighting with user input if value is not updated fast enough?
    // RichEditor is uncontrolled for innerHTML but updates via onChange.
    // If parent updates value, this effect runs.
    // If the cursor is inside, resetting innerHTML resets cursor position!
    // We should only update if the new value is significantly different and we are not focused, 
    // OR if the value is being cleared (e.g. after add).
    useEffect(() => {
        if (ref.current && init.current) {
            if (value === "" && ref.current.innerHTML !== "") {
                ref.current.innerHTML = "";
            }
            // If value changed externally (e.g. edit mode loaded), we might want to update.
            // But for "Add" flow, value starts empty, we type (onChange updates value), this effect sees new value.
            // If we set innerHTML, cursor jumps.
            // So we partially handled it with `value === ""` check, but let's be safer.
        }
    }, [value]);

    const ex = (cmd, val = null) => { ref.current.focus(); document.execCommand(cmd, false, val); fire(); };
    const fire = () => { if (ref.current) onChange(ref.current.innerHTML); };

    const insImg = () => {
        if (!imgUrl.trim()) return;
        ref.current.focus();
        document.execCommand("insertHTML", false, `<img src="${imgUrl}" style="max-width:100%;border-radius:8px;margin:8px 0;display:block;" />`);
        setImgUrl(""); setModal(null); fire();
    };

    const insTbl = () => {
        ref.current.focus();
        let h = `<table style="width:100%;border-collapse:collapse;margin:8px 0;"><thead><tr>`;
        for (let c = 0; c < tblC; c++) h += `<th style="border:1px solid #3a3a4a;padding:8px 10px;background:#1e1e28;text-align:left;font-size:13px;">Spalte ${c + 1}</th>`;
        h += `</tr></thead><tbody>`;
        for (let r = 0; r < tblR - 1; r++) { h += `<tr>`; for (let c = 0; c < tblC; c++) h += `<td style="border:1px solid #3a3a4a;padding:8px 10px;font-size:13px;">&nbsp;</td>`; h += `</tr>`; }
        h += `</tbody></table><p><br></p>`;
        document.execCommand("insertHTML", false, h);
        setModal(null); fire();
    };

    const insLnk = () => {
        if (!lnkU.trim()) return;
        ref.current.focus();
        document.execCommand("insertHTML", false, `<a href="${lnkU}" target="_blank" style="color:#a78bfa;text-decoration:underline;">${lnkT.trim() || lnkU}</a>`);
        setLnkU(""); setLnkT(""); setModal(null); fire();
    };

    const onPaste = (e) => {
        for (const item of e.clipboardData.items) {
            if (item.type.startsWith("image/")) {
                e.preventDefault();
                const reader = new FileReader();
                reader.onload = (ev) => { document.execCommand("insertHTML", false, `<img src="${ev.target.result}" style="max-width:100%;border-radius:8px;margin:8px 0;display:block;" />`); fire(); };
                reader.readAsDataURL(item.getAsFile());
                return;
            }
        }
    };

    const onDrop = (e) => {
        const f = e.dataTransfer.files;
        if (f.length > 0 && f[0].type.startsWith("image/")) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = (ev) => { ref.current.focus(); document.execCommand("insertHTML", false, `<img src="${ev.target.result}" style="max-width:100%;border-radius:8px;margin:8px 0;display:block;" />`); fire(); };
            reader.readAsDataURL(f[0]);
        }
    };

    const TB = ({ icon, fn, title }) => <button type="button" className="tb-btn" onMouseDown={(e) => { e.preventDefault(); fn(); }} title={title}>{icon}</button>;

    return (
        <div className="re-wrap">
            <div className="toolbar">
                <TB icon={Icons.undo} fn={() => ex("undo")} title="Rückgängig" />
                <TB icon={Icons.redo} fn={() => ex("redo")} title="Wiederholen" />
                <div className="tb-sep" />
                <TB icon={Icons.h} fn={() => ex("formatBlock", "h3")} title="Überschrift" />
                <TB icon={Icons.bold} fn={() => ex("bold")} title="Fett" />
                <TB icon={Icons.italic} fn={() => ex("italic")} title="Kursiv" />
                <TB icon={Icons.uline} fn={() => ex("underline")} title="Unterstrichen" />
                <TB icon={Icons.strike} fn={() => ex("strikeThrough")} title="Durchgestrichen" />
                <TB icon={Icons.hi} fn={() => ex("backColor", "#a78bfa33")} title="Hervorheben" />
                <div className="tb-sep" />
                <TB icon={Icons.ul} fn={() => ex("insertUnorderedList")} title="Aufzählung" />
                <TB icon={Icons.ol} fn={() => ex("insertOrderedList")} title="Nummerierung" />
                <TB icon={Icons.quote} fn={() => ex("formatBlock", "blockquote")} title="Zitat" />
                <TB icon={Icons.code} fn={() => { ref.current.focus(); document.execCommand("insertHTML", false, `<pre style="background:#1a1a24;border:1px solid #2a2a35;border-radius:8px;padding:12px;font-family:monospace;font-size:13px;margin:8px 0;"><code>Code...</code></pre><p><br></p>`); fire(); }} title="Code" />
                <TB icon={Icons.hr} fn={() => ex("insertHorizontalRule")} title="Trennlinie" />
                <div className="tb-sep" />
                <TB icon={Icons.lnk} fn={() => setModal("lnk")} title="Link" />
                <TB icon={Icons.img} fn={() => setModal("img")} title="Bild" />
                <TB icon={Icons.tbl} fn={() => setModal("tbl")} title="Tabelle" />
            </div>
            <div ref={ref} className="re-body" contentEditable onInput={fire} onPaste={onPaste} onDrop={onDrop} data-placeholder={placeholder} suppressContentEditableWarning data-testid="rich-editor" />

            {modal === "img" && <MiniModal title="Bild einfügen" onClose={() => setModal(null)}>
                <p className="mhint">URL eingeben oder Bild per Strg+V / Drag&Drop direkt einfügen</p>
                <input className="input" placeholder="https://example.com/bild.png" value={imgUrl} onChange={e => setImgUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && insImg()} autoFocus />
                <div className="btn-row" style={{ marginTop: 12, justifyContent: "flex-end" }}><button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Abbrechen</button><button className="btn btn-primary btn-sm" onClick={insImg}>Einfügen</button></div>
            </MiniModal>}

            {modal === "tbl" && <MiniModal title="Tabelle einfügen" onClose={() => setModal(null)}>
                <div style={{ display: "flex", gap: 12, margin: "16px 0" }}>
                    <div className="field" style={{ flex: 1, marginBottom: 0 }}><label>Zeilen</label><input className="input" type="number" min="2" max="20" value={tblR} onChange={e => setTblR(+e.target.value || 2)} /></div>
                    <div className="field" style={{ flex: 1, marginBottom: 0 }}><label>Spalten</label><input className="input" type="number" min="1" max="10" value={tblC} onChange={e => setTblC(+e.target.value || 2)} /></div>
                </div>
                <div className="btn-row" style={{ justifyContent: "flex-end" }}><button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Abbrechen</button><button className="btn btn-primary btn-sm" onClick={insTbl}>Einfügen</button></div>
            </MiniModal>}

            {modal === "lnk" && <MiniModal title="Link einfügen" onClose={() => setModal(null)}>
                <div className="field"><label>URL</label><input className="input" placeholder="https://..." value={lnkU} onChange={e => setLnkU(e.target.value)} autoFocus /></div>
                <div className="field"><label>Text (optional)</label><input className="input" placeholder="Linktext" value={lnkT} onChange={e => setLnkT(e.target.value)} onKeyDown={e => e.key === "Enter" && insLnk()} /></div>
                <div className="btn-row" style={{ justifyContent: "flex-end" }}><button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Abbrechen</button><button className="btn btn-primary btn-sm" onClick={insLnk}>Einfügen</button></div>
            </MiniModal>}
        </div>
    );
}
