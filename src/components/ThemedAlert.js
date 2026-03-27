import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAlertStore } from '../store/alertStore';
import colors from '../theme/colors';

const { width } = Dimensions.get('window');

const ThemedAlert = () => {
  const { visible, title, message, buttons, hideAlert } = useAlertStore();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={hideAlert}
    >
      <View style={s.overlay}>
        <View style={s.alertContainer}>
          <LinearGradient
            colors={['#2D1A0A', '#1A1208']}
            style={s.gradient}
          >
            {title ? <Text style={s.title}>{title}</Text> : null}
            <Text style={s.message}>{message}</Text>

            <View style={s.buttonContainer}>
              {buttons.map((btn, index) => {
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      s.button,
                      index > 0 && s.buttonMargin,
                      isDestructive && s.destructiveButton,
                      isCancel && s.cancelButton
                    ]}
                    onPress={() => {
                      hideAlert();
                      if (btn.onPress) btn.onPress();
                    }}
                  >
                    <Text style={[
                      s.buttonText,
                      isCancel && s.cancelText,
                      isDestructive && s.destructiveText
                    ]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  alertContainer: {
    width: width - 60,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  gradient: {
    padding: 24,
    paddingTop: 28,
  },
  title: {
    fontFamily: 'Playfair Display',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'column',
  },
  button: {
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonMargin: {
    marginTop: 10,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  destructiveButton: {
    backgroundColor: 'rgba(200,16,46,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(200,16,46,0.3)',
  },
  destructiveText: {
    color: '#FF4D85',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 'normal',
  },
});

export default ThemedAlert;
