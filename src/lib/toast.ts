// One toast for the whole site. Demos call demoToast() for anything that would really send, save or download.
export function demoToast(message: string) {
  window.dispatchEvent(new CustomEvent('demo-toast', { detail: message }));
}
