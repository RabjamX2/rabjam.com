/**
 * Persistent UI layout store backed by localStorage.
 * Use as: uiMode.value (read), uiMode.set(id) (write)
 */

const STORAGE_KEY = "pokerUiMode";
const DEFAULT = "desktop";

let _mode = $state(typeof localStorage !== "undefined" ? (localStorage.getItem(STORAGE_KEY) ?? DEFAULT) : DEFAULT);

export const uiMode = {
    get value() {
        return _mode;
    },
    set(v) {
        _mode = v;
        if (typeof localStorage !== "undefined") {
            localStorage.setItem(STORAGE_KEY, v);
        }
    },
};

export const LAYOUTS = [
    { id: "desktop", label: "🖥 Desktop", desc: "Oval table view" },
    { id: "mobile", label: "📱 Mobile", desc: "Stacked mobile view" },
];
