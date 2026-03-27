import { create } from 'zustand';

export const useMascotStore = create((set) => ({
  isVisible: false,
  expression: "happy",
  message: "",
  submessage: "",
  autoDismiss: true,
  dismissDelay: 3000,

  show: ({ expression = "happy", message = "", submessage = "", autoDismiss = true, dismissDelay = 3000 }) => {
    set({
      isVisible: true,
      expression,
      message,
      submessage,
      autoDismiss,
      dismissDelay
    });
  },

  hide: () => set({ isVisible: false }),
}));
