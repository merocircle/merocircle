"use client";

import Image from "next/image";
import "./TransitionIllustration.css";

const ILLUSTRATION_SRC = "/Gemini_Generated_Image_alvhvualvhvualvh.png";

export function TransitionIllustration() {
  return (
    <section className="transition-illus">
      <div className="transition-illus-inner">
        <Image
          src={ILLUSTRATION_SRC}
          alt="Creators and supporters connected"
          width={800}
          height={400}
          className="transition-illus-img"
          sizes="(max-width: 1024px) 100vw, 800px"
        />
      </div>
    </section>
  );
}
