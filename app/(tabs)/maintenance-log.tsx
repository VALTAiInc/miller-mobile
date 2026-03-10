// app/(tabs)/maintenance-log.tsx
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";

const ACCENT = "#f16109";

type LogEntry = {
  id: string;
  title: string;
  notes: string;
  ts: number;
  photoUri?: string;
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function JobLogScreen() {
  const insets = useSafeAreaInsets();
  const topPad = useMemo(() => Math.max(insets.top + 10, 18), [insets.top]);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  const [entries, setEntries] = useState<LogEntry[]>([
    {
      id: uid(),
      title: "Demo: 0.035 wire / 75-25 gas",
      notes: "Adjusted WFS up slightly; improved wet-out on fillet.",
      ts: Date.now() - 60 * 60 * 1000,
    },
    {
      id: uid(),
      title: "Demo: porosity check",
      notes: "Found draft near bay door; increased flow + repositioned.",
      ts: Date.now() - 4 * 60 * 60 * 1000,
    },
  ]);

  const clearAll = () => {
    Alert.alert("Clear log?", "Remove all demo entries?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => setEntries([]) },
    ]);
  };

  const addEntryWithCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Camera permission", "Please allow camera access to add a photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: false,
      });

      if (result.canceled) return;

      const photoUri = result.assets?.[0]?.uri;

      const t = title.trim() || "Demo entry";
      const n = notes.trim() || "Photo captured (demo).";

      const entry: LogEntry = {
        id: uid(),
        title: t,
        notes: n,
        ts: Date.now(),
        photoUri,
      };

      setEntries((prev) => [entry, ...prev]);
      setTitle("");
      setNotes("");
    } catch (e) {
      console.log("Camera add entry error:", e);
      Alert.alert("Couldn't open camera", "Try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <View style={styles.headerRow}>
          <Text style={styles.h1}>Job Log</Text>

          <Pressable
            onPress={clearAll}
            style={({ pressed }) => [
              styles.trashButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <Ionicons name="trash-outline" size={18} color="#777" />
          </Pressable>
        </View>

        <Text style={styles.sub}>Demo notes for settings, tweaks, and outcomes.</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title (ex: MIG 3G fillet, 0.035 wire)…"
            placeholderTextColor="#555"
            style={styles.input}
          />

          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes (what changed / what worked)…"
            placeholderTextColor="#555"
            style={[styles.input, styles.notes]}
            multiline
          />

          <View style={styles.actionsRow}>
            <Pressable
              onPress={addEntryWithCamera}
              style={({ pressed }) => [
                styles.addButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Ionicons name="add" size={18} color="#000" />
              <Text style={styles.addText}>Add entry</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 10 }} />

        {entries.map((e) => (
          <View key={e.id} style={styles.entryCard}>
            <Text style={styles.entryTitle}>{e.title}</Text>
            <Text style={styles.entryNotes}>{e.notes}</Text>

            {e.photoUri ? (
              <Image source={{ uri: e.photoUri }} style={styles.thumb} resizeMode="cover" />
            ) : null}

            <Text style={styles.entryTime}>
              {new Date(e.ts).toLocaleString([], {
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  header: { paddingHorizontal: 18, paddingBottom: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h1: { fontSize: 48, color: "#fff", fontWeight: "800" },
  sub: { marginTop: 8, fontSize: 18, color: "#8b8b8b", lineHeight: 24 },

  trashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "#1c1c1c",
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    marginTop: 12,
    marginHorizontal: 18,
    backgroundColor: "#111",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1c1c1c",
  },

  input: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#0b0b0b",
    borderWidth: 1,
    borderColor: "#1c1c1c",
    color: "#fff",
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  notes: {
    height: 110,
    paddingTop: 14,
    textAlignVertical: "top",
  },

  actionsRow: { flexDirection: "row", justifyContent: "flex-end" },
  addButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: ACCENT,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addText: { color: "#000", fontSize: 18, fontWeight: "900" },

  entryCard: {
    marginTop: 14,
    marginHorizontal: 18,
    backgroundColor: "#111",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1c1c1c",
  },
  entryTitle: { color: "#fff", fontSize: 22, fontWeight: "900" },
  entryNotes: { marginTop: 8, color: "#d0d0d0", fontSize: 17, lineHeight: 24 },
  entryTime: { marginTop: 10, color: "#6b6b6b", fontSize: 13 },

  thumb: {
    marginTop: 12,
    width: "100%",
    height: 180,
    borderRadius: 16,
    backgroundColor: "#0b0b0b",
  },

  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});