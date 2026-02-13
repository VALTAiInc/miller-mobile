import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import Colors from "../../constants/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A0C10", "#111520", "#0A0C10"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: topInset + 24, paddingBottom: bottomInset + 100 }]}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/images/LOGOVALT.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.heroCard}>
          <Image
            source={require("../../assets/images/HEROIMAGE.jpg")}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.85)"]}
            style={styles.heroOverlay}
          />
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>HYDMECH S-20 Series III</Text>
            <Text style={styles.heroSubtitle}>
              Your AI-powered bandsaw mentor is ready to help with setup, operation, troubleshooting, and safety.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push("/(tabs)/talk")}
          style={({ pressed }) => [
            styles.ctaButton,
            pressed && styles.ctaButtonPressed,
          ]}
        >
          <LinearGradient
            colors={[Colors.dark.tint, Colors.dark.accentDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <Ionicons name="chatbubbles" size={22} color="#fff" />
            <Text style={styles.ctaText}>ASK YOUR MENTOR</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>

        <Text style={styles.footerText}>
          Powered by SAWWISE AI
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: SCREEN_WIDTH * 0.5,
    height: 80,
  },
  heroCard: {
    width: "100%",
    height: 280,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Colors.dark.surface,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  heroTextContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
  },
  ctaButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 16,
  },
  ctaButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  ctaText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 1.5,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textMuted,
    marginTop: 8,
  },
});
