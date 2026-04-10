import { useState, useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import Tooltip from "./Tooltip";

interface Props {
  onSearch: (query: string) => void;
}

export interface SearchBarHandle {
  focus: () => void;
  clear: () => void;
}

const SearchBar = forwardRef<SearchBarHandle, Props>(function SearchBar({ onSearch }, ref) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => {
      setValue("");
      onSearch("");
      inputRef.current?.focus();
    }
  }));

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), 150);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div className="relative mb-2">
      <i
        className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        style={{ fontSize: 11 }}
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search processes..."
        className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-black/[0.04] border border-black/[0.06] text-[12px] text-gray-700 placeholder-gray-400 outline-none focus:bg-black/[0.06] focus:border-blue-400/40 transition"
      />
      {value && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
          <Tooltip content="Wissen" shortcut={["Esc"]} position="bottom">
            <button
              onClick={() => {
                setValue("");
                onSearch("");
                inputRef.current?.focus();
              }}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-xmark" style={{ fontSize: 11 }} />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
});

export default SearchBar;
