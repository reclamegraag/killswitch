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
    <div className="relative px-4 mb-3">
      <i className="fa-solid fa-magnifying-glass absolute left-7 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search processes..."
        className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/40 border border-white/30 text-sm text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-300/50 transition"
      />
    </div>
  );
}
