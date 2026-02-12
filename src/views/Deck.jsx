import React, { useState } from "react";
import { Icons } from "../assets/icons";
import { SM2 } from "../lib/sm2";
import { strip, hasMed } from "../lib/utils";

export default function Deck({ deck, onBack, onStartStudy, onAddCard, onImport, onDeleteDeck, onEditCard, onDeleteCard }) {
    if (!deck) return null;
    const [search, setSearch] = useState("");
    const due = deck.cards.filter(SM2.due);

    const filteredCards = deck.cards.filter(c => {
        if (!search.trim()) return true;
        // User requested search by both Question (front) and Answer (back).
        const term = search.toLowerCase();
        const contentBack = strip(c.back).toLowerCase();
        const contentFront = strip(c.front).toLowerCase();
        return contentBack.includes(term) || contentFront.includes(term);
    });

    return (
        <>
            <button className="bbk" onClick={onBack}>{Icons.back} Zurück</button>
            <div style={{ margin: "24px 0" }}>
                <h1 style={{ fontSize: 26, fontWeight: 700 }}>{deck.name}</h1>
                <p style={{ color: "var(--t3)", marginTop: 6, fontSize: 14 }}>
                    {deck.cards.length} Karten · {due.length} fällig
                </p>
            </div>

            <div className="btn-row" style={{ marginBottom: 28 }}>
                <button className="btn bp" onClick={onStartStudy} disabled={!due.length} style={{ opacity: due.length ? 1 : .4 }}>
                    {Icons.brain} Lernen ({due.length})
                </button>
                <button className="btn bs" onClick={onAddCard}>{Icons.plus} Karte</button>
                <button className="btn bg btn-sm" onClick={onImport} title="Import">{Icons.imp}</button>
            </div>

            {due.length === 0 && deck.cards.length > 0 && !search && (
                <div className="sc" style={{ marginBottom: 20 }}>
                    <div style={{ color: "var(--ok)", marginBottom: 8 }}>{Icons.check}</div>
                    <p style={{ fontWeight: 600 }}>Alles erledigt!</p>
                    <p style={{ color: "var(--t3)", fontSize: 13, marginTop: 4 }}>Komm später wieder.</p>
                </div>
            )}

            <div className="stitle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>Alle Karten ({filteredCards.length}{search && ` / ${deck.cards.length}`})</h2>
            </div>

            <div style={{ marginBottom: 16 }}>
                <input
                    type="text"
                    className="input"
                    placeholder="Suche in Fragen und Antworten..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: "100%" }}
                />
            </div>

            {filteredCards.map(c => (
                <div key={c.id} className="cli">
                    <div className="ct">
                        <span className="cf">{strip(c.front)}</span>
                        <span className="csep">→</span>
                        <span className="cb">{strip(c.back)}</span>
                    </div>
                    {(hasMed(c.front) || hasMed(c.back)) && <span className="cm">📎</span>}
                    <div className="ca">
                        <button className="ib" onClick={() => onEditCard(c)}>{Icons.edit}</button>
                        <button className="ib danger" onClick={() => onDeleteCard(c.id)}>{Icons.trash}</button>
                    </div>
                </div>
            ))}

            {!filteredCards.length && <div className="empty"><p>{search ? "Keine Treffer." : "Noch keine Karten."}</p></div>}

            {!search && (
                <div style={{ marginTop: 32, borderTop: "1px solid var(--bd)", paddingTop: 20 }}>
                    <button className="btn bg bd btn-sm" onClick={() => { if (confirm("Deck löschen?")) onDeleteDeck(deck.id); }}>
                        {Icons.trash} Deck löschen
                    </button>
                </div>
            )}
        </>
    );
}
