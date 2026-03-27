import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../theme/colors';

const ForceUpdateScreen = () => {
  const handleUpdate = () => {
    // Market URI for Android. For iOS use itms-apps://itunes.apple.com/app/idXXXXX
    Linking.openURL("market://details?id=com.prayana"); 
  };

  return (
    <LinearGradient colors={['#0D0500', '#C8102E']} style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../../../assets/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>App Update Required 🔄</Text>
        
        <Text style={styles.message}>
          This version of Prayana is no longer supported. 
          Please update to continue your Karnataka journey.
        </Text>

        <TouchableOpacity 
          style={styles.button}
          onPress={handleUpdate}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Update Now</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Explore Karnataka with confidence.
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '85%',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 30,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 30,
  },
  title: {
    fontFamily: 'Playfair Display',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5C518',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#F5C518',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: '#3D1A08',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    marginTop: 30,
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  }
});

export default ForceUpdateScreen;
