// app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DisclaimerModal from "../components/DisclaimerModal";

export default function RootLayout() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const checkDisclaimer = async () => {
      const accepted = await AsyncStorage.getItem("disclaimerAccepted");
      if (!accepted) {
        setShowDisclaimer(true);
      }
    };

    checkDisclaimer();
  }, []);

  const handleAcceptDisclaimer = async () => {
    await AsyncStorage.setItem("disclaimerAccepted", "true");
    setShowDisclaimer(false);
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>

      <DisclaimerModal
        visible={showDisclaimer}
        onAccept={handleAcceptDisclaimer}
      />
    </>
  );
}