import { useState, useEffect } from "react";

interface Props {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), 150);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div style={{ position: "relative", marginBottom: 8 }}>
      <i
        className="fa-solid fa-magnifying-glass"
        style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 11,
          color: "#9ca3af",
          pointerEvents: "none",
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search processes..."
        style={{
          width: "100%",
          paddingLeft: 32,
          paddingRight: 12,
          paddingTop: 6,
          paddingBottom: 6,
          borderRadius: 8,
          backgroundColor: "rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.06)",
          fontSize: 12,
          color: "#374151",
          outline: "none",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}
