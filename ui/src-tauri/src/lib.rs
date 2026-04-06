#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
