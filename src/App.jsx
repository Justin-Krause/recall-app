import React, { useState, useEffect } from "react";
import "./index.css";
import { SM2 } from "./lib/sm2";
import { Storage } from "./lib/storage";
import { strip } from "./lib/utils";
import Home from "./views/Home";
import Deck from "./views/Deck";
import Add from "./views/Add";
import Edit from "./views/Edit";
import Study from "./views/Study";
import Stats from "./views/Stats";

export default function App() {
    const [decks, setDecks] = useState([]);
    const [view, setView] = useState("home");
    const [actDeckId, setActDeckId] = useState(null);
    const [editCard, setEditCard] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [toast, setToast] = useState(null);
    const [sess, setSess] = useState(null); // For stats
    // We can also store the queue here if we want persistent session state, 
    // but for now we initialize Study with a fresh queue.
    const [studyQueue, setStudyQueue] = useState([]);

    useEffect(() => {
        (async () => {
            const saved = await Storage.load("recall-v3", null);
            if (saved) setDecks(saved);
            else {
                // Initial / Example Data
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

    useEffect(() => { if (loaded) Storage.save("recall-v3", decks); }, [decks, loaded]);

    const toast_ = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };

    const activeDeck = decks.find(d => d.id === actDeckId);

    // Actions
    const handleCreateDeck = (name, color) => {
        setDecks([...decks, { id: crypto.randomUUID(), name, color, cards: [] }]);
        toast_("Deck erstellt!");
    };

    const handleDeleteDeck = (id) => {
        setDecks(decks.filter(d => d.id !== id));
        setView("home");
        toast_("Deck gelöscht");
    };

    const handleAddCard = (front, back) => {
        if (!strip(front).trim() && !front.includes("<img")) return;
        setDecks(decks.map(d => d.id === actDeckId ? { ...d, cards: [...d.cards, SM2.make(front, back)] } : d));
        toast_("Karte hinzugefügt!");
    };

    const handleUpdateCard = (id, front, back) => {
        setDecks(decks.map(d => d.id === actDeckId ? {
            ...d, cards: d.cards.map(c => c.id === id ? { ...c, front, back } : c)
        } : d));
        setEditCard(null);
        setView("deck");
        toast_("Gespeichert");
    };

    const handleDeleteCard = (id) => {
        setDecks(decks.map(d => d.id === actDeckId ? { ...d, cards: d.cards.filter(c => c.id !== id) } : d));
        toast_("Karte gelöscht");
    };

    const handleImport = () => {
        const t = prompt("Karten (Zeile: Vorderseite;Rückseite oder Tab-getrennt):");
        if (!t) return;
        const nc = t.trim().split("\n").map(l => {
            const s = l.includes("\t") ? "\t" : ";";
            const [f, b] = l.split(s).map(x => x.trim());
            return f && b ? SM2.make(f, b) : null;
        }).filter(Boolean);

        if (nc.length) {
            setDecks(decks.map(d => d.id === actDeckId ? { ...d, cards: [...d.cards, ...nc] } : d));
            toast_(`${nc.length} importiert!`);
        }
    };

    const handleStartStudy = () => {
        if (!activeDeck) return;
        const due = activeDeck.cards.filter(SM2.due).sort(() => Math.random() - .5);
        if (!due.length) return;
        setStudyQueue(due);
        setView("study");
    };

    const handleReview = (cardId, quality, updatedCard) => {
        setDecks(prev => prev.map(d => d.id === actDeckId ? {
            ...d,
            cards: d.cards.map(c => c.id === cardId ? updatedCard : c)
        } : d));
    };

    const handleFinishStudy = (sessionStats) => {
        setSess(sessionStats);
        setView("stats");
    };

    if (!loaded) return null;

    return (
        <div className="app">
            {view === "home" && (
                <Home
                    decks={decks}
                    onSelectDeck={(id) => { setActDeckId(id); setView("deck"); }}
                    onCreateDeck={handleCreateDeck}
                />
            )}

            {view === "deck" && activeDeck && (
                <Deck
                    deck={activeDeck}
                    onBack={() => setView("home")}
                    onStartStudy={handleStartStudy}
                    onAddCard={() => setView("add")}
                    onImport={handleImport}
                    onDeleteDeck={handleDeleteDeck}
                    onEditCard={(c) => { setEditCard(c); setView("edit"); }}
                    onDeleteCard={handleDeleteCard}
                />
            )}

            {view === "add" && (
                <Add
                    onBack={() => setView("deck")}
                    onAdd={handleAddCard}
                />
            )}

            {view === "edit" && editCard && (
                <Edit
                    card={editCard}
                    onBack={() => setView("deck")}
                    onSave={handleUpdateCard}
                />
            )}

            {view === "study" && studyQueue.length > 0 && (
                <Study
                    initialQueue={studyQueue}
                    onBack={() => setView("deck")}
                    onReview={handleReview}
                    onFinish={handleFinishStudy}
                />
            )}

            {view === "stats" && sess && (
                <Stats
                    sess={sess}
                    onBack={() => setView("deck")}
                    onHome={() => setView("home")}
                />
            )}

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}
