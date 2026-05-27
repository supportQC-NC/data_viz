// src/components/Loader/Loader.js
import React from "react";
import "./Loader.scss";

export default function Loader() {
  return (
    <div className="loader">
      <div className="loader__spinner" />
      <span className="loader__label">Chargement…</span>
    </div>
  );
}
