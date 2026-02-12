import React, { useState } from "react";
import { Icons } from "../assets/icons";
import RichEditor from "../components/RichEditor";

export default function Add({ onBack, onAdd }) {
    const [nf, setNf] = useState("");
    const [nb, setNb] = useState("");

    const handleAdd = () => {
        onAdd(nf, nb);
        setNf("");
        setNb("");
    };

    return (
        <>
            <button className="bbk" onClick={onBack}>{Icons.back} Zurück</button>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: "24px 0 20px" }}>Neue Karte</h2>
            <div className="field">
                <label>Vorderseite</label>
                <RichEditor value={nf} onChange={setNf} placeholder="Frage, Begriff, Bild..." autoFocus />
            </div>
            <div className="field">
                <label>Rückseite</label>
                <RichEditor value={nb} onChange={setNb} placeholder="Antwort, Tabelle, Erklärung..." />
            </div>
            <button className="btn bp" onClick={handleAdd}>{Icons.plus} Hinzufügen</button>
        </>
    );
}
