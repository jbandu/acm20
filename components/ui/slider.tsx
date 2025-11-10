"use client";

import * as React from "react";

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
}

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value: valueProp,
  defaultValue = [min],
  onValueChange,
}: SliderProps) {
  const [internal, setInternal] = React.useState<number>(
    valueProp?.[0] ?? defaultValue[0] ?? min
  );

  React.useEffect(() => {
    if (valueProp && typeof valueProp[0] === "number") {
      setInternal(valueProp[0]);
    }
  }, [valueProp]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value);
    if (valueProp === undefined) {
      setInternal(next);
    }
    onValueChange?.([next]);
  };

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={valueProp?.[0] ?? internal}
      onChange={handleChange}
      className="w-full"
    />
  );
}
