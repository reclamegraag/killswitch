mod commands;
mod models;

use commands::process::AppState;
use std::collections::HashMap;
use std::sync::Mutex;
use sysinfo::System;
use tauri_plugin_autostart::MacosLauncher;

fn toggle_window(window: &tauri::WebviewWindow) {
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
    } else {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

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
            cpu_usage_query: Mutex::new(None),
            icon_cache: Mutex::new(HashMap::new()),
        })
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            use tauri::Manager;
            use tauri::menu::{MenuBuilder, MenuItemBuilder};
            use tauri::tray::TrayIconBuilder;
            use tauri_plugin_autostart::ManagerExt;
            use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

            let _ = app.autolaunch().enable();

            // Global shortcut: toggle visibility
            if let Err(e) = app.global_shortcut().on_shortcut("super+alt+s", move |app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    if let Some(window) = app.get_webview_window("main") {
                        toggle_window(&window);
                    }
                }
            }) {
                eprintln!("Failed to register global shortcut: {e}");
            }

            // System tray
            let open = MenuItemBuilder::with_id("open", "Openen").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "Afsluiten").build(app)?;
            let menu = MenuBuilder::new(app).items(&[&open, &quit]).build()?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("KillSwitch")
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } = event {
                        if let Some(window) = tray.app_handle().get_webview_window("main") {
                            toggle_window(&window);
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        // Intercept close: hide instead of quit
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::process::list_processes,
            commands::process::kill_process,
            commands::process::kill_processes_by_name,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
