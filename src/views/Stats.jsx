import React from "react";

export default function Stats({ sess, onBack, onHome }) {
    const pct = sess.rev > 0 ? Math.round(sess.ok / sess.rev * 100) : 0;

    return (
        <>
            <div style={{ textAlign: "center", paddingTop: 40 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700 }}>Sitzung fertig!</h2>
                <p style={{ color: "var(--t3)", fontSize: 14 }}>Gut gemacht!</p>
            </div>

            <div className="sc">
                <div className="sbig">{pct}%</div>
                <p style={{ color: "var(--t2)", marginTop: 8 }}>Erfolgsrate</p>
                <div className="sgrid">
                    <div className="sb">
                        <div className="sv">{sess.rev}</div>
                        <div className="sl">Wiederholt</div>
                    </div>
                    <div className="sb">
                        <div className="sv" style={{ color: "var(--ok)" }}>{sess.ok}</div>
                        <div className="sl">Richtig</div>
                    </div>
                </div>
            </div>

            <div className="btn-row" style={{ justifyContent: "center" }}>
                <button className="btn bp" onClick={onBack}>Zum Deck</button>
                <button className="btn bs" onClick={onHome}>Start</button>
            </div>
        </>
    );
}
