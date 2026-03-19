mod commands;
mod models;

use commands::process::AppState;
use std::collections::HashMap;
use std::sync::Mutex;
use sysinfo::System;
use tauri_plugin_autostart::MacosLauncher;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .manage(AppState {
            system: Mutex::new(System::new()),
            icon_cache: Mutex::new(HashMap::new()),
        })
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            use tauri::Manager;
            use tauri_plugin_autostart::ManagerExt;
            use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

            let _ = app.autolaunch().enable();

            if let Err(e) = app.global_shortcut().on_shortcut("super+alt+k", move |app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }) {
                eprintln!("Failed to register global shortcut: {e}");
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::process::list_processes,
            commands::process::kill_process,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
