"use client";

import Image from "next/image";
import "./SocialProofStrip.css";

const PAYMENT_LOGOS = ["esewa", "fonepay", "khalti", "visa", "mastercard"];

export function SocialProofStrip() {
  return (
    <section className="proof-strip">
      <div className="proof-strip-inner">
        <p className="proof-label">
          We support the payment gateway you use
        </p>

        <span className="proof-divider" aria-hidden />

        <div className="proof-payments">
          {PAYMENT_LOGOS.map((name) => (
            <Image
              key={name}
              src={`/${name}.png`}
              alt={name}
              width={52}
              height={24}
              className="proof-payment-logo"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
