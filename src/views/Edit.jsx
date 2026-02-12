import React, { useState } from "react";
import { Icons } from "../assets/icons";
import RichEditor from "../components/RichEditor";

export default function Edit({ card, onBack, onSave }) {
    const [f, sF] = useState(card?.front || "");
    const [b, sB] = useState(card?.back || "");

    if (!card) return null;

    return (
        <>
            <button className="bbk" onClick={onBack}>{Icons.back} Zurück</button>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "24px 0 20px" }}>Bearbeiten</h2>
            <div className="field">
                <label>Vorderseite</label>
                <RichEditor value={f} onChange={sF} placeholder="Vorderseite..." autoFocus />
            </div>
            <div className="field">
                <label>Rückseite</label>
                <RichEditor value={b} onChange={sB} placeholder="Rückseite..." />
            </div>
            <button className="btn bp" onClick={() => onSave(card.id, f, b)}>{Icons.check} Speichern</button>
        </>
    );
}
