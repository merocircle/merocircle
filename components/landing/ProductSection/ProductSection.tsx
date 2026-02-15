"use client";

import Image from "next/image";
import { useReveal } from "../useReveal";
import "./ProductSection.css";

const PRODUCT_IMAGE = "/MeroCircle_Product_Dashboard.png";

function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [ref, isVisible] = useReveal();
  return (
    <div
      ref={ref}
      className={`product-reveal ${isVisible ? "product-reveal-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function ProductSection() {
  return (
    <section id="support-types" className="product-section">
      <div className="product-section-inner">
        <RevealSection className="product-section-header">
          <p className="product-section-eyebrow">See the product</p>
          <h2 className="product-section-title">
            Community engagement & local payments.
          </h2>
          <p className="product-section-description">
            Track your community and manage local payment integrations in one place. Built for Nepal&apos;s creators.
          </p>
        </RevealSection>
        <RevealSection className="product-section-visual">
          <div className="product-section-image-frame">
            <Image
              src={PRODUCT_IMAGE}
              alt="Dashboard showing community engagement metrics and local payment integrations"
              width={900}
              height={600}
              className="product-section-image"
              sizes="(max-width: 1024px) 100vw, 900px"
            />
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
