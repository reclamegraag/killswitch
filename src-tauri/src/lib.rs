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
        .setup(|app| {
            use tauri_plugin_autostart::ManagerExt;
            let _ = app.autolaunch().enable();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::process::list_processes,
            commands::process::kill_process,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
