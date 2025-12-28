// components/ui/ColorPicker.tsx
import { useState } from 'react';

const COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
];

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value = '#3b82f6', onChange, label }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState(value);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    onChange(color);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="flex space-x-2">
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-8 h-8 rounded-full ${
              selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
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