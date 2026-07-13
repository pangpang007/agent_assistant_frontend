import './TemperatureSlider.css';

export interface TemperatureSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function TemperatureSlider({ value, onChange, disabled = false }: TemperatureSliderProps) {
  const pct = (value / 2) * 100;

  return (
    <div className="temp-slider">
      <div className="temp-slider__header">
        <span className="phase2-field-label">Temperature</span>
        <span className="temp-slider__value">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        className="temp-slider__input"
        min={0}
        max={2}
        step={0.1}
        value={value}
        disabled={disabled}
        style={{ '--value-pct': `${pct}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="temp-slider__labels">
        <span>更精确</span>
        <span>更创意</span>
      </div>
      <div className="temp-slider__ticks">
        {[0, 0.5, 1, 1.5, 2].map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
    </div>
  );
}
