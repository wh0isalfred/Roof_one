"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

/**
 * Rotating circular badge with SVG text ring and arrow icon.
 * Animates continuously, pauses on hover, arrow nudges up-right.
 */
function CircularBadge({ size = 110 }: { size?: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
  }, []);

  const radius = size / 2;
  const innerRadius = radius - 16;
  const textRadius = innerRadius - 8;

  const text = "Explore Our Services. Explore Our Services. ";
  const circumference = 2 * Math.PI * textRadius;

  return (
    <a
      href="#services"
      className="group relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
      >
        {/* Red circle background */}
        <circle
          cx={radius}
          cy={radius}
          r={radius}
          fill="var(--color-accent)"
          className="transition-all duration-300"
        />

        {/* Rotating text path */}
        <defs>
          <path
            id="textCircle"
            d={`M ${radius} ${radius} m -${textRadius} 0 a ${textRadius} ${textRadius} 0 1 1 ${
              textRadius * 2
            } 0 a ${textRadius} ${textRadius} 0 1 1 -${textRadius * 2} 0`}
            fill="none"
          />
        </defs>

        <g
          style={{
            transformOrigin: `${radius}px ${radius}px`,
            animation: prefersReduced ? "none" : "spin-slow 20s linear infinite",
            animationPlayState: isHovered && !prefersReduced ? "paused" : "running",
            transition: "animation-play-state 0.3s ease",
          }}
        >
          <text
            fontSize="11"
            fontWeight="600"
            letterSpacing="0.05em"
            fill="white"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            <textPath href="#textCircle" startOffset="0%">
              {text}
            </textPath>
          </text>
        </g>
      </svg>

      {/* Center arrow icon */}
      <div
        className={`relative z-10 transition-transform duration-300 ${
          isHovered ? "-translate-y-1 translate-x-1" : ""
        }`}
      >
        <ArrowUpRight
          size={size * 0.4}
          className="text-white"
          strokeWidth={2.5}
        />
      </div>
    </a>
  );
}

/**
 * Image card with top-left radius and notch cutout for badge.
 * The notch creates an inverted rounded effect where the dark bg "bites" into the image.
 */
function ImageCard({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const badgeSize = 110;
  const notchRadius = badgeSize / 2 + 8;

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={{
        height: "520px",
        minHeight: "520px",
      }}
    >
      {/* SVG mask to cut the notch in the top-left */}
      <svg
        className="absolute inset-0 z-20 pointer-events-none"
        width="100%"
        height="100%"
        viewBox="0 0 400 520"
        preserveAspectRatio="none"
      >
        <defs>
          <mask id="notchMask">
            {/* White = visible, black = hidden */}
            <rect width="400" height="520" fill="white" />
            {/* Cut out the notch area (top-left) */}
            <circle cx="55" cy="55" r={notchRadius} fill="black" />
          </mask>
        </defs>
        <rect width="400" height="520" mask="url(#notchMask)" fill="none" />
      </svg>

      {/* Main image */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
      />

      {/* Badge positioned in the notch */}
      <div className="absolute top-0 left-0 z-30 -translate-x-1/4 -translate-y-1/4">
        <CircularBadge size={badgeSize} />
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative pt-40 pb-0 overflow-hidden"
    >
      {/* Dark background block that fills ~80% height */}
      <div className="absolute inset-x-0 top-0 h-[80%] bg-brand pointer-events-none" />

      {/* Light background (page background) shows beneath */}
      <div className="absolute inset-x-0 top-[80%] h-[20%] bg-canvas pointer-events-none" />

      <div className="relative z-10">
        <Container className="max-w-7xl">
          {/* Headline - spans full width, top area */}
          <h1
            id="hero-heading"
            className="font-display text-white font-medium mb-20"
            style={{
              fontSize: "clamp(3rem, 7.5vw, 6.5rem)",
              lineHeight: "1.0",
              letterSpacing: "-0.02em",
            }}
          >
            Secure roofing<br />
            built to last.
          </h1>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[35%_65%] lg:gap-8">
            {/* Left column: social proof + description */}
            <div className="flex flex-col gap-8">
              {/* Social proof row */}
              <div className="flex items-center gap-4">
                {/* Avatar stack */}
                <div className="flex -space-x-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-white border-2 border-brand flex items-center justify-center text-sm font-semibold text-ink"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>

                {/* Plus badge */}
                <div className="w-10 h-10 rounded-full bg-accent text-white border-2 border-brand flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold">+</span>
                </div>

                {/* Customer count text */}
                <p
                  className="text-sm text-white"
                  style={{ opacity: 0.85 }}
                >
                  2,400+ satisfied customers across the Northeast
                </p>
              </div>

              {/* Description paragraph - positioned to align with middle of image */}
              <p
                className="font-sans text-white leading-relaxed max-w-sm"
                style={{
                  fontSize: "16px",
                  opacity: 0.85,
                  lineHeight: 1.6,
                }}
              >
                From storm damage to routine maintenance, we deliver expert craftsmanship and quality materials. Your home deserves a roof that lasts.
              </p>
            </div>

            {/* Right column: image card that bleeds off right edge */}
            <div className="relative -mr-[100vw] md:-mr-12 lg:-mr-40 xl:-mr-[50vw]">
              <ImageCard
                src="https://images.unsplash.com/photo-1581578731548-c64695c952952?w=800&h=520&fit=crop"
                alt="Professional roofers at work on residential roof"
              />
            </div>
          </div>
        </Container>
      </div>

      {/* Light area background for the image overlap zone */}
      <div className="absolute inset-x-0 bottom-0 h-[20%] bg-canvas" />
    </section>
  );
}
