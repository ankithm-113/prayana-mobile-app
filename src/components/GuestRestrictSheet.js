import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { useGuestSheetStore } from '../store/guestSheetStore';

const { width } = Dimensions.get('window');

/**
 * GuestRestrictSheet — Global bottom sheet shown when a guest taps a restricted feature.
 * Render this once in App.js so it floats above all screens.
 *
 * Usage from any screen:
 *   const { open } = useGuestSheetStore();
 *   open('saving destinations');   // Pass a feature name for the message
 */
const GuestRestrictSheet = ({ onLoginPress }) => {
  const { isOpen, featureName, close } = useGuestSheetStore();

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close} />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <Text style={styles.lock}>🔒</Text>
        <Text style={styles.title}>Login Required</Text>
        <Text style={styles.body}>
          {`${featureName.charAt(0).toUpperCase() + featureName.slice(1)} requires an account. It's free and takes 30 seconds!`}
        </Text>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => { close(); onLoginPress?.(); }}
          activeOpacity={0.85}
        >
          <Text style={styles.loginBtnText}>📱 Login with Phone</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.guestBtn} onPress={close} activeOpacity={0.75}>
          <Text style={styles.guestBtnText}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    alignItems: 'center',
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -6 },
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0D4C0',
    marginBottom: 20,
  },
  lock: { fontSize: 36, marginBottom: 12 },
  title: {
    fontFamily: 'Playfair Display',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1208',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: '#8A7A64',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: '#C8102E',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  guestBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0D4C0',
  },
  guestBtnText: { color: '#3D1A08', fontWeight: '600', fontSize: 15 },
});

export default GuestRestrictSheet;
