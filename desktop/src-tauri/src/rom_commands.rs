use std::path::PathBuf;
use std::process::Command;
use serde::{Deserialize, Serialize};
use tauri::Manager;

fn bin_dir(app: &tauri::AppHandle) -> PathBuf {
    app.path().resource_dir()
        .map(|d| d.join("../../back/bin"))
        .unwrap_or_else(|_| PathBuf::from("../../back/bin"))
}

fn tool_path(app: &tauri::AppHandle, name: &str) -> String {
    let p = bin_dir(app).join(name);
    if p.exists() { p.to_string_lossy().to_string() } else { name.to_string() }
}

#[derive(Serialize)]
pub struct FileEntry {
    pub name: String,
    pub size: u64,
    pub mtime: f64,
}

#[derive(Serialize)]
pub struct BrowseResult {
    pub ok: bool,
    pub dir: String,
    pub files: Vec<FileEntry>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct ROMActionResult {
    pub ok: bool,
    pub output: Option<String>,
    pub stdout: Option<String>,
    pub stderr: Option<String>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct ExtendedInfoResult {
    pub ok: bool,
    pub info: Option<String>,
    pub icon_base64: Option<String>,
    pub error: Option<String>,
}

#[derive(Deserialize)]
pub struct BrowseArgs {
    pub path: String,
}

#[derive(Deserialize)]
pub struct PathArgs {
    pub path: String,
}

#[derive(Deserialize)]
pub struct CompressArgs {
    pub path: String,
    pub level: Option<u8>,
}

#[tauri::command]
pub fn rom_browse(args: BrowseArgs) -> BrowseResult {
    let dir = args.path;
    let exts = [".3ds", ".cci", ".cia", ".z3ds", ".zcci", ".zcia"];
    match std::fs::read_dir(&dir) {
        Ok(entries) => {
            let mut files = Vec::new();
            for entry in entries.flatten() {
                if let Ok(meta) = entry.metadata() {
                    if meta.is_file() {
                        let name = entry.file_name().to_string_lossy().to_string();
                        let lower = name.to_lowercase();
                        if exts.iter().any(|e| lower.ends_with(e)) {
                            files.push(FileEntry {
                                name,
                                size: meta.len(),
                                mtime: meta.modified().ok().map(|t| t.duration_since(std::time::UNIX_EPOCH).ok().map(|d| d.as_secs_f64())).flatten().unwrap_or(0.0),
                            });
                        }
                    }
                }
            }
            files.sort_by(|a, b| a.name.cmp(&b.name));
            BrowseResult { ok: true, dir: dir.clone(), files, error: None }
        }
        Err(e) => BrowseResult { ok: false, dir, files: vec![], error: Some(e.to_string()) },
    }
}

#[tauri::command]
pub fn rom_info_extended(app: tauri::AppHandle, args: PathArgs) -> ExtendedInfoResult {
    let ctrtool = tool_path(&app, "ctrtool.exe");
    let seeddb = bin_dir(&app).join("seeddb.bin");

    let mut cmd = Command::new(&ctrtool);
    if seeddb.exists() {
        cmd.arg(format!("--seeddb={}", seeddb.display()));
    }
    cmd.arg(&args.path);
    let info_out = match cmd.output() {
        Ok(out) => String::from_utf8_lossy(&out.stdout).to_string(),
        Err(e) => return ExtendedInfoResult { ok: false, info: None, icon_base64: None, error: Some(e.to_string()) },
    };

    let smdh_dir = std::env::temp_dir();
    let smdh_name = format!("smdh_{}.smdh", uuid::Uuid::new_v4());
    let smdh_path = smdh_dir.join(&smdh_name);
    let mut extract = Command::new(&ctrtool);
    if seeddb.exists() {
        extract.arg(format!("--seeddb={}", seeddb.display()));
    }
    extract.arg(format!("--smdh={}", smdh_path.display())).arg(&args.path);
    let _ = extract.output();

    let icon_base64 = std::fs::read(&smdh_path).ok().and_then(|raw| {
        if raw.len() < 0x2408 + 4608 { return None; }
        let mut rgba = Vec::with_capacity(48 * 48 * 4);
        for y in 0..48 {
            for x in 0..48 {
                let si = 0x2408 + (y * 48 + x) * 2;
                let pixel = u16::from_le_bytes([raw[si], raw[si + 1]]);
                let r = ((pixel >> 11) & 0x1F) as u32 * 255 / 31;
                let g = ((pixel >> 5) & 0x3F) as u32 * 255 / 63;
                let b = (pixel & 0x1F) as u32 * 255 / 31;
                rgba.push(r as u8);
                rgba.push(g as u8);
                rgba.push(b as u8);
                rgba.push(255u8);
            }
        }
        Some(base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &rgba))
    });

    let _ = std::fs::remove_file(&smdh_path);
    ExtendedInfoResult { ok: true, info: Some(info_out), icon_base64, error: None }
}

#[tauri::command]
pub fn rom_info(app: tauri::AppHandle, args: PathArgs) -> ROMActionResult {
    let ctrtool = tool_path(&app, "ctrtool.exe");
    let seeddb = bin_dir(&app).join("seeddb.bin");
    let mut cmd = Command::new(&ctrtool);
    if seeddb.exists() {
        cmd.arg(format!("--seeddb={}", seeddb.display()));
    }
    cmd.arg(&args.path);
    match cmd.output() {
        Ok(out) => ROMActionResult {
            ok: out.status.success(),
            output: Some(String::from_utf8_lossy(&out.stdout).to_string()),
            stdout: Some(String::from_utf8_lossy(&out.stdout).to_string()),
            stderr: Some(String::from_utf8_lossy(&out.stderr).to_string()),
            error: if out.status.success() { None } else { Some(String::from_utf8_lossy(&out.stderr).to_string()) },
        },
        Err(e) => ROMActionResult { ok: false, output: None, stdout: None, stderr: None, error: Some(e.to_string()) },
    }
}

#[tauri::command]
pub fn rom_to_cia(app: tauri::AppHandle, args: PathArgs) -> ROMActionResult {
    let conv = tool_path(&app, "3dsconv.exe");
    let out = args.path.replace(".3ds", ".cia").replace(".cci", ".cia");
    if out == args.path { return ROMActionResult { ok: false, output: None, stdout: None, stderr: None, error: Some("Unsupported extension".to_string()) }; }
    match Command::new(&conv).args(["--no-fw-spoof", "--overwrite", &args.path, &out]).output() {
        Ok(r) => ROMActionResult {
            ok: r.status.success(),
            output: Some(out),
            stdout: Some(String::from_utf8_lossy(&r.stdout).to_string()),
            stderr: Some(String::from_utf8_lossy(&r.stderr).to_string()),
            error: if r.status.success() { None } else { Some(String::from_utf8_lossy(&r.stderr).to_string()) },
        },
        Err(e) => ROMActionResult { ok: false, output: None, stdout: None, stderr: None, error: Some(e.to_string()) },
    }
}

#[tauri::command]
pub fn rom_to_cci(app: tauri::AppHandle, args: PathArgs) -> ROMActionResult {
    let makerom = tool_path(&app, "makerom.exe");
    let out = args.path.replace(".cia", ".cci");
    if out == args.path { return ROMActionResult { ok: false, output: None, stdout: None, stderr: None, error: Some("Unsupported extension".to_string()) }; }
    match Command::new(&makerom).args(["-ciatocci", &args.path, "-o", &out]).output() {
        Ok(r) => ROMActionResult {
            ok: r.status.success(),
            output: Some(out),
            stdout: Some(String::from_utf8_lossy(&r.stdout).to_string()),
            stderr: Some(String::from_utf8_lossy(&r.stderr).to_string()),
            error: if r.status.success() { None } else { Some(String::from_utf8_lossy(&r.stderr).to_string()) },
        },
        Err(e) => ROMActionResult { ok: false, output: None, stdout: None, stderr: None, error: Some(e.to_string()) },
    }
}

#[tauri::command]
pub fn rom_compress(app: tauri::AppHandle, args: CompressArgs) -> ROMActionResult {
    let z3ds = tool_path(&app, "z3ds_compressor.exe");
    let lvl = args.level.unwrap_or(3).clamp(1, 9);
    let parent = std::path::Path::new(&args.path).parent().map(|p| p.to_string_lossy().to_string()).unwrap_or_default();
    match Command::new(&z3ds).arg(format!("-{}", lvl)).arg(&args.path).current_dir(&parent).output() {
        Ok(r) => ROMActionResult {
            ok: r.status.success(),
            output: None,
            stdout: Some(String::from_utf8_lossy(&r.stdout).to_string()),
            stderr: Some(String::from_utf8_lossy(&r.stderr).to_string()),
            error: if r.status.success() { None } else { Some(String::from_utf8_lossy(&r.stderr).to_string()) },
        },
        Err(e) => ROMActionResult { ok: false, output: None, stdout: None, stderr: None, error: Some(e.to_string()) },
    }
}

#[tauri::command]
pub fn rom_decompress(app: tauri::AppHandle, args: PathArgs) -> ROMActionResult {
    let z3ds = tool_path(&app, "z3ds_compressor.exe");
    let parent = std::path::Path::new(&args.path).parent().map(|p| p.to_string_lossy().to_string()).unwrap_or_default();
    match Command::new(&z3ds).arg("--decompress").arg(&args.path).current_dir(&parent).output() {
        Ok(r) => ROMActionResult {
            ok: r.status.success(),
            output: None,
            stdout: Some(String::from_utf8_lossy(&r.stdout).to_string()),
            stderr: Some(String::from_utf8_lossy(&r.stderr).to_string()),
            error: if r.status.success() { None } else { Some(String::from_utf8_lossy(&r.stderr).to_string()) },
        },
        Err(e) => ROMActionResult { ok: false, output: None, stdout: None, stderr: None, error: Some(e.to_string()) },
    }
}
