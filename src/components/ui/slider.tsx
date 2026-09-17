"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  className?: string;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value, defaultValue, min = 0, max = 100, step = 1, onValueChange, className, disabled, ...props }, ref) => {
    const currentVal = value && value.length > 0 ? value[0] : (defaultValue && defaultValue.length > 0 ? defaultValue[0] : min);
    const percentage = Math.max(0, Math.min(100, ((currentVal - min) / (max - min)) * 100));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = Number(e.target.value);
      if (onValueChange) {
        onValueChange([num]);
      }
    };

    return (
      <div className={cn("relative flex w-full touch-none select-none items-center py-1", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentVal}
          disabled={disabled}
          onChange={handleChange}
          style={{
            background: `linear-gradient(to right, #4648d4 0%, #4648d4 ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`
          }}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#4648d4] focus:outline-none dark:bg-slate-700 disabled:opacity-50"
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
