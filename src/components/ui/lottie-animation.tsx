"use client";

import { useLottie } from "lottie-react";
import { cn } from "@/lib/utils";

interface LottieAnimationProps {
  animationData: any;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function LottieAnimation({
  animationData,
  loop = true,
  autoplay = true,
  className,
  style,
}: LottieAnimationProps) {
  const { View } = useLottie({
    animationData,
    loop,
    autoplay,
  });

  return (
    <div className={cn("w-full h-full", className)} style={style}>
      {View}
    </div>
  );
} 