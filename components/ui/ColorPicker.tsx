// components/ui/ColorPicker.tsx
import { useState } from 'react';

const COLORS = [
  '#E8E8E8', // white
  '#666666', // gray
  '#FF3B30', // red
  '#FF9F0A', // amber
  '#34C759', // green
  '#5856D6', // indigo
  '#AF52DE', // purple
  '#FF2D55', // pink
];

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value = '#E8E8E8', onChange, label }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(value);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    onChange(color);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-label uppercase tracking-[0.08em] text-text-secondary">
          {label}
        </label>
      )}
      <div className="flex gap-1.5">
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-6 h-6 transition-all duration-200 ${
              selectedColor === color ? 'ring-1 ring-offset-2 ring-offset-background ring-text-primary scale-110' : 'hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorChange(color)}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
    </div>
  );
}