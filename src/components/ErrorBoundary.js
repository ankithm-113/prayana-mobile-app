import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { db } from '../services/firebase';
import { serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import RNRestart from 'react-native-restart';
import MascotSVG from './mascot/MascotSVG';
import colors from '../theme/colors';
import crashlytics from '@react-native-firebase/crashlytics';

const { width } = Dimensions.get('window');

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Session 25 — Crashlytics
    try {
      crashlytics().recordError(error);
      crashlytics().log(`Screen: ${this.props.screenName || "unknown"}`);
      crashlytics().log(`Stack: ${info.componentStack}`);
    } catch (e) {
      console.error("Crashlytics record failed:", e);
    }
  }

  handleRestart = () => {
    if (RNRestart && typeof RNRestart.Restart === 'function') {
      RNRestart.Restart();
    } else {
      console.warn("RNRestart.Restart is not available.");
      this.setState({ hasError: false, error: null });
    }
  };

  handleGoHome = () => {
    // This is a simple reset, might need adjustment based on navigation ref
    this.setState({ hasError: false, error: null });
    // If we have a navigation ref passed via props, we could use it here
    if (this.props.navigation) {
      this.props.navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } else {
      if (RNRestart && typeof RNRestart.Restart === 'function') {
        RNRestart.Restart();
      } else {
        this.setState({ hasError: false, error: null });
      }
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <MascotSVG expression="sad" size={150} />
          <Text style={styles.title}>Something went wrong 🙁</Text>
          <Text style={styles.subtext}>
            We have noted this issue. Please restart the app.
          </Text>
          
          <TouchableOpacity style={styles.button} onPress={this.handleRestart}>
            <Text style={styles.buttonText}>Restart App</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={this.handleGoHome}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Go Home</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'Playfair Display',
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: 20,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    color: colors.dark + '80',
    marginTop: 10,
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.red,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: width * 0.7,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.red,
  },
  secondaryButtonText: {
    color: colors.red,
  }
});

export default ErrorBoundary;
