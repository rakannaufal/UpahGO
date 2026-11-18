import React from "react";
import { c } from "./theme";
type Props = {
  date: string;
  time: string;
  zone: string;
  onDate: (value: string) => void;
  onTime: (value: string) => void;
};
export function SchedulePicker({ date, time, onDate, onTime }: Props) {
  const style: React.CSSProperties = {
    fontFamily: "inherit",
    fontSize: 16,
    lineHeight: "24px",
    minHeight: 56,
    borderRadius: 10,
    border: `1px solid ${c.outline}`,
    padding: "12px 16px",
    width: "100%",
    boxSizing: "border-box",
    background: c.surface,
    color: c.onSurface,
  };
  return (
    <>
      <label
        style={{ display: "grid", gap: 8, color: c.onSurface, fontSize: 14 }}
      >
        Tanggal
        <input
          type="date"
          aria-label="Tanggal pekerjaan"
          value={date}
          onChange={(e) => onDate(e.target.value)}
          style={style}
        />
      </label>
      <label
        style={{ display: "grid", gap: 8, color: c.onSurface, fontSize: 14 }}
      >
        Jam mulai
        <input
          type="time"
          aria-label="Jam mulai"
          value={time}
          onChange={(e) => onTime(e.target.value)}
          style={style}
        />
      </label>
    </>
  );
}
