use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;
use uuid::Uuid;

fn find_make_cia() -> Option<PathBuf> {
    let exe_dir = std::env::current_exe().ok()?.parent()?.to_path_buf();
    let name = if cfg!(target_os = "windows") { "make_cia.exe" } else { "make_cia" };
    let p = exe_dir.join(name);
    if p.exists() { return Some(p); }
    // fallback PATH
    let which = if cfg!(target_os = "windows") { "where" } else { "which" };
    if let Ok(out) = Command::new(which).arg(name).output() {
        if out.status.success() {
            let p = String::from_utf8_lossy(&out.stdout).lines().next().map(PathBuf::from);
            if let Some(ref p) = p { if p.exists() { return Some(p.clone()); } }
        }
    }
    None
}

#[tauri::command]
fn make_cia(nds_data: Vec<u8>, _file_name: String) -> Result<Vec<u8>, String> {
    let makerom = find_make_cia().ok_or_else(|| "make_cia.exe not found next to multitools.exe".to_string())?;

    let tmp_dir = std::env::temp_dir();
    let id = Uuid::new_v4();
    let nds_path = tmp_dir.join(format!("{}.nds", id));

    std::fs::write(&nds_path, &nds_data).map_err(|e| format!("Failed to write NDS: {}", e))?;

    let status = Command::new(makerom)
        .arg(format!("--srl={}", nds_path.display()))
        .current_dir(&tmp_dir)
        .status()
        .map_err(|e| format!("Failed to run make_cia: {}", e))?;

    if !status.success() {
        let _ = std::fs::remove_file(&nds_path);
        return Err(format!("make_cia exited with code: {:?}", status.code()));
    }

    // make_cia génère le .cia auto-nommé dans le dossier courant
    // Cherche le fichier .cia fraîchement créé
    let cia_path = std::fs::read_dir(&tmp_dir)
        .map_err(|e| format!("Failed to read tmp dir: {}", e))?
        .filter_map(|e| e.ok())
        .filter(|e| e.file_name().to_string_lossy().ends_with(".cia"))
        .filter(|e| e.file_name().to_string_lossy().contains(&id.to_string()))
        .map(|e| e.path())
        .next()
        .ok_or_else(|| {
            let _ = std::fs::remove_file(&nds_path);
            "make_cia did not produce a CIA file".to_string()
        })?;

    let cia_data = std::fs::read(&cia_path)
        .map_err(|e| format!("Failed to read CIA: {}", e))?;

    let _ = std::fs::remove_file(&nds_path);
    let _ = std::fs::remove_file(&cia_path);

    Ok(cia_data)
}

#[tauri::command]
fn check_make_cia() -> Result<bool, String> {
    Ok(find_make_cia().is_some())
}

#[tauri::command]
fn read_template(app_handle: tauri::AppHandle, id: String) -> Result<Vec<u8>, String> {
    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("templates")
        .join(format!("{}.nds", id));

    if resource_path.exists() {
        std::fs::read(&resource_path).map_err(|e| format!("Failed to read template: {}", e))
    } else {
        Err(format!("Template {} not found locally", id))
    }
}

#[tauri::command]
fn read_forwarder_list(app_handle: tauri::AppHandle) -> Result<String, String> {
    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("templates")
        .join("list.txt");

    if resource_path.exists() {
        std::fs::read_to_string(&resource_path)
            .map_err(|e| format!("Failed to read list.txt: {}", e))
    } else {
        Err("list.txt not found in templates".to_string())
    }
}

#[tauri::command]
fn read_forwarder_card(app_handle: tauri::AppHandle, id: String) -> Result<String, String> {
    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("templates")
        .join(format!("{}.fwd", id));

    if resource_path.exists() {
        std::fs::read_to_string(&resource_path)
            .map_err(|e| format!("Failed to read {}.fwd: {}", id, e))
    } else {
        Err(format!("Forwarder card {} not found locally", id))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            make_cia,
            check_make_cia,
            read_template,
            read_forwarder_list,
            read_forwarder_card,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
