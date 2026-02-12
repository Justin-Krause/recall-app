import React from "react";
import { Icons } from "../assets/icons";
import { SM2 } from "../lib/sm2";
import { strip, hasMed } from "../lib/utils";

export default function Deck({ deck, onBack, onStartStudy, onAddCard, onImport, onDeleteDeck, onEditCard, onDeleteCard }) {
    if (!deck) return null;
    const due = deck.cards.filter(SM2.due);

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

            {due.length === 0 && deck.cards.length > 0 && (
                <div className="sc" style={{ marginBottom: 20 }}>
                    <div style={{ color: "var(--ok)", marginBottom: 8 }}>{Icons.check}</div>
                    <p style={{ fontWeight: 600 }}>Alles erledigt!</p>
                    <p style={{ color: "var(--t3)", fontSize: 13, marginTop: 4 }}>Komm später wieder.</p>
                </div>
            )}

            <div className="stitle">
                <h2>Alle Karten ({deck.cards.length})</h2>
            </div>

            {deck.cards.map(c => (
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

            {!deck.cards.length && <div className="empty"><p>Noch keine Karten.</p></div>}

            <div style={{ marginTop: 32, borderTop: "1px solid var(--bd)", paddingTop: 20 }}>
                <button className="btn bg bd btn-sm" onClick={() => { if (confirm("Deck löschen?")) onDeleteDeck(deck.id); }}>
                    {Icons.trash} Deck löschen
                </button>
            </div>
        </>
    );
}
