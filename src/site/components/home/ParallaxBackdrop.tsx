import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";

/** Dimmed real-screen backdrop that drifts slower than the page (0.15–0.25x). */
const ParallaxBackdrop = ({ src, speed = 0.2, opacity = 0.18 }: { src: string; speed?: number; opacity?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const raw = useTransform(scrollYProgress, [0, 1], [`${-speed * 100}%`, `${speed * 100}%`]);
  const y = useSpring(raw as never, { stiffness: 80, damping: 24, mass: 0.4 });

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden [perspective:1200px]">
      <motion.img
        src={src}
        alt=""
        loading="lazy"
        style={{ y: reduce ? 0 : y, opacity }}
        className="absolute inset-x-[-10%] top-[-20%] h-[140%] w-[120%] object-cover object-top blur-[2px] [transform:rotateX(8deg)_translateZ(0)] will-change-transform"
      />
      <div className="site-backdrop-mask absolute inset-0" />
    </div>
  );
};

export default ParallaxBackdrop;
