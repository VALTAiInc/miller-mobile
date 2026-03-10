// app/(tabs)/index.tsx
import React from "react";
import { StyleSheet, Text, View, Image, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "../../constants/colors";

const heroImage = require("../../assets/images/HEROIMAGE.jpg");
const logoImage = require("../../assets/images/LOGOVALT.png");

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // Keeps logo safely below the Dynamic Island / notch
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top + 12, 24);

  // Leave room for the bottom tabs so nothing gets clipped
  const bottomPad = Math.max(insets.bottom, 14) + 92;

  const handleAskMentor = () => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/(tabs)/talk");
  };

  const handleQuickAccess = (tab: string) => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/(tabs)/${tab}` as any);
  };

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={logoImage} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.heroCard}>
          <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroTextBox}>
            <Text style={styles.heroTitle}>WELDWISE</Text>
            <Text style={styles.heroSubtitle}>Mentor in your pocket</Text>
          </View>
        </View>

        <View style={styles.ctaContainer}>
          <Pressable
            onPress={handleAskMentor}
            style={({ pressed }) => [
              styles.ctaButton,
              pressed ? styles.ctaButtonPressed : null,
            ]}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={Colors.textDark} />
            <Text style={styles.ctaText}>ASK YOUR MENTOR</Text>
          </Pressable>
        </View>

        <View style={styles.quickAccessRow}>
          <Pressable
            onPress={() => handleQuickAccess("manual")}
            style={({ pressed }) => [
              styles.quickCard,
              pressed ? styles.quickCardPressed : null,
            ]}
          >
            <View style={styles.quickIconContainer}>
              <Ionicons name="document-text" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.quickLabel}>Procedures</Text>
          </Pressable>

          <Pressable
            onPress={() => handleQuickAccess("maintenance-log")}
            style={({ pressed }) => [
              styles.quickCard,
              pressed ? styles.quickCardPressed : null,
            ]}
          >
            <View style={styles.quickIconContainer}>
              <MaterialCommunityIcons name="wrench" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.quickLabel}>Job Log</Text>
          </Pressable>

          <Pressable
            onPress={() => handleQuickAccess("blueprints")}
            style={({ pressed }) => [
              styles.quickCard,
              pressed ? styles.quickCardPressed : null,
            ]}
          >
            <View style={styles.quickIconContainer}>
              <Feather name="file-text" size={19} color={Colors.primary} />
            </View>
            <Text style={styles.quickLabel}>Blueprints</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: 20 },

  logoContainer: { alignItems: "center", marginBottom: 12 },
  logo: { width: 195, height: 68 },

  heroCard: {
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: Colors.card,
    marginBottom: 14,
  },
  heroImage: { width: "100%", height: 235 },

  heroTextBox: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 44,
    color: "#fff",
    letterSpacing: 3,
    fontWeight: "900",
    textAlign: "center",
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 20,
    color: "#cfcfcf",
    textAlign: "center",
  },

  ctaContainer: { marginTop: 10, marginBottom: 14 },
  ctaButton: {
    backgroundColor: Colors.primary,
    borderRadius: 34,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaButtonPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  ctaText: {
    fontSize: 16,
    color: Colors.textDark,
    letterSpacing: 0.5,
    fontWeight: "900",
  },

  quickAccessRow: { flexDirection: "row", gap: 10 },
  quickCard: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#1b1b1b",
  },
  quickCardPressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },

  quickIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(254,119,37,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },
});