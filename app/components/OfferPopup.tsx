"use client";

import { useEffect, useState } from "react";

type Offer = {
  title: string;
  body: string;
  buttonText: string;
  expiryDate: string;
  active: boolean;
};

export default function OfferPopup() {
  const [offer, setOffer] = useState<Offer | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("ar_offer_dismissed")) return;

    fetch("/api/offer")
      .then((r) => r.json())
      .then((data: Offer | null) => {
        if (!data || !data.active) return;
        if (data.expiryDate && new Date(data.expiryDate) < new Date()) return;
        setTimeout(() => setOffer(data), 1500);
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("ar_offer_dismissed", "1");
    setOffer(null);
  };

  if (!offer) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(255,255,255,0.12)",
          width: "100%",
          maxWidth: 460,
          padding: "2.5rem",
          position: "relative",
        }}
      >
        <button
          onClick={dismiss}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.30)",
            cursor: "pointer",
            fontSize: "1.1rem",
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        <p
          style={{
            fontSize: "0.6rem",
            letterSpacing: "0.30em",
            color: "rgba(255,255,255,0.32)",
            textTransform: "uppercase",
            marginBottom: "0.9rem",
          }}
        >
          Limited Offer
        </p>

        <h2
          style={{
            fontFamily: "var(--font-bebas), sans-serif",
            fontSize: "clamp(1.8rem,5vw,2.6rem)",
            letterSpacing: "0.08em",
            color: "#fff",
            lineHeight: 1.1,
            marginBottom: "1rem",
          }}
        >
          {offer.title}
        </h2>

        <p
          style={{
            fontSize: "0.92rem",
            lineHeight: 1.75,
            color: "rgba(255,255,255,0.52)",
            marginBottom: "2rem",
          }}
        >
          {offer.body}
        </p>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a
            href="#membership"
            onClick={dismiss}
            style={{
              flex: 1,
              background: "#fff",
              color: "#000",
              padding: "0.82rem 1rem",
              fontSize: "0.76rem",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textAlign: "center",
              textDecoration: "none",
              display: "block",
            }}
          >
            {offer.buttonText || "Claim Offer"}
          </a>
          <button
            onClick={dismiss}
            style={{
              padding: "0.82rem 1.1rem",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.35)",
              fontSize: "0.75rem",
              letterSpacing: "0.10em",
              cursor: "pointer",
            }}
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
