type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

const toasts: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

export const useToast = () => {
  const show = (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `${type}-${Date.now()}`;
    const toast: Toast = { id, message, type, duration };
    toasts.push(toast);
    listeners.forEach(l => l([...toasts]));

    if (duration > 0) {
      setTimeout(() => {
        const index = toasts.findIndex(t => t.id === id);
        if (index >= 0) {
          toasts.splice(index, 1);
          listeners.forEach(l => l([...toasts]));
        }
      }, duration);
    }
  };

  const subscribe = (callback: (toasts: Toast[]) => void) => {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter(l => l !== callback);
    };
  };

  return { show, subscribe, toasts: [...toasts] };
};

export const toast = {
  success: (msg: string) => useToast().show(msg, 'success', 3000),
  error: (msg: string) => useToast().show(msg, 'error', 4000),
  warning: (msg: string) => useToast().show(msg, 'warning', 3500),
  info: (msg: string) => useToast().show(msg, 'info', 3000),
};
