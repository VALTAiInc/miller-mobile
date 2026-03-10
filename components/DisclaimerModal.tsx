import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";

interface Props {
  visible: boolean;
  onAccept: () => void;
}

export default function DisclaimerModal({ visible, onAccept }: Props) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Important Notice</Text>

            <Text style={styles.body}>
              WeldWise is an AI-powered guidance tool designed to assist
              welding professionals with troubleshooting, setup, and process
              recommendations.
            </Text>

            <Text style={styles.body}>
              This application does not replace formal training, certified
              supervision, inspection, or professional judgment.
            </Text>

            <Text style={styles.body}>
              Always follow workplace safety standards, union guidelines,
              and manufacturer specifications. You are responsible for
              verifying all procedures before performing any weld.
            </Text>

            <Text style={styles.body}>
              By continuing, you acknowledge that WeldWise is a support
              tool and not a substitute for qualified human oversight.
            </Text>
          </ScrollView>

          <Pressable style={styles.button} onPress={onAccept}>
            <Text style={styles.buttonText}>I Understand</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#141414",
    borderRadius: 20,
    padding: 24,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 16,
  },
  body: {
    fontSize: 15,
    color: "#d0d0d0",
    marginBottom: 14,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#f16109",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontWeight: "800",
  },
});