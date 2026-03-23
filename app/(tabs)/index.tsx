// app/(tabs)/index.tsx
import React, { useState } from "react";
import {
  StyleSheet, Text, View, Image, Pressable,
  Platform, SafeAreaView, StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import TranslatorModal from "../screens/translator";

const MILLER_BLUE = "#0066CC";
const heroImage = require("../../assets/images/HEROIMAGE.jpg");
const logoImage = require("../../assets/images/logo1.png");

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [translatorVisible, setTranslatorVisible] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top + 12, 24);
  const bottomPad = Math.max(insets.bottom, 14) + 92;

  const handleAskExpert = () => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(tabs)/talk");
  };

  const handleTranslator = () => {
    if (Platform.OS !== "web") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTranslatorVisible(true);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>

        <View style={styles.logoContainer}>
          <Image source={logoImage} style={styles.logo} resizeMode="contain" />
          <Text style={styles.poweredBy}>Powered by VALT</Text>
        </View>

        <View style={styles.heroCard}>
          <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroTextBox}>
            <Text style={styles.heroTitle}>CONTINUUM™</Text>
            <Text style={styles.heroSubtitle}>Advanced MIG Intelligence</Text>
          </View>
        </View>

        <View style={styles.ctaContainer}>
          <Pressable
            onPress={handleAskExpert}
            style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            <Text style={styles.ctaText}>ASK YOUR EXPERT</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleTranslator}
          style={({ pressed }) => [styles.translatorButton, pressed && styles.translatorButtonPressed]}
        >
          <View style={styles.translatorGlobe}>
            <Ionicons name="globe-outline" size={14} color="#fff" />
          </View>
          <Text style={styles.translatorText}>Translator</Text>
        </Pressable>

      </View>

      <TranslatorModal
        visible={translatorVisible}
        onClose={() => setTranslatorVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0C10" },
  content: { flex: 1, paddingHorizontal: 20 },
  logoContainer: { alignItems: "center", marginBottom: 12 },
  logo: { width: 340, height: 120 },
  poweredBy: { color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 4, letterSpacing: 0.5 },
  heroCard: { borderRadius: 26, overflow: "hidden", backgroundColor: "#111", marginBottom: 14 },
  heroImage: { width: "100%", height: 235 },
  heroTextBox: { paddingHorizontal: 18, paddingVertical: 16, backgroundColor: "rgba(0,0,0,0.72)", alignItems: "center" },
  heroTitle: { fontSize: 32, color: "#fff", letterSpacing: 2, fontWeight: "900", textAlign: "center" },
  heroSubtitle: { marginTop: 8, fontSize: 18, color: "#cfcfcf", textAlign: "center" },
  ctaContainer: { marginTop: 10, marginBottom: 12 },
  ctaButton: { backgroundColor: "#0066CC", borderRadius: 34, paddingVertical: 16, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  ctaButtonPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  ctaText: { fontSize: 16, color: "#fff", letterSpacing: 0.5, fontWeight: "900" },
  translatorButton: { alignSelf: "center", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: "#0066CC", borderRadius: 34, paddingVertical: 9, paddingHorizontal: 28, backgroundColor: "#111" },
  translatorButtonPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  translatorGlobe: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#0066CC", alignItems: "center", justifyContent: "center" },
  translatorText: { color: "#0066CC", fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
});
