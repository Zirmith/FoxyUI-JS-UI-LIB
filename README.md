# 🐾 FoxyUI

FoxyUI is a stateless JavaScript UI library for draggable windows, tabs, commands, keybinds, and notifications.

## Installation

```html
<script src="foxyui.js"></script>
```

## Quick start

```javascript
const win = FoxyUI.createWindow({ title: "My Tool", width: 640, height: 420 });
win.addTab({ name: "Home", html: "<h2>Hello from FoxyUI</h2>" });
win.addButton("Notify", () => FoxyUI.showToast("It works!", { type: "success" }));
```

## Themes

Switch at runtime:

```javascript
FoxyUI.setTheme("dark");
FoxyUI.setTheme("twitch");
FoxyUI.setTheme("imgui");
```

Built-in themes include:
- `dark`
- `light`
- `animated_dark`
- `animated_light`
- `amoled`
- `foxy`
- `cyberpunk`
- `synthwave`
- `aurora`
- `nebula`
- `twitch`
- `imgui`

Get all available themes:

```javascript
console.log(FoxyUI.getThemes());
```

## Examples

Open these files directly in your browser:

- `examples/basic/index.html` – basic window + tabs + toast usage.
- `examples/themes/twitch.html` – Twitch-styled layout example.
- `examples/themes/imgui.html` – ImGui-styled layout example.

## Creating your own layout/theme

```javascript
FoxyUI.registerTheme("my_theme", {
  windowBg: "#101318",
  surface: "#1a2029",
  surfaceAlt: "#131821",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  header: "#1f2937",
  tabActive: "rgba(99, 102, 241, 0.3)",
  tabInactive: "#94a3b8",
  tabHover: "rgba(99, 102, 241, 0.15)",
  inputBg: "#0f172a",
  inputBorder: "#334155",
  buttonBg: "#4f46e5",
  buttonHover: "#4338ca",
  buttonText: "#fff",
  placeholder: "#64748b",
  accent: "#6366f1",
  accentHover: "#4f46e5",
  toastInfo: "#6366f1",
  toastSuccess: "#22c55e",
  toastError: "#ef4444",
  online: "#22c55e",
  idle: "#f59e0b",
  dnd: "#ef4444",
  offline: "#64748b",
  divider: "rgba(255,255,255,0.08)",
  mention: "#ef4444"
});
FoxyUI.setTheme("my_theme");
```

## License

MIT
