import React from "react";

export default function Html({ html, className }) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
