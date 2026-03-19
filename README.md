# KillSwitch

A lightweight Windows process killer with a frosted glass UI. One-click kill, search, sort by name/CPU/memory, process icons, and auto-start with Windows.

![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)

## Features

- View all running processes with name, PID, icon, CPU and memory usage
- Kill any process with a single click — no confirmation dialog
- Search processes by name
- Sort by name, CPU or memory usage
- Frosted glass (glassmorphism) UI with custom titlebar
- Auto-starts with Windows

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/)
- Windows 10/11 (build target)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (pre-installed on Windows 10 21H2+ and Windows 11)

### Install Dependencies

```bash
# With npm
npm install

# Or with bun
bun install
```

### Development

```bash
# With npm
npm run tauri dev

# Or with bun
bun run tauri dev
```

This starts the Vite dev server with hot reload and opens the Tauri window.

### Build

```bash
# With npm
npm run tauri build

# Or with bun
bun run tauri build
```

The installer (MSI) will be generated in `src-tauri/target/release/bundle/msi/`.

## Project Structure

```
killswitch/
├── src/                    # React frontend
│   ├── components/         # SearchBar, SortControls, ProcessList, ProcessRow
│   ├── hooks/              # useProcesses (2s polling), useSort
│   ├── App.tsx             # Glass container + custom titlebar
│   ├── types.ts            # TypeScript interfaces
│   └── index.css           # Tailwind + glass theme + fonts
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # list_processes, kill_process + icon extraction
│   │   ├── models.rs       # ProcessInfo struct
│   │   └── lib.rs          # Plugin registration, state setup
│   └── tauri.conf.json     # Window config (400x500, transparent, centered)
└── index.html
```

## Tech Stack

| Layer    | Technology                                |
| -------- | ----------------------------------------- |
| Backend  | Tauri v2, Rust, sysinfo, windows (Win32)  |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4 |
| Icons    | Font Awesome                              |
| Font     | Plus Jakarta Sans                         |
| Plugin   | tauri-plugin-autostart                    |

## License

MIT
