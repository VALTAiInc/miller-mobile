// app/(tabs)/manual.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import Colors from "../../constants/colors";

type Proc = {
  id: string;
  title: string;
  tags: string[];
  steps: string[];
};

const ACCENT = "#f16109";

const DEMO_PROCS: Proc[] = [
  {
    id: "p1",
    title: "Set machine for SMAW (Stick) basics",
    tags: ["SMAW", "setup", "amperage", "polarity"],
    steps: [
      "Select electrode type and diameter for the joint and material.",
      "Set amperage to the recommended range (start mid-range).",
      "Confirm polarity (DCEP/DCEN) per electrode requirements.",
      "Set arc force / hot start if available (small increases can help).",
      "Run a short test on scrap; adjust amperage for stable arc and bead profile.",
    ],
  },
  {
    id: "p2",
    title: "Set machine for GMAW (MIG) short-circuit",
    tags: ["GMAW", "MIG", "wire", "gas"],
    steps: [
      "Confirm wire diameter and matching drive rolls/contact tip.",
      "Set shielding gas and flow (typ. 20-30 CFH depending on conditions).",
      "Start with a known WFS/voltage pair; adjust for stable crackle.",
      "Check stickout (3/8-1/2 in) and travel angle (~10-15°).",
      "Inspect bead: adjust voltage for wet-out; adjust WFS for heat/penetration.",
    ],
  },
  {
    id: "p3",
    title: "Quick porosity troubleshooting checklist",
    tags: ["porosity", "gas", "drafts", "cleanup"],
    steps: [
      "Check for drafts (doors/fans) and shield the weld area.",
      "Confirm gas type and flow; inspect for leaks and empty cylinder.",
      "Inspect nozzle for spatter and ensure diffuser is clean.",
      "Confirm stickout and torch angle; keep arc in the gas envelope.",
      "Clean base material (oil, paint, rust) and dry moisture sources.",
    ],
  },
];

export default function ManualScreen() {
  const insets = useSafeAreaInsets();
  const topPad = useMemo(() => Math.max(insets.top, 18) + 14, [insets.top]);

  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>("p2");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return DEMO_PROCS;
    return DEMO_PROCS.filter((p) => {
      const hay = `${p.title} ${p.tags.join(" ")} ${p.steps.join(" ")}`.toLowerCase();
      return hay.includes(s);
    });
  }, [q]);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Procedures</Text>
        <Text style={styles.subtitle}>Demo library. Tap an item to expand steps.</Text>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#7b7b7b" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search procedures…"
            placeholderTextColor="#666"
            style={styles.searchInput}
          />
        </View>

        <View style={{ height: 14 }} />

        {filtered.map((p) => {
          const isOpen = openId === p.id;
          return (
            <View key={p.id} style={styles.card}>
              <Pressable
                onPress={() => setOpenId(isOpen ? null : p.id)}
                style={({ pressed }) => [styles.cardTop, pressed && { opacity: 0.92 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{p.title}</Text>
                  <View style={styles.tagsRow}>
                    {p.tags.map((t) => (
                      <View key={`${p.id}-${t}`} style={styles.tag}>
                        <Text style={styles.tagText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Ionicons
                  name={isOpen ? "chevron-up" : "chevron-down"}
                  size={22}
                  color={ACCENT}
                  style={{ marginLeft: 10 }}
                />
              </Pressable>

              {isOpen && (
                <View style={styles.stepsBox}>
                  {p.steps.map((s, idx) => (
                    <View key={`${p.id}-step-${idx}`} style={styles.stepRow}>
                      <View style={styles.dot} />
                      <Text style={styles.stepText}>{s}</Text>
                    </View>
                  ))}

                  <Pressable
                    onPress={() => router.push("/(tabs)/talk")}
                    style={({ pressed }) => [
                      styles.askBtn,
                      pressed && { opacity: 0.92, transform: [{ scale: 0.995 }] },
                    ]}
                  >
                    <Ionicons name="chatbubble-ellipses" size={18} color="#000" />
                    <Text style={styles.askBtnText}>Ask this in Talk</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  content: { paddingHorizontal: 18 },

  title: { fontSize: 46, color: "#fff", fontWeight: "900" },
  subtitle: { marginTop: 10, fontSize: 16, color: "#8b8b8b", lineHeight: 22 },

  searchRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#121212",
    borderWidth: 1,
    borderColor: "#1f1f1f",
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 16 },

  card: {
    backgroundColor: "#111111",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1f1f1f",
    overflow: "hidden",
    marginBottom: 14,
  },
  cardTop: { padding: 16, flexDirection: "row", alignItems: "center" },
  cardTitle: { color: "#fff", fontSize: 20, fontWeight: "800", lineHeight: 26 },

  tagsRow: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(241,97,9,0.16)",
    borderWidth: 1,
    borderColor: "rgba(241,97,9,0.34)",
  },
  tagText: { color: ACCENT, fontSize: 14, fontWeight: "700" },

  stepsBox: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 6 },
  stepRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ACCENT,
    marginTop: 6,
  },
  stepText: { flex: 1, color: "#e6e6e6", fontSize: 16, lineHeight: 23 },

  askBtn: {
    marginTop: 18,
    height: 54,
    borderRadius: 28,
    backgroundColor: Colors.primary || ACCENT,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  askBtnText: { color: "#000", fontSize: 16, fontWeight: "900" },
});