use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use sysinfo::{Pid, System};
use tauri::State;

use crate::models::{ProcessInfo, ProcessSnapshot};

pub struct AppState {
    pub system: Mutex<System>,
    pub cpu_usage_query: Mutex<Option<CpuUsageQuery>>,
    pub icon_cache: Mutex<HashMap<PathBuf, Option<String>>>,
}

#[cfg(windows)]
pub(crate) struct CpuUsageQuery {
    query: isize,
    counter: isize,
}

#[cfg(not(windows))]
pub(crate) struct CpuUsageQuery;

#[tauri::command]
pub fn list_processes(state: State<AppState>) -> ProcessSnapshot {
    let mut sys = state.system.lock().unwrap();
    sys.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

    let processes: Vec<ProcessInfo> = sys
        .processes()
        .iter()
        .filter_map(|(pid, process)| {
            let name = process.name().to_string_lossy().to_string();
            if name.is_empty() {
                return None;
            }

            let icon_base64 = if cfg!(windows) {
                process
                    .exe()
                    .and_then(|exe| extract_icon_cached(exe.to_path_buf(), &state.icon_cache))
            } else {
                None
            };

            Some(ProcessInfo {
                pid: pid.as_u32(),
                name,
                cpu_usage: process.cpu_usage(),
                memory_mb: process.memory() as f64 / (1024.0 * 1024.0),
                icon_base64,
            })
        })
        .collect();

    let total_memory_mb = processes.iter().map(|process| process.memory_mb).sum();
    let (total_cpu_usage, total_memory_usage) = system_usage(&state, &sys);

    ProcessSnapshot {
        processes,
        total_cpu_usage,
        total_memory_mb,
        total_memory_usage,
    }
}

#[cfg(windows)]
fn system_usage(state: &AppState, _sys: &System) -> (f32, f32) {
    use windows::Win32::System::SystemInformation::{GlobalMemoryStatusEx, MEMORYSTATUSEX};

    let mut memory = MEMORYSTATUSEX {
        dwLength: std::mem::size_of::<MEMORYSTATUSEX>() as u32,
        ..Default::default()
    };
    let memory_usage = unsafe {
        GlobalMemoryStatusEx(&mut memory)
            .map(|_| memory.dwMemoryLoad as f32)
            .unwrap_or_default()
    };

    let total_cpu_usage = {
        let mut query = state.cpu_usage_query.lock().unwrap();
        if query.is_none() {
            *query = CpuUsageQuery::new();
        }
        query
            .as_ref()
            .and_then(CpuUsageQuery::read)
            .unwrap_or_default()
    };

    (total_cpu_usage, memory_usage)
}

#[cfg(windows)]
impl CpuUsageQuery {
    fn new() -> Option<Self> {
        use windows::core::PCWSTR;
        use windows::Win32::System::Performance::{
            PdhAddEnglishCounterW, PdhCloseQuery, PdhCollectQueryData, PdhOpenQueryW,
        };

        let mut query = 0;
        let mut counter = 0;
        let path: Vec<u16> = "\\Processor(_Total)\\% Processor Time\0"
            .encode_utf16()
            .collect();
        unsafe {
            if PdhOpenQueryW(PCWSTR::null(), 0, &mut query) != 0
                || PdhAddEnglishCounterW(query, PCWSTR(path.as_ptr()), 0, &mut counter) != 0
            {
                if query != 0 {
                    PdhCloseQuery(query);
                }
                return None;
            }
            // PDH percentage counters need a baseline sample before a value is available.
            PdhCollectQueryData(query);
        }
        Some(Self { query, counter })
    }

    fn read(&self) -> Option<f32> {
        use windows::Win32::System::Performance::{
            PdhCollectQueryData, PdhGetFormattedCounterValue, PDH_FMT_COUNTERVALUE, PDH_FMT_DOUBLE,
        };

        unsafe {
            if PdhCollectQueryData(self.query) != 0 {
                return None;
            }
            let mut value = PDH_FMT_COUNTERVALUE::default();
            if PdhGetFormattedCounterValue(self.counter, PDH_FMT_DOUBLE, None, &mut value) != 0
                || value.CStatus != 0
            {
                return None;
            }
            Some((value.Anonymous.doubleValue as f32).clamp(0.0, 100.0))
        }
    }
}

#[cfg(windows)]
impl Drop for CpuUsageQuery {
    fn drop(&mut self) {
        use windows::Win32::System::Performance::PdhCloseQuery;

        unsafe {
            PdhCloseQuery(self.query);
        }
    }
}

#[cfg(not(windows))]
fn system_usage(_state: &AppState, sys: &System) -> (f32, f32) {
    let memory_usage = if sys.total_memory() == 0 {
        0.0
    } else {
        (sys.used_memory() as f64 / sys.total_memory() as f64 * 100.0) as f32
    };
    (sys.global_cpu_usage(), memory_usage)
}

#[tauri::command]
pub fn kill_process(pid: u32) -> Result<(), String> {
    let sys = System::new_all();
    let pid = Pid::from_u32(pid);
    if let Some(process) = sys.process(pid) {
        process.kill();
        Ok(())
    } else {
        Err(format!("Process {} not found", pid))
    }
}

#[tauri::command]
pub fn kill_processes_by_name(name: String) -> Result<u32, String> {
    let sys = System::new_all();
    let mut count = 0u32;
    for (_pid, process) in sys.processes() {
        if process.name().to_string_lossy() == name {
            process.kill();
            count += 1;
        }
    }
    if count > 0 {
        Ok(count)
    } else {
        Err(format!("No processes found with name '{}'", name))
    }
}

fn extract_icon_cached(
    exe_path: PathBuf,
    cache: &Mutex<HashMap<PathBuf, Option<String>>>,
) -> Option<String> {
    let mut cache = cache.lock().unwrap();
    if let Some(cached) = cache.get(&exe_path) {
        return cached.clone();
    }

    let result = extract_icon(&exe_path);
    cache.insert(exe_path, result.clone());
    result
}

#[cfg(windows)]
fn extract_icon(exe_path: &PathBuf) -> Option<String> {
    use std::ffi::c_void;
    use std::slice;

    use base64::Engine;
    use windows::core::PCWSTR;
    use windows::Win32::Graphics::Gdi::{
        CreateCompatibleDC, CreateDIBSection, DeleteDC, DeleteObject, SelectObject, BI_RGB,
        BITMAPINFO, BITMAPINFOHEADER, DIB_RGB_COLORS, HGDIOBJ,
    };
    use windows::Win32::UI::Shell::ExtractIconExW;
    use windows::Win32::UI::WindowsAndMessaging::{
        DestroyIcon, DrawIconEx, GetSystemMetrics, DI_NORMAL, SM_CXICON, SM_CYICON,
    };

    let wide_path: Vec<u16> = exe_path
        .to_string_lossy()
        .encode_utf16()
        .chain(std::iter::once(0))
        .collect();

    unsafe {
        let mut large_icon = [windows::Win32::UI::WindowsAndMessaging::HICON::default()];
        let count = ExtractIconExW(
            PCWSTR(wide_path.as_ptr()),
            0,
            Some(large_icon.as_mut_ptr()),
            None,
            1,
        );

        if count == 0 || large_icon[0].is_invalid() {
            return None;
        }

        let icon = large_icon[0];
        let size = GetSystemMetrics(SM_CXICON)
            .max(GetSystemMetrics(SM_CYICON))
            .max(32);

        let hdc = CreateCompatibleDC(None);
        if hdc.0.is_null() {
            DestroyIcon(icon).ok();
            return None;
        }

        let bmi = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: size,
                biHeight: -size, // top-down
                biPlanes: 1,
                biBitCount: 32,
                biCompression: BI_RGB.0,
                ..Default::default()
            },
            ..Default::default()
        };

        let mut pixels_ptr: *mut c_void = std::ptr::null_mut();
        let dib = match CreateDIBSection(hdc, &bmi, DIB_RGB_COLORS, &mut pixels_ptr, None, 0) {
            Ok(dib) => dib,
            Err(_) => {
                let _ = DeleteDC(hdc);
                DestroyIcon(icon).ok();
                return None;
            }
        };

        if dib.is_invalid() || pixels_ptr.is_null() {
            let _ = DeleteDC(hdc);
            DestroyIcon(icon).ok();
            return None;
        }

        let previous = SelectObject(hdc, HGDIOBJ(dib.0));
        if previous.0.is_null() {
            let _ = DeleteObject(dib);
            let _ = DeleteDC(hdc);
            DestroyIcon(icon).ok();
            return None;
        }

        // Draw onto a transparent canvas so Windows resolves masks and alpha correctly.
        std::ptr::write_bytes(pixels_ptr, 0, (size * size * 4) as usize);
        let draw_result = DrawIconEx(hdc, 0, 0, icon, size, size, 0, None, DI_NORMAL);
        let mut pixels =
            slice::from_raw_parts(pixels_ptr as *const u8, (size * size * 4) as usize).to_vec();

        let _ = SelectObject(hdc, previous);
        let _ = DeleteObject(dib);
        let _ = DeleteDC(hdc);
        DestroyIcon(icon).ok();

        if draw_result.is_err() {
            return None;
        }

        // BGRA → RGBA
        for chunk in pixels.chunks_exact_mut(4) {
            chunk.swap(0, 2);
        }

        // Encode to PNG
        let img = image::RgbaImage::from_raw(size as u32, size as u32, pixels)?;
        let mut png_bytes = std::io::Cursor::new(Vec::new());
        img.write_to(&mut png_bytes, image::ImageFormat::Png).ok()?;

        let b64 = base64::engine::general_purpose::STANDARD.encode(png_bytes.into_inner());
        Some(b64)
    }
}

#[cfg(not(windows))]
fn extract_icon(_exe_path: &PathBuf) -> Option<String> {
    None
}
