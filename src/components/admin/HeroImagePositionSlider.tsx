'use client';

import { useState } from 'react';

// Phase 13 — shared admin control for the hero-image vertical-position
// Int 0-100 stored on every singleton/multi-row that has a hero image.
// Replaces what used to be a free-text "center 30%" input on the
// About / Lab / Contact / Journey CTA / Faculty Dean-Head admin forms.
//
// Wire: caller passes an `name` (FormData key) + the current Int value
// from the DB. The component renders a range slider paired with a
// number input + helper copy, and serializes the chosen value to a
// hidden Int input the existing server actions read with FormData.get.

type Props = {
  name: string;
  initialValue: number | null | undefined;
  label?: string;
  helperText?: string;
};

function clampPercent(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default function HeroImagePositionSlider({
  name,
  initialValue,
  label = 'Image vertical position',
  helperText = 'Drag the slider to move the image up or down within the banner. 0 = top edge visible, 100 = bottom edge visible. Try different values to frame the subject correctly.',
}: Props) {
  const [verticalPercent, setVerticalPercent] = useState<number>(
    clampPercent(typeof initialValue === 'number' ? initialValue : 50),
  );

  return (
    <div>
      <label htmlFor={`${name}-range`} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          id={`${name}-range`}
          type="range"
          min={0}
          max={100}
          step={1}
          value={verticalPercent}
          onChange={(e) => setVerticalPercent(clampPercent(Number(e.target.value)))}
          className="flex-1 accent-accent cursor-pointer"
        />
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={verticalPercent}
          onChange={(e) => setVerticalPercent(clampPercent(Number(e.target.value)))}
          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
          aria-label={`${label} percent`}
        />
        <span className="text-xs text-gray-500">%</span>
      </div>
      <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>
      <input type="hidden" name={name} value={verticalPercent} />
    </div>
  );
}
