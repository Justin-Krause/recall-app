import React, { useState, useEffect } from "react";
import { Icons } from "../assets/icons";
import { SM2 } from "../lib/sm2";
import Html from "../components/Html";
import { QL } from "../lib/constants";

export default function Study({ initialQueue, onBack, onReview, onFinish }) {
    const [queue, setQueue] = useState(initialQueue);
    const [ci, setCi] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [sess, setSess] = useState({ rev: 0, ok: 0 });

    const card = queue[ci];

    useEffect(() => {
        const h = (e) => {
            if (e.code === "Space" && !flipped) { e.preventDefault(); setFlipped(true); }
            if (flipped) {
                if (e.key === "1") answer(0);
                if (e.key === "2") answer(1);
                if (e.key === "3") answer(3); // SM2 0,1,2,3,4,5 but QL maps 0,1,3,4,5
                if (e.key === "4") answer(4);
                if (e.key === "5") answer(5);
            }
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [flipped, ci, queue]);

    if (!card) return null;

    const answer = (q) => {
        // Calc update for preview/next-due, but actual update happens in App via onReview
        const updated = SM2.review(card, q);
        onReview(card.id, q, updated);

        setSess(s => ({ rev: s.rev + 1, ok: q >= 3 ? s.ok + 1 : s.ok }));

        if (q < 3) {
            setQueue(qq => [...qq, card]);
        }

        if (ci + 1 < queue.length) {
            setFlipped(false);
            setCi(i => i + 1);
        } else {
            onFinish({ rev: sess.rev + 1, ok: q >= 3 ? sess.ok + 1 : sess.ok });
        }
    };

    const ivlLabel = (c, q) => {
        const p = SM2.review({ ...c }, q);
        if (p.ivl <= 1) return "~1T";
        if (p.ivl < 30) return `~${p.ivl}T`;
        if (p.ivl < 365) return `~${Math.round(p.ivl / 30)}M`;
        return `~${(p.ivl / 365).toFixed(1)}J`;
    };

    const prog = (ci / queue.length) * 100;

    return (
        <>
            <button className="bbk" onClick={onBack}>{Icons.back} Beenden</button>
            <div style={{ marginTop: 20 }}>
                <div className="pbar"><div className="pfill" style={{ width: `${prog}%` }} /></div>
                <div className="ptxt">{ci + 1}/{queue.length}</div>
            </div>

            <div className="ccont" onClick={() => !flipped && setFlipped(true)}>
                <div className={`fc ${flipped ? "flipped" : ""}`}>
                    <div className="ff ffr">
                        <div className="flbl">Vorderseite</div>
                        <Html html={card.front} className="ch" />
                        <div className="fhint">Klicken / Leertaste</div>
                    </div>
                    <div className="ff fbk">
                        <div className="flbl">Rückseite</div>
                        <Html html={card.back} className="ch" />
                    </div>
                </div>
            </div>

            {flipped && (
                <div className="abtns">
                    {QL.map(({ q, l, c }) => (
                        <button key={q} className="abtn" onClick={() => answer(q)} style={{ borderColor: c + "33" }}>
                            <span className="ql" style={{ color: c }}>{l}</span>
                            <span className="qs">{ivlLabel(card, q)}</span>
                            <span className="qk">{q <= 1 ? q + 1 : q}</span>
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}
