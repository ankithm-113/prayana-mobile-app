import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
  Dimensions,
} from 'react-native';
import Rate, { AndroidMarket } from "react-native-rate";
import { trackEvent } from "../services/analytics";
import MascotSVG from "./mascot/MascotSVG";

const { height } = Dimensions.get('window');

const RatingPromptSheet = ({ visible, onClose, userId }) => {
  
  const handleRateNow = () => {
    const options = {
      AppleAppID: "not-used",
      GooglePackageName: "com.prayana",
      preferredAndroidMarket: AndroidMarket.Google,
      openAppStoreIfInAppReviewFails: true,
    };
    
    trackEvent("rating_positive_tapped");
    
    Rate.rate(options, (success) => {
      if (success) {
        trackEvent("rating_submitted");
      }
    });
    onClose();
  };

  const handleFeedback = () => {
    trackEvent("rating_negative_tapped");
    Linking.openURL("mailto:hello@prayana.app?subject=Prayana Feedback");
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.mascotContainer}>
            <MascotSVG expression="happy" size={80} />
          </View>
          
          <Text style={s.title}>Enjoying Prayana? 🙏</Text>
          <Text style={s.sub}>Your rating helps other Karnataka travellers find us</Text>

          <TouchableOpacity style={s.positiveBtn} onPress={handleRateNow}>
            <Text style={s.positiveTxt}>❤️ Yes, I love it!</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.negativeBtn} onPress={handleFeedback}>
            <Text style={s.negativeTxt}>Could be better</Text>
          </TouchableOpacity>

          <Text style={s.footer}>Takes 10 seconds. Means the world to us.</Text>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 30,
    alignItems: 'center',
    height: 320,
  },
  mascotContainer: {
    marginTop: -70,
    backgroundColor: '#FFF',
    borderRadius: 50,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  title: {
    fontFamily: 'Playfair Display',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1208',
    marginTop: 15,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: '#8A7A64',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  positiveBtn: {
    width: '100%',
    backgroundColor: '#C8102E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  positiveTxt: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  negativeBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  negativeTxt: {
    color: '#8A7A64',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    fontSize: 11,
    color: '#B0A090',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default RatingPromptSheet;
