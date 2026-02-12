import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════
   SM-2 SPACED REPETITION
   ═══════════════════════════════════════════ */
const SM2 = {
  make: (front, back) => ({ id: crypto.randomUUID(), front, back, reps: 0, ef: 2.5, ivl: 0, next: Date.now(), created: Date.now(), last: null }),
  review(c, q) {
    let { reps, ef, ivl } = c; const now = Date.now();
    if (q >= 3) { ivl = reps === 0 ? 1 : reps === 1 ? 6 : Math.round(ivl * ef); reps++; } else { reps = 0; ivl = 1; }
    ef = Math.max(1.3, ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    return { ...c, reps, ef, ivl, next: now + ivl * 864e5, last: now };
  },
  due: (c) => Date.now() >= c.next,
};

/* ═══════════════════════════════════════════
   STORAGE
   ═══════════════════════════════════════════ */
const S = {
  async load(k, fb) { try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : fb; } catch { return fb; } },
  async save(k, d) { try { await window.storage.set(k, JSON.stringify(d)); } catch {} },
};

const strip = (h) => { if (!h) return ""; const d = document.createElement("div"); d.innerHTML = h; return d.textContent || ""; };
const hasMed = (h) => h && (h.includes("<img") || h.includes("<table"));

const QL = [
  { q: 0, l: "Vergessen", c: "#ef4444" }, { q: 1, l: "Schwer", c: "#f97316" },
  { q: 3, l: "Gut", c: "#22c55e" }, { q: 4, l: "Einfach", c: "#3b82f6" }, { q: 5, l: "Perfekt", c: "#a855f7" },
];
const DC = ["#a855f7","#3b82f6","#22c55e","#f97316","#ef4444","#ec4899","#14b8a6","#eab308"];

/* ═══════════════════════════════════════════
   SVG ICONS
   ═══════════════════════════════════════════ */
const sv = (d, w=16) => <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
const I = {
  plus: sv(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>, 18),
  back: sv(<polyline points="15 18 9 12 15 6"/>, 18),
  brain: sv(<path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.5.5 2.8 1.3 3.8A5.5 5.5 0 0 0 4 15c0 3 2.5 5.5 5.5 5.5.6 0 1.1-.1 1.5-.2V22h2v-1.7c.4.1.9.2 1.5.2 3 0 5.5-2.5 5.5-5.5 0-1.4-.5-2.7-1.3-3.7.8-1 1.3-2.3 1.3-3.8C20 4.5 17.5 2 14.5 2c-.6 0-1.2.1-1.7.3h-.1C12.2 2.1 11.6 2 11 2h-.2C10.4 2 9.9 2 9.5 2z"/>, 28),
  check: sv(<polyline points="20 6 9 17 4 12"/>, 20),
  edit: sv(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>),
  trash: sv(<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>),
  imp: sv(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>),
  bold: sv(<><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></>),
  italic: sv(<><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></>),
  uline: sv(<><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></>),
  strike: sv(<><line x1="4" y1="12" x2="20" y2="12"/><path d="M17.5 7.5c0-2-1.5-3.5-5.5-3.5S6.5 5.5 6.5 7.5c0 4 11 4 11 8 0 2-1.5 3.5-5.5 3.5S6.5 17 6.5 16"/></>),
  code: sv(<><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></>),
  ul: sv(<><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="2" fill="currentColor" stroke="none"/></>),
  ol: sv(<><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" fontSize="8" fill="currentColor" stroke="none">1</text><text x="2" y="14" fontSize="8" fill="currentColor" stroke="none">2</text><text x="2" y="20" fontSize="8" fill="currentColor" stroke="none">3</text></>),
  h: sv(<><path d="M4 4v16"/><path d="M20 4v16"/><path d="M4 12h16"/></>),
  img: sv(<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>),
  tbl: sv(<><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></>),
  hi: sv(<><path d="M12 20h9"/><path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z"/></>),
  lnk: sv(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>),
  undo: sv(<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></>),
  redo: sv(<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></>),
  hr: sv(<line x1="3" y1="12" x2="21" y2="12"/>),
  quote: sv(<><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></>),
};

/* ═══════════════════════════════════════════
   RICH TEXT EDITOR
   ═══════════════════════════════════════════ */
function RichEditor({ value, onChange, placeholder, autoFocus }) {
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
      ref.current.innerHTML = value || "";
      init.current = true;
      if (autoFocus) setTimeout(() => ref.current?.focus(), 50);
    }
  }, []);

  useEffect(() => { if (ref.current && value === "" && init.current) ref.current.innerHTML = ""; }, [value]);

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
    for (let c = 0; c < tblC; c++) h += `<th style="border:1px solid #3a3a4a;padding:8px 10px;background:#1e1e28;text-align:left;font-size:13px;">Spalte ${c+1}</th>`;
    h += `</tr></thead><tbody>`;
    for (let r = 0; r < tblR - 1; r++) { h += `<tr>`; for (let c = 0; c < tblC; c++) h += `<td style="border:1px solid #3a3a4a;padding:8px 10px;font-size:13px;">&nbsp;</td>`; h += `</tr>`; }
    h += `</tbody></table><p><br></p>`;
    document.execCommand("insertHTML", false, h);
    setModal(null); fire();
  };

  const insLnk = () => {
    if (!lnkU.trim()) return;
    ref.current.focus();
    document.execCommand("insertHTML", false, `<a href="${lnkU}" target="_blank" style="color:#a78bfa;text-decoration:underline;">${lnkT.trim()||lnkU}</a>`);
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
        <TB icon={I.undo} fn={() => ex("undo")} title="Rückgängig" />
        <TB icon={I.redo} fn={() => ex("redo")} title="Wiederholen" />
        <div className="tb-sep" />
        <TB icon={I.h} fn={() => ex("formatBlock","h3")} title="Überschrift" />
        <TB icon={I.bold} fn={() => ex("bold")} title="Fett" />
        <TB icon={I.italic} fn={() => ex("italic")} title="Kursiv" />
        <TB icon={I.uline} fn={() => ex("underline")} title="Unterstrichen" />
        <TB icon={I.strike} fn={() => ex("strikeThrough")} title="Durchgestrichen" />
        <TB icon={I.hi} fn={() => ex("backColor","#a78bfa33")} title="Hervorheben" />
        <div className="tb-sep" />
        <TB icon={I.ul} fn={() => ex("insertUnorderedList")} title="Aufzählung" />
        <TB icon={I.ol} fn={() => ex("insertOrderedList")} title="Nummerierung" />
        <TB icon={I.quote} fn={() => ex("formatBlock","blockquote")} title="Zitat" />
        <TB icon={I.code} fn={() => { ref.current.focus(); document.execCommand("insertHTML",false,`<pre style="background:#1a1a24;border:1px solid #2a2a35;border-radius:8px;padding:12px;font-family:monospace;font-size:13px;margin:8px 0;"><code>Code...</code></pre><p><br></p>`); fire(); }} title="Code" />
        <TB icon={I.hr} fn={() => ex("insertHorizontalRule")} title="Trennlinie" />
        <div className="tb-sep" />
        <TB icon={I.lnk} fn={() => setModal("lnk")} title="Link" />
        <TB icon={I.img} fn={() => setModal("img")} title="Bild" />
        <TB icon={I.tbl} fn={() => setModal("tbl")} title="Tabelle" />
      </div>
      <div ref={ref} className="re-body" contentEditable onInput={fire} onPaste={onPaste} onDrop={onDrop} data-placeholder={placeholder} suppressContentEditableWarning />

      {modal === "img" && <MiniModal title="Bild einfügen" onClose={() => setModal(null)}>
        <p className="mhint">URL eingeben oder Bild per Strg+V / Drag&Drop direkt einfügen</p>
        <input className="input" placeholder="https://example.com/bild.png" value={imgUrl} onChange={e => setImgUrl(e.target.value)} onKeyDown={e => e.key==="Enter"&&insImg()} autoFocus />
        <div className="btn-row" style={{marginTop:12,justifyContent:"flex-end"}}><button className="btn btn-secondary btn-sm" onClick={()=>setModal(null)}>Abbrechen</button><button className="btn btn-primary btn-sm" onClick={insImg}>Einfügen</button></div>
      </MiniModal>}

      {modal === "tbl" && <MiniModal title="Tabelle einfügen" onClose={() => setModal(null)}>
        <div style={{display:"flex",gap:12,margin:"16px 0"}}>
          <div className="field" style={{flex:1,marginBottom:0}}><label>Zeilen</label><input className="input" type="number" min="2" max="20" value={tblR} onChange={e=>setTblR(+e.target.value||2)} /></div>
          <div className="field" style={{flex:1,marginBottom:0}}><label>Spalten</label><input className="input" type="number" min="1" max="10" value={tblC} onChange={e=>setTblC(+e.target.value||2)} /></div>
        </div>
        <div className="btn-row" style={{justifyContent:"flex-end"}}><button className="btn btn-secondary btn-sm" onClick={()=>setModal(null)}>Abbrechen</button><button className="btn btn-primary btn-sm" onClick={insTbl}>Einfügen</button></div>
      </MiniModal>}

      {modal === "lnk" && <MiniModal title="Link einfügen" onClose={() => setModal(null)}>
        <div className="field"><label>URL</label><input className="input" placeholder="https://..." value={lnkU} onChange={e=>setLnkU(e.target.value)} autoFocus /></div>
        <div className="field"><label>Text (optional)</label><input className="input" placeholder="Linktext" value={lnkT} onChange={e=>setLnkT(e.target.value)} onKeyDown={e=>e.key==="Enter"&&insLnk()} /></div>
        <div className="btn-row" style={{justifyContent:"flex-end"}}><button className="btn btn-secondary btn-sm" onClick={()=>setModal(null)}>Abbrechen</button><button className="btn btn-primary btn-sm" onClick={insLnk}>Einfügen</button></div>
      </MiniModal>}
    </div>
  );
}

function MiniModal({ title, children, onClose }) {
  return (
    <div className="mm-overlay" onClick={onClose}>
      <div className="mm" onClick={e=>e.stopPropagation()}>
        <h4>{title}</h4>
        {children}
      </div>
    </div>
  );
}

function Html({ html, className }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function RecallApp() {
  const [decks, setDecks] = useState([]);
  const [view, setView] = useState("home");
  const [actDeck, setActDeck] = useState(null);
  const [queue, setQueue] = useState([]);
  const [ci, setCi] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sess, setSess] = useState({ rev: 0, ok: 0 });
  const [ndn, setNdn] = useState("");
  const [nf, setNf] = useState("");
  const [nb, setNb] = useState("");
  const [editCard, setEditCard] = useState(null);
  const [showND, setShowND] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      const saved = await S.load("recall-v3", null);
      if (saved) setDecks(saved);
      else {
        setDecks([{
          id: crypto.randomUUID(), name: "Beispiel-Deck", color: "#a855f7",
          cards: [
            SM2.make("<b>Mitochondrien</b>", `<p>Das <b>Kraftwerk der Zelle</b> — produziert ATP.</p><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Mitochondria%2C_mammalian_lung_-_TEM.jpg/220px-Mitochondria%2C_mammalian_lung_-_TEM.jpg" style="max-width:100%;border-radius:8px;margin:8px 0;display:block;" />`),
            SM2.make("<h3>Periodensystem</h3><p>Erste 3 Elemente?</p>", `<table style="width:100%;border-collapse:collapse;margin:8px 0;"><thead><tr><th style="border:1px solid #3a3a4a;padding:8px;background:#1e1e28;">Nr</th><th style="border:1px solid #3a3a4a;padding:8px;background:#1e1e28;">Symbol</th><th style="border:1px solid #3a3a4a;padding:8px;background:#1e1e28;">Name</th></tr></thead><tbody><tr><td style="border:1px solid #3a3a4a;padding:8px;">1</td><td style="border:1px solid #3a3a4a;padding:8px;">H</td><td style="border:1px solid #3a3a4a;padding:8px;">Wasserstoff</td></tr><tr><td style="border:1px solid #3a3a4a;padding:8px;">2</td><td style="border:1px solid #3a3a4a;padding:8px;">He</td><td style="border:1px solid #3a3a4a;padding:8px;">Helium</td></tr><tr><td style="border:1px solid #3a3a4a;padding:8px;">3</td><td style="border:1px solid #3a3a4a;padding:8px;">Li</td><td style="border:1px solid #3a3a4a;padding:8px;">Lithium</td></tr></tbody></table>`),
            SM2.make("Was ist <i>Photosynthese</i>?", `<p>Umwandlung von <mark style="background:#a78bfa33;">Lichtenergie</mark> in chemische Energie.</p><blockquote style="border-left:3px solid #a78bfa;padding:8px 16px;margin:8px 0;color:#9896a8;">6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂</blockquote>`),
          ],
        }]);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) S.save("recall-v3", decks); }, [decks, loaded]);

  const toast_ = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };
  const deck = decks.find(d => d.id === actDeck);
  const due = (d) => d.cards.filter(SM2.due);
  const nav = setView;

  const createDeck = () => { if(!ndn.trim())return; setDecks([...decks,{id:crypto.randomUUID(),name:ndn.trim(),color:DC[decks.length%DC.length],cards:[]}]); setNdn(""); setShowND(false); toast_("Deck erstellt!"); };
  const delDeck = (id) => { setDecks(decks.filter(d=>d.id!==id)); nav("home"); toast_("Deck gelöscht"); };
  const addCard = () => { if(!strip(nf).trim()&&!nf.includes("<img"))return; setDecks(decks.map(d=>d.id===actDeck?{...d,cards:[...d.cards,SM2.make(nf,nb)]}:d)); setNf(""); setNb(""); toast_("Karte hinzugefügt!"); };
  const updCard = (cid,f,b) => { setDecks(decks.map(d=>d.id===actDeck?{...d,cards:d.cards.map(c=>c.id===cid?{...c,front:f,back:b}:c)}:d)); setEditCard(null); toast_("Gespeichert"); };
  const delCard = (cid) => { setDecks(decks.map(d=>d.id===actDeck?{...d,cards:d.cards.filter(c=>c.id!==cid)}:d)); toast_("Karte gelöscht"); };

  const startStudy = () => { if(!deck)return; const d=due(deck); if(!d.length)return; setQueue(d.sort(()=>Math.random()-.5)); setCi(0); setFlipped(false); setSess({rev:0,ok:0}); nav("study"); };
  const answer = (q) => {
    const card=queue[ci]; const upd=SM2.review(card,q);
    setDecks(decks.map(d=>d.id===actDeck?{...d,cards:d.cards.map(c=>c.id===card.id?upd:c)}:d));
    setSess(s=>({rev:s.rev+1,ok:q>=3?s.ok+1:s.ok}));
    if(q<3) setQueue(qq=>[...qq,card]);
    if(ci+1<queue.length){setFlipped(false);setCi(i=>i+1);} else nav("stats");
  };

  const ivlLabel = (card,q) => { const p=SM2.review({...card},q); if(p.ivl<=1)return"~1T"; if(p.ivl<30)return`~${p.ivl}T`; if(p.ivl<365)return`~${Math.round(p.ivl/30)}M`; return`~${(p.ivl/365).toFixed(1)}J`; };

  const handleImport = () => {
    const t=prompt("Karten (Zeile: Vorderseite;Rückseite oder Tab-getrennt):"); if(!t)return;
    const nc=t.trim().split("\n").map(l=>{const s=l.includes("\t")?"\t":";";const[f,b]=l.split(s).map(x=>x.trim());return f&&b?SM2.make(f,b):null;}).filter(Boolean);
    if(nc.length){setDecks(decks.map(d=>d.id===actDeck?{...d,cards:[...d.cards,...nc]}:d));toast_(`${nc.length} importiert!`);}
  };

  useEffect(() => {
    const h = (e) => {
      if(view!=="study")return;
      if(e.code==="Space"&&!flipped){e.preventDefault();setFlipped(true);}
      if(flipped){if(e.key==="1")answer(0);if(e.key==="2")answer(1);if(e.key==="3")answer(3);if(e.key==="4")answer(4);if(e.key==="5")answer(5);}
    };
    window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h);
  }, [view,flipped,ci,queue]);

  if(!loaded) return null;

  /* ═══ VIEWS ═══ */
  const Home = () => {
    const td=decks.reduce((s,d)=>s+due(d).length,0), tc=decks.reduce((s,d)=>s+d.cards.length,0);
    return <>
      <div className="hdr"><div className="logo">{I.brain}</div><div><h1>Recall</h1><div className="sub">{tc} Karten · {td} fällig</div></div></div>
      <div className="stitle"><h2>Deine Decks</h2><button className="btn bp btn-sm" onClick={()=>setShowND(true)}>{I.plus} Neues Deck</button></div>
      <div className="dg">{decks.map(d=>{const du=due(d).length;return <div key={d.id} className="di" onClick={()=>{setActDeck(d.id);nav("deck");}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:d.color,borderRadius:"14px 0 0 14px"}}/>
        {du>0&&<div className="dub">{du} fällig</div>}
        <div className="dn">{d.name}</div>
        <div className="dm"><span>{d.cards.length} Karten</span><span>·</span><span>{d.cards.filter(c=>c.reps>0).length} gelernt</span></div>
      </div>})}</div>
      {decks.length===0&&<div className="empty"><p>Erstelle dein erstes Deck!</p></div>}
      {showND&&<div className="mo" onClick={()=>setShowND(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <h3>Neues Deck</h3>
        <div className="field"><label>Name</label><input className="input" placeholder="z.B. Spanisch" value={ndn} onChange={e=>setNdn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createDeck()} autoFocus/></div>
        <div className="btn-row" style={{justifyContent:"flex-end",marginTop:16}}><button className="btn bs btn-sm" onClick={()=>setShowND(false)}>Abbrechen</button><button className="btn bp btn-sm" onClick={createDeck}>Erstellen</button></div>
      </div></div>}
    </>;
  };

  const Deck = () => {
    if(!deck) return null; const du=due(deck);
    return <>
      <button className="bbk" onClick={()=>nav("home")}>{I.back} Zurück</button>
      <div style={{margin:"24px 0"}}><h1 style={{fontSize:26,fontWeight:700}}>{deck.name}</h1>
        <p style={{color:"var(--t3)",marginTop:6,fontSize:14}}>{deck.cards.length} Karten · {du.length} fällig</p></div>
      <div className="btn-row" style={{marginBottom:28}}>
        <button className="btn bp" onClick={startStudy} disabled={!du.length} style={{opacity:du.length?1:.4}}>{I.brain} Lernen ({du.length})</button>
        <button className="btn bs" onClick={()=>nav("add")}>{I.plus} Karte</button>
        <button className="btn bg btn-sm" onClick={handleImport} title="Import">{I.imp}</button>
      </div>
      {du.length===0&&deck.cards.length>0&&<div className="sc" style={{marginBottom:20}}><div style={{color:"var(--ok)",marginBottom:8}}>{I.check}</div><p style={{fontWeight:600}}>Alles erledigt!</p><p style={{color:"var(--t3)",fontSize:13,marginTop:4}}>Komm später wieder.</p></div>}
      <div className="stitle"><h2>Alle Karten ({deck.cards.length})</h2></div>
      {deck.cards.map(c=><div key={c.id} className="cli">
        <div className="ct"><span className="cf">{strip(c.front)}</span><span className="csep">→</span><span className="cb">{strip(c.back)}</span></div>
        {(hasMed(c.front)||hasMed(c.back))&&<span className="cm">📎</span>}
        <div className="ca"><button className="ib" onClick={()=>{setEditCard(c);nav("edit");}}>{I.edit}</button><button className="ib danger" onClick={()=>delCard(c.id)}>{I.trash}</button></div>
      </div>)}
      {!deck.cards.length&&<div className="empty"><p>Noch keine Karten.</p></div>}
      <div style={{marginTop:32,borderTop:"1px solid var(--bd)",paddingTop:20}}><button className="btn bg bd btn-sm" onClick={()=>{if(confirm("Deck löschen?"))delDeck(deck.id);}}>{I.trash} Deck löschen</button></div>
    </>;
  };

  const Add = () => <>
    <button className="bbk" onClick={()=>nav("deck")}>{I.back} Zurück</button>
    <h2 style={{fontSize:22,fontWeight:700,margin:"24px 0 20px"}}>Neue Karte</h2>
    <div className="field"><label>Vorderseite</label><RichEditor value={nf} onChange={setNf} placeholder="Frage, Begriff, Bild..." autoFocus/></div>
    <div className="field"><label>Rückseite</label><RichEditor value={nb} onChange={setNb} placeholder="Antwort, Tabelle, Erklärung..."/></div>
    <button className="btn bp" onClick={addCard}>{I.plus} Hinzufügen</button>
  </>;

  const Edit = () => {
    const [f,sF]=useState(editCard?.front||""); const [b,sB]=useState(editCard?.back||"");
    if(!editCard) return null;
    return <>
      <button className="bbk" onClick={()=>nav("deck")}>{I.back} Zurück</button>
      <h2 style={{fontSize:22,fontWeight:700,margin:"24px 0 20px"}}>Bearbeiten</h2>
      <div className="field"><label>Vorderseite</label><RichEditor value={f} onChange={sF} placeholder="Vorderseite..." autoFocus/></div>
      <div className="field"><label>Rückseite</label><RichEditor value={b} onChange={sB} placeholder="Rückseite..."/></div>
      <button className="btn bp" onClick={()=>updCard(editCard.id,f,b)}>{I.check} Speichern</button>
    </>;
  };

  const Study = () => {
    const card=queue[ci]; if(!card)return null;
    const prog=(ci/queue.length)*100;
    return <>
      <button className="bbk" onClick={()=>nav("deck")}>{I.back} Beenden</button>
      <div style={{marginTop:20}}><div className="pbar"><div className="pfill" style={{width:`${prog}%`}}/></div><div className="ptxt">{ci+1}/{queue.length}</div></div>
      <div className="ccont" onClick={()=>!flipped&&setFlipped(true)}>
        <div className={`fc ${flipped?"flipped":""}`}>
          <div className="ff ffr"><div className="flbl">Vorderseite</div><Html html={card.front} className="ch"/><div className="fhint">Klicken / Leertaste</div></div>
          <div className="ff fbk"><div className="flbl">Rückseite</div><Html html={card.back} className="ch"/></div>
        </div>
      </div>
      {flipped&&<div className="abtns">{QL.map(({q,l,c})=><button key={q} className="abtn" onClick={()=>answer(q)} style={{borderColor:c+"33"}}>
        <span className="ql" style={{color:c}}>{l}</span><span className="qs">{ivlLabel(card,q)}</span><span className="qk">{q<=1?q+1:q}</span>
      </button>)}</div>}
    </>;
  };

  const Stats = () => {
    const pct=sess.rev>0?Math.round(sess.ok/sess.rev*100):0;
    return <>
      <div style={{textAlign:"center",paddingTop:40}}><h2 style={{fontSize:24,fontWeight:700}}>Sitzung fertig!</h2><p style={{color:"var(--t3)",fontSize:14}}>Gut gemacht!</p></div>
      <div className="sc"><div className="sbig">{pct}%</div><p style={{color:"var(--t2)",marginTop:8}}>Erfolgsrate</p>
        <div className="sgrid"><div className="sb"><div className="sv">{sess.rev}</div><div className="sl">Wiederholt</div></div><div className="sb"><div className="sv" style={{color:"var(--ok)"}}>{sess.ok}</div><div className="sl">Richtig</div></div></div>
      </div>
      <div className="btn-row" style={{justifyContent:"center"}}><button className="btn bp" onClick={()=>nav("deck")}>Zum Deck</button><button className="btn bs" onClick={()=>nav("home")}>Start</button></div>
    </>;
  };

  return <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}
      :root{--bg:#0c0c0f;--sf:#16161b;--sf2:#1e1e25;--sf3:#26262f;--bd:#2a2a35;--tx:#e8e6f0;--t2:#9896a8;--t3:#5c5a6e;--ac:#a78bfa;--ac2:#7c3aed;--dn:#ef4444;--ok:#22c55e;--r:14px;--rs:10px}
      body{background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--tx);-webkit-font-smoothing:antialiased}
      .app{max-width:640px;margin:0 auto;min-height:100vh;padding:24px 20px 100px}

      .hdr{display:flex;align-items:center;gap:12px;margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid var(--bd)}
      .hdr .logo{width:44px;height:44px;background:linear-gradient(135deg,var(--ac),var(--ac2));border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;flex-shrink:0}
      .hdr h1{font-size:22px;font-weight:700;letter-spacing:-0.5px} .hdr .sub{font-size:12px;color:var(--t3)}

      .bbk{background:none;border:none;color:var(--t2);cursor:pointer;padding:8px;margin:-8px;border-radius:8px;transition:all .15s;display:flex;align-items:center;gap:6px;font-size:14px;font-family:inherit}
      .bbk:hover{color:var(--tx);background:var(--sf2)}

      .dg{display:flex;flex-direction:column;gap:12px}
      .di{background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);padding:20px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden}
      .di:hover{border-color:var(--t3);transform:translateY(-1px);box-shadow:0 8px 32px rgba(0,0,0,.3)}
      .dn{font-size:17px;font-weight:600;margin-bottom:8px} .dm{display:flex;gap:16px;font-size:13px;color:var(--t2)}
      .dub{background:var(--ac2);color:white;font-size:12px;font-weight:600;padding:2px 10px;border-radius:20px;position:absolute;top:20px;right:20px}

      .btn{display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:var(--rs);border:none;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s}
      .bp{background:linear-gradient(135deg,var(--ac),var(--ac2));color:white} .bp:hover{opacity:.9;transform:translateY(-1px)}
      .bs{background:var(--sf2);color:var(--tx);border:1px solid var(--bd)} .bs:hover{border-color:var(--t3)}
      .bg{background:none;color:var(--t2);padding:8px 12px} .bg:hover{color:var(--tx);background:var(--sf2)}
      .bd{color:var(--dn)} .btn-sm{padding:8px 14px;font-size:13px} .btn-row{display:flex;gap:8px;flex-wrap:wrap}

      .input{width:100%;background:var(--sf);border:1px solid var(--bd);border-radius:var(--rs);color:var(--tx);font-family:inherit;font-size:15px;padding:14px 16px;outline:none;transition:border .15s}
      .input:focus{border-color:var(--ac)} .input::placeholder{color:var(--t3)}
      .field{margin-bottom:14px} .field label{display:block;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--t3);margin-bottom:8px}

      /* Rich Editor */
      .re-wrap{border:1px solid var(--bd);border-radius:var(--rs);overflow:hidden;background:var(--sf);transition:border .15s}
      .re-wrap:focus-within{border-color:var(--ac)}
      .toolbar{display:flex;flex-wrap:wrap;gap:2px;padding:8px;border-bottom:1px solid var(--bd);background:var(--sf2)}
      .tb-btn{background:none;border:none;color:var(--t2);cursor:pointer;padding:6px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:all .12s;min-width:28px;height:28px}
      .tb-btn:hover{color:var(--tx);background:var(--sf3)} .tb-sep{width:1px;background:var(--bd);margin:2px 4px;align-self:stretch}
      .re-body{min-height:100px;max-height:300px;overflow-y:auto;padding:16px;outline:none;font-size:15px;line-height:1.6;color:var(--tx)}
      .re-body:empty::before{content:attr(data-placeholder);color:var(--t3);pointer-events:none}
      .re-body img{max-width:100%;border-radius:8px;margin:8px 0;display:block}
      .re-body table{width:100%;border-collapse:collapse;margin:8px 0} .re-body th,.re-body td{border:1px solid var(--bd);padding:8px 10px;text-align:left;font-size:13px}
      .re-body th{background:var(--sf2);font-weight:600} .re-body blockquote{border-left:3px solid var(--ac);padding:8px 16px;margin:8px 0;color:var(--t2);font-style:italic}
      .re-body pre{background:#1a1a24;border:1px solid var(--bd);border-radius:8px;padding:12px;font-family:'JetBrains Mono',monospace;font-size:13px;overflow-x:auto;margin:8px 0}
      .re-body h3{font-size:18px;margin:12px 0 4px} .re-body a{color:var(--ac);text-decoration:underline} .re-body hr{border:none;border-top:1px solid var(--bd);margin:12px 0}
      .re-body ul,.re-body ol{padding-left:24px;margin:8px 0} .re-body li{margin:4px 0} .re-body mark{background:#a78bfa33;padding:1px 4px;border-radius:3px}

      /* Flashcard */
      .ccont{perspective:1200px;margin:40px 0 32px}
      .fc{width:100%;min-height:300px;position:relative;cursor:pointer;transform-style:preserve-3d;transition:transform .5s cubic-bezier(.4,0,.2,1)}
      .fc.flipped{transform:rotateY(180deg)}
      .ff{position:absolute;inset:0;backface-visibility:hidden;border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 28px}
      .ffr{background:linear-gradient(145deg,var(--sf),var(--sf2));border:1px solid var(--bd)}
      .fbk{background:linear-gradient(145deg,#1a1a28,#14142a);border:1px solid var(--ac2);transform:rotateY(180deg)}
      .flbl{position:absolute;top:16px;left:20px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--t3)}
      .fhint{position:absolute;bottom:16px;font-size:12px;color:var(--t3)}

      .ch{width:100%;text-align:center;font-size:18px;line-height:1.5;overflow-y:auto;max-height:220px}
      .ch img{max-width:100%;max-height:180px;border-radius:8px;margin:8px auto;display:block;object-fit:contain}
      .ch table{width:100%;border-collapse:collapse;margin:8px 0;text-align:left} .ch th,.ch td{border:1px solid var(--bd);padding:6px 10px;font-size:13px}
      .ch th{background:var(--sf2);font-weight:600} .ch blockquote{border-left:3px solid var(--ac);padding:6px 14px;margin:8px 0;color:var(--t2);font-style:italic;text-align:left}
      .ch pre{background:#1a1a24;border:1px solid var(--bd);border-radius:8px;padding:10px;font-family:'JetBrains Mono',monospace;font-size:12px;text-align:left;overflow-x:auto}
      .ch h3{font-size:20px;margin:8px 0} .ch a{color:var(--ac)} .ch ul,.ch ol{text-align:left;padding-left:24px} .ch mark{background:#a78bfa33;padding:1px 4px;border-radius:3px}
      .ch hr{border:none;border-top:1px solid var(--bd);margin:12px 0}
      .fbk .ch{color:var(--ac)} .fbk .ch th,.fbk .ch td,.fbk .ch pre{color:var(--tx)} .fbk .ch blockquote{color:var(--t2)}

      .abtns{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
      .abtn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 8px;border-radius:var(--rs);border:1px solid var(--bd);background:var(--sf);color:var(--tx);cursor:pointer;font-family:inherit;transition:all .15s}
      .abtn:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.3)}
      .ql{font-size:13px;font-weight:600} .qs{font-size:10px;color:var(--t3);font-family:'JetBrains Mono',monospace} .qk{font-size:10px;color:var(--t3);background:var(--sf3);border-radius:4px;padding:1px 6px;font-family:'JetBrains Mono',monospace}

      .pbar{height:4px;background:var(--sf2);border-radius:4px;overflow:hidden;margin-bottom:8px}
      .pfill{height:100%;background:linear-gradient(90deg,var(--ac),var(--ac2));border-radius:4px;transition:width .3s}
      .ptxt{font-size:12px;color:var(--t3);text-align:right;font-family:'JetBrains Mono',monospace}

      .sc{background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);padding:32px;text-align:center;margin:24px 0}
      .sbig{font-size:64px;font-weight:700;background:linear-gradient(135deg,var(--ac),var(--ok));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1}
      .sgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}
      .sb{background:var(--sf2);border-radius:var(--rs);padding:16px} .sv{font-size:28px;font-weight:700} .sl{font-size:12px;color:var(--t3);margin-top:4px}

      .cli{background:var(--sf);border:1px solid var(--bd);border-radius:var(--rs);padding:14px 16px;margin-bottom:8px;display:flex;align-items:center;gap:12px}
      .ct{flex:1;min-width:0;display:flex;align-items:center;gap:6px;overflow:hidden}
      .cf{font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .csep{color:var(--t3);flex-shrink:0} .cb{color:var(--t2);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .cm{font-size:11px;color:var(--ac);background:rgba(167,139,250,.1);padding:1px 8px;border-radius:20px;flex-shrink:0}
      .ca{display:flex;gap:4px;flex-shrink:0}
      .ib{background:none;border:none;color:var(--t3);cursor:pointer;padding:6px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:all .15s}
      .ib:hover{color:var(--tx);background:var(--sf3)} .ib.danger:hover{color:var(--dn)}

      .mo{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px}
      .modal{background:var(--sf);border:1px solid var(--bd);border-radius:20px;padding:32px;width:100%;max-width:420px} .modal h3{font-size:18px;margin-bottom:20px}

      .mm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px}
      .mm{background:var(--sf);border:1px solid var(--bd);border-radius:16px;padding:24px;width:100%;max-width:380px} .mm h4{font-size:16px;font-weight:700;margin-bottom:12px}
      .mhint{font-size:12px;color:var(--t3);margin-bottom:12px;line-height:1.4}

      .toast{position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:var(--ac2);color:white;font-size:14px;font-weight:600;padding:10px 24px;border-radius:50px;z-index:300;animation:ti .3s ease}
      @keyframes ti{from{opacity:0;transform:translateX(-50%) translateY(16px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

      .empty{text-align:center;padding:60px 20px;color:var(--t3)} .empty p{margin-top:8px;font-size:14px}
      .stitle{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px} .stitle h2{font-size:15px;font-weight:600;color:var(--t2)}
      ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:var(--sf3);border-radius:3px}
    `}</style>
    <div className="app">
      {view==="home"&&<Home/>}
      {view==="deck"&&<Deck/>}
      {view==="add"&&<Add/>}
      {view==="edit"&&<Edit/>}
      {view==="study"&&<Study/>}
      {view==="stats"&&<Stats/>}
      {toast&&<div className="toast">{toast}</div>}
    </div>
  </>;
}
