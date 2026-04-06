#[tauri::command]
fn get_backend_dir() -> String {
    let manifest_dir = env!("CARGO_MANIFEST_DIR"); // src-tauri/
    let project_root = std::path::Path::new(manifest_dir)
        .parent() // ui/
        .and_then(|p| p.parent()) // loom/
        .expect("could not resolve project root");
    project_root.join("backend").to_string_lossy().into_owned()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_backend_dir])
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(target_os = "linux")]
            {
                use tauri::Manager;
                use gtk::prelude::GtkWindowExt;

                let window = app
                    .get_webview_window("main")
                    .expect("'main' window not found");
                let gtk_window = window
                    .gtk_window()
                    .expect("failed to get gtk window");
                gtk_window.set_titlebar(Option::<&gtk::Widget>::None);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
