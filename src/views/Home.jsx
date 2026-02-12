import React, { useState } from "react";
import { Icons } from "../assets/icons";
import { SM2 } from "../lib/sm2";

export default function Home({ decks, onSelectDeck, onCreateDeck }) {
    const [showND, setShowND] = useState(false);
    const [ndn, setNdn] = useState("");
    const DC = ["#a855f7", "#3b82f6", "#22c55e", "#f97316", "#ef4444", "#ec4899", "#14b8a6", "#eab308"];

    const createDeck = () => {
        if (!ndn.trim()) return;
        onCreateDeck(ndn.trim(), DC[decks.length % DC.length]);
        setNdn("");
        setShowND(false);
    };

    const due = (d) => d.cards.filter(SM2.due);
    const totalDue = decks.reduce((s, d) => s + due(d).length, 0);
    const totalCards = decks.reduce((s, d) => s + d.cards.length, 0);

    return (
        <>
            <div className="hdr">
                <div className="logo">{Icons.brain}</div>
                <div>
                    <h1>Recall</h1>
                    <div className="sub">{totalCards} Karten · {totalDue} fällig</div>
                </div>
            </div>

            <div className="stitle">
                <h2>Deine Decks</h2>
                <button className="btn bp btn-sm" onClick={() => setShowND(true)}>{Icons.plus} Neues Deck</button>
            </div>

            <div className="dg">
                {decks.map(d => {
                    const du = due(d).length;
                    return (
                        <div key={d.id} className="di" onClick={() => onSelectDeck(d.id)}>
                            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: d.color, borderRadius: "14px 0 0 14px" }} />
                            {du > 0 && <div className="dub">{du} fällig</div>}
                            <div className="dn">{d.name}</div>
                            <div className="dm">
                                <span>{d.cards.length} Karten</span>
                                <span>·</span>
                                <span>{d.cards.filter(c => c.reps > 0).length} gelernt</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {decks.length === 0 && <div className="empty"><p>Erstelle dein erstes Deck!</p></div>}

            {showND && (
                <div className="mo" onClick={() => setShowND(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Neues Deck</h3>
                        <div className="field">
                            <label>Name</label>
                            <input className="input" placeholder="z.B. Spanisch" value={ndn} onChange={e => setNdn(e.target.value)} onKeyDown={e => e.key === "Enter" && createDeck()} autoFocus />
                        </div>
                        <div className="btn-row" style={{ justifyContent: "flex-end", marginTop: 16 }}>
                            <button className="btn bs btn-sm" onClick={() => setShowND(false)}>Abbrechen</button>
                            <button className="btn bp btn-sm" onClick={createDeck}>Erstellen</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
