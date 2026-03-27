import { create } from 'zustand';

export const useAlertStore = create((set) => ({
  visible: false,
  title: '',
  message: '',
  buttons: [], // [{ text, onPress, style: 'default' | 'cancel' | 'destructive' }]
  
  /**
   * Show a themed alert
   * @param {string} title 
   * @param {string} message 
   * @param {Array} buttons 
   */
  showAlert: (title, message, buttons = []) => {
    set({
      visible: true,
      title,
      message,
      buttons: buttons.length > 0 ? buttons : [{ text: 'OK' }]
    });
  },

  hideAlert: () => set({ visible: false, title: '', message: '', buttons: [] }),
}));
