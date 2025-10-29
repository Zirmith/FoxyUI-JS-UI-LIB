# 🐾 FoxyUI v14

FoxyUI is a **lightweight, stateless, JavaScript GUI library** for building custom windows, tabs, buttons, and notifications in the browser. Perfect for **tools, extensions, overlays, debugging utilities, and web apps** without relying on frameworks or localStorage.

---

## 🔥 Features

- **Modern, sleek interface** with dark/light themes and full customization.
- **Windows**: draggable, resizable, minimizable, closable.
- **Tabs**: organize content with tab headers and icons.
- **Footer buttons**: add functional buttons easily.
- **Toasts**: notifications with info, success, error types, auto-close or persistent.
- **Keybinds**: bind global keyboard shortcuts.
- **Plugin system**: extend functionality dynamically.
- **Window merging**: merge overlapping windows and undo merges (Ctrl+Z).
- **Event system**: handle `tabClicked`, `tabRemoved`, `windowCreated`, `windowClosed` and custom events.
- **Stateless**: no localStorage dependencies—perfect for temporary tools or sandboxed environments.
- **Performance-friendly**: minimal overhead, optimized for fast UIs.
- **Cross-browser**: works in all modern browsers.

---

## 📥 Installation

Include FoxyUI in your project:

```html
<script src="foxyui.js"></script>
```

> Or inject directly in the browser console for testing.

---

## ⚡ Quick Start

### Create a Window

```javascript
const myWindow = FoxyUI.createWindow({
  title: "My Tool",
  width: 500,
  height: 400,
  icon: "icon.png",
  resizable: true,
  movable: true,
  minimizable: true,
  defaultTab: 0,
  onOpen: () => console.log("Window opened"),
  onClose: () => console.log("Window closed")
});
```

### Add Tabs

```javascript
myWindow.addTab({ name: "Home", html: "<h2>Welcome!</h2>", icon: "home.png" });
myWindow.addTab({ name: "Settings", html: "<div>Settings content here</div>" });
```

### Add Footer Buttons

```javascript
myWindow.addButton("Click Me", () => alert("Button clicked!"));
```

### Show Toasts

```javascript
FoxyUI.showToast("Hello World!", { type: "success", duration: 3000 });
FoxyUI.showToast("Error occurred!", { type: "error", persistent: true });
```

### Register Keybinds

```javascript
FoxyUI.addKeybind("ctrl+s", () => console.log("Ctrl+S pressed"));
```

### Undo Window Merge

```javascript
FoxyUI.undoMerge(); // Also bound to Ctrl+Z
```

---

## 🎨 Customization & Theming

FoxyUI allows full control over appearance via `_settings`:

```javascript
FoxyUI._settings.colors.windowBg = "#1e1e1e";
FoxyUI._settings.colors.text = "#ffffff";
FoxyUI._settings.colors.header = "#333";
FoxyUI._settings.font = "Arial, sans-serif";
```

- Modify toast colors, button colors, input backgrounds, tab colors, and placeholders.
- Fonts are customizable globally.
- Dynamically updating `_settings` will reflect in existing windows immediately.

---

## 🧩 Plugin System

```javascript
FoxyUI.registerPlugin("ExamplePlugin", (FUI) => {
  console.log("Plugin loaded~", FUI);
});
```

Load plugins dynamically from URLs:

```javascript
FoxyUI.loadPluginFromURL("https://example.com/plugin.js");
```

---

## 📌 Event System

```javascript
FoxyUI.on("tabClicked", (window, tab) => console.log("Tab clicked:", tab));
FoxyUI.on("tabRemoved", (window, tab) => console.log("Tab removed:", tab));
FoxyUI.on("windowCreated", (window) => console.log("Window created:", window));
FoxyUI.on("windowClosed", (window) => console.log("Window closed:", window));
```

Emit custom events:

```javascript
FoxyUI.emit("customEvent", { data: 123 });
```

---

## 🚀 Advanced Usage

### Dynamic Tab Editing

```javascript
const tab = myWindow.addTab({ name: "Temp", html: "<p>Initial</p>" });
myWindow.editTab(tab, { name: "Updated", html: "<p>Updated content</p>" });
```

### Remove Tabs

```javascript
myWindow.removeTab(tab);
```

### Watching Key Events Globally

```javascript
FoxyUI.addKeybind("ctrl+shift+h", () => FoxyUI.showToast("Hotkey triggered!", { type: "info" }));
```

### Combining Windows

- Drag one window onto another to merge.
- Undo merges with **Ctrl+Z**.

### Toast Options

```javascript
FoxyUI.showToast("Persistent message", { type: "info", persistent: true });
FoxyUI.showToast("Quick tip", { type: "success", duration: 1000 });
```

---

## 💡 Tips & Best Practices

- Use **stateless mode** for temporary tools.
- Combine with **custom game hooks** or **debug tools** (Canvas, WebGL, DOM events).
- Use plugins to modularize features in large projects.
- Undo merges regularly to avoid losing windows.
- Customize colors to match your app/game theme.

---

## 🔗 Example Project

```javascript
// Create main window
const mainWin = FoxyUI.createWindow({ title: "Dashboard", width: 600, height: 400 });
mainWin.addTab({ name: "Logs", html: "<div id='logs'></div>" });
mainWin.addButton("Clear Logs", () => document.getElementById("logs").innerHTML = "");

// Show notification
FoxyUI.showToast("Welcome to Dashboard!", { type: "success" });
```

---

## 📦 License

FoxyUI v14 is **open-source** and free to use for personal and commercial projects.

---

> Made with 🐾 by [Your Name]
