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
    <div className="relative mb-2">
      <i
        className="fa-solid fa-magnifying-glass absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        style={{ fontSize: 10, left: 10 }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search processes..."
        className="w-full py-1.5 rounded-lg bg-black/[0.04] border border-black/[0.06] text-[12px] text-gray-700 placeholder-gray-400 outline-none focus:bg-black/[0.06] focus:border-blue-400/40 transition"
        style={{ paddingLeft: 28, paddingRight: 12 }}
      />
    </div>
  );
}
