import { ReactNode, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";
import { Check, Trash2 } from "lucide-react";

interface SwipeableProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftLabel?: string;
  rightLabel?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  threshold?: number;
  className?: string;
}

const SWIPE_THRESHOLD = 100;

export function Swipeable({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftLabel = "Delete",
  rightLabel = "Complete",
  leftIcon = <Trash2 className="h-5 w-5" />,
  rightIcon = <Check className="h-5 w-5" />,
  threshold = SWIPE_THRESHOLD,
  className,
}: SwipeableProps) {
  const x = useMotionValue(0);
  const haptic = useHaptic();
  const triggeredRef = useRef(false);

  const leftBgOpacity = useTransform(x, [-threshold, -threshold * 0.5, 0], [1, 0.5, 0]);
  const rightBgOpacity = useTransform(x, [0, threshold * 0.5, threshold], [0, 0.5, 1]);

  const handleDrag = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > threshold * 0.8 && !triggeredRef.current) {
      triggeredRef.current = true;
      haptic("light");
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    triggeredRef.current = false;
    if (info.offset.x < -threshold && onSwipeLeft) {
      haptic("medium");
      animate(x, -300, { type: "spring", stiffness: 300 });
      setTimeout(() => {
        onSwipeLeft();
        animate(x, 0, { duration: 0 });
      }, 200);
    } else if (info.offset.x > threshold && onSwipeRight) {
      haptic("success");
      animate(x, 300, { type: "spring", stiffness: 300 });
      setTimeout(() => {
        onSwipeRight();
        animate(x, 0, { duration: 0 });
      }, 200);
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  return (
    <div className={`relative overflow-hidden ${className || ""}`}>
      {/* Left action (swipe right reveals) */}
      {onSwipeRight && (
        <motion.div
          className="absolute inset-y-0 left-0 flex items-center gap-2 px-4 bg-emerald-500 text-white"
          style={{ opacity: rightBgOpacity, width: "40%" }}
        >
          {rightIcon}
          <span className="text-sm font-medium">{rightLabel}</span>
        </motion.div>
      )}

      {/* Right action (swipe left reveals) */}
      {onSwipeLeft && (
        <motion.div
          className="absolute inset-y-0 right-0 flex items-center justify-end gap-2 px-4 bg-destructive text-destructive-foreground"
          style={{ opacity: leftBgOpacity, width: "40%" }}
        >
          <span className="text-sm font-medium">{leftLabel}</span>
          {leftIcon}
        </motion.div>
      )}

      {/* Draggable content */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: onSwipeLeft ? -threshold * 1.5 : 0, right: onSwipeRight ? threshold * 1.5 : 0 }}
        dragElastic={0.3}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="relative z-10 bg-card"
      >
        {children}
      </motion.div>
    </div>
  );
}
