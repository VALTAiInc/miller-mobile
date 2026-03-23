// app/(tabs)/manual.tsx
import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Linking, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MILLER_BLUE = "#0066CC";

const MANUALS = [
  { title: "Continuum 350 & 500", subtitle: "Owner's Manual (OM-257 798B)", url: "https://www.millerwelds.com/files/owners-manuals/o257798c_mil.pdf", icon: "document-text" },
  { title: "Auto-Continuum 350 & 500", subtitle: "Owner's Manual with Insight Core (OM-273473D)", url: "https://www.millerwelds.com/files/owners-manuals/O273473D_MIL.pdf", icon: "document-text" },
  { title: "Auto-Continuum 350 & 500 CE", subtitle: "Owner's Manual (OM-277115F)", url: "https://www.millerwelds.com/files/owners-manuals/O277115F_MIL.pdf", icon: "document-text" },
  { title: "All Miller Manuals", subtitle: "Find any Miller product manual", url: "https://www.millerwelds.com/support/manuals-and-parts", icon: "library" },
];

const SECTIONS = [
  { title: "Circuit Diagram — 350 Model", subtitle: "Pages 42-44 in OM-257 798B", url: "https://www.millerwelds.com/files/owners-manuals/o257798c_mil.pdf#page=42", icon: "git-branch" },
  { title: "Circuit Diagram — 500 Model", subtitle: "Pages 46-49 in OM-257 798B", url: "https://www.millerwelds.com/files/owners-manuals/o257798c_mil.pdf#page=46", icon: "git-branch" },
  { title: "Installation & Setup", subtitle: "Section 5 — Location, power, connections", url: "https://www.millerwelds.com/files/owners-manuals/o257798c_mil.pdf#page=10", icon: "construct" },
  { title: "Operation Guide", subtitle: "Section 7 — Controls and settings", url: "https://www.millerwelds.com/files/owners-manuals/o257798c_mil.pdf#page=20", icon: "settings" },
  { title: "Maintenance & Troubleshooting", subtitle: "Section 9 — Service and repair", url: "https://www.millerwelds.com/files/owners-manuals/o257798c_mil.pdf#page=35", icon: "build" },
  { title: "Parts List", subtitle: "Section 11 — Replacement parts", url: "https://www.millerwelds.com/files/owners-manuals/o257798c_mil.pdf#page=50", icon: "list" },
];

const SUPPORT = [
  { title: "Miller Support Center", url: "https://www.millerwelds.com/support", icon: "help-circle" },
  { title: "Find a Distributor", url: "https://www.millerwelds.com/where-to-buy", icon: "location" },
  { title: "Parts & Accessories", url: "https://www.millerwelds.com/parts", icon: "cube" },
  { title: "Call Miller: 1-800-4-A-Miller", url: "tel:18004264553", icon: "call" },
];

export default function ManualScreen() {
  const open = (url: string) => Linking.openURL(url);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reference Manual</Text>
        <Text style={styles.headerSub}>Continuum 350 & 500</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, gap: 20 }}>

        <Text style={styles.sectionLabel}>OWNER'S MANUALS</Text>
        {MANUALS.map((m, i) => (
          <Pressable key={i} style={styles.card} onPress={() => open(m.url)}>
            <View style={[styles.cardIcon, { backgroundColor: MILLER_BLUE + "15" }]}>
              <Ionicons name={m.icon as any} size={22} color={MILLER_BLUE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{m.title}</Text>
              <Text style={styles.cardSub}>{m.subtitle}</Text>
            </View>
            <Ionicons name="open-outline" size={16} color="#888" />
          </Pressable>
        ))}

        <Text style={styles.sectionLabel}>WIRING & CIRCUIT DIAGRAMS</Text>
        {SECTIONS.map((s, i) => (
          <Pressable key={i} style={styles.card} onPress={() => open(s.url)}>
            <View style={[styles.cardIcon, { backgroundColor: "#0066CC15" }]}>
              <Ionicons name={s.icon as any} size={22} color="#CC4400" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{s.title}</Text>
              <Text style={styles.cardSub}>{s.subtitle}</Text>
            </View>
            <Ionicons name="open-outline" size={16} color="#888" />
          </Pressable>
        ))}

        <Text style={styles.sectionLabel}>SUPPORT</Text>
        {SUPPORT.map((s, i) => (
          <Pressable key={i} style={styles.card} onPress={() => open(s.url)}>
            <View style={[styles.cardIcon, { backgroundColor: "#00880015" }]}>
              <Ionicons name={s.icon as any} size={22} color="#006600" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{s.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#888" />
          </Pressable>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0A0C10" },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 2 },
  scroll: { flex: 1 },
  sectionLabel: { color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: -8 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  cardIcon: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  cardSub: { color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 },
});
