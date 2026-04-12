/** Returns a stable, browser-local device ID stored in localStorage */
export function getDeviceId(): string {
    try {
        let id = localStorage.getItem("hm_device_id");
        if (!id) {
            id = "dev_" + Math.random().toString(36).substring(2, 11);
            localStorage.setItem("hm_device_id", id);
        }
        return id;
    } catch {
        return "dev_fallback_" + Math.random().toString(36).substring(2, 11);
    }
}
