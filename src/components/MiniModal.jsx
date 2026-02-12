import React from "react";

export default function MiniModal({ title, children, onClose }) {
    return (
        <div className="mm-overlay" onClick={onClose}>
            <div className="mm" onClick={e => e.stopPropagation()}>
                <h4>{title}</h4>
                {children}
            </div>
        </div>
    );
}
