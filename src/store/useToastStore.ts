import { create } from 'zustand';

export type ToastKind = 'ok' | 'err' | 'info';

export interface Toast {
  id: number;
  text: string;
  kind: ToastKind;
}

export const TOAST_MS = 4000;

interface ToastState {
  toasts: Toast[];
  show: (text: string, kind?: ToastKind) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  show: (text, kind = 'ok') => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, text, kind }] });
    setTimeout(() => get().dismiss(id), TOAST_MS);
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}));
