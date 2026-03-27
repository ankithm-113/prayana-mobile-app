import { create } from 'zustand';

export const useSOSStore = create((set) => ({
  isOpen: false,
  setOpen: (val) => set({ isOpen: val }),
}));
