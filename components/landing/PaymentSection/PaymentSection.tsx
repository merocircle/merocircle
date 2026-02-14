"use client";

import Image from "next/image";
import "./PaymentSection.css";

const PAYMENT_LOGOS = [
  { src: "/esewa.png", alt: "eSewa", name: "eSewa" },
  { src: "/fonepay.png", alt: "Fonepay", name: "Fonepay" },
  { src: "/khalti.png", alt: "Khalti Digital Wallet", name: "Khalti" },
  { src: "/mastercard.png", alt: "Mastercard", name: "Mastercard" },
  { src: "/visa.png", alt: "Visa", name: "Visa" },
];

function LogoStrip() {
  return (
    <div className="payment-section-strip">
      {PAYMENT_LOGOS.map((logo) => (
        <div key={logo.name} className="payment-section-logo-wrap">
          <Image
            src={logo.src}
            alt={logo.alt}
            width={120}
            height={56}
            className="payment-section-logo"
            sizes="120px"
          />
        </div>
      ))}
    </div>
  );
}

export function PaymentSection() {
  return (
    <section className="payment-section" aria-label="Supported payment methods">
      <div className="payment-section-inner">
        <p className="payment-section-eyebrow">Integrated with</p>
        <div className="payment-section-marquee-wrap">
          <div className="payment-section-marquee">
            <LogoStrip />
            <LogoStrip />
          </div>
        </div>
      </div>
    </section>
  );
}
