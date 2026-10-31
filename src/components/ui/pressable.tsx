import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { useHaptic } from "@/hooks/useHaptic";

interface PressableProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  hapticOnPress?: boolean;
  scaleAmount?: number;
}

export function Pressable({
  children,
  hapticOnPress = false,
  scaleAmount = 0.97,
  onTapStart,
  ...props
}: PressableProps) {
  const haptic = useHaptic();

  return (
    <motion.div
      whileTap={{ scale: scaleAmount }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      onTapStart={(e, info) => {
        if (hapticOnPress) haptic("light");
        onTapStart?.(e, info);
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
