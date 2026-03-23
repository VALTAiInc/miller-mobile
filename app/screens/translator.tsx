// app/screens/translator.tsx - Miller Continuum Translator
import React, { useState, useRef, useCallback } from "react";
import { Modal, SafeAreaView, View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert, Animated, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";

const MILLER_BLUE = "#0066CC";
const API_BASE = "https://weldwise-backend-gold-production.up.railway.app";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇨🇦" },
  { code: "es", label: "Español", flag: "🇲🇽" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳" },
];

function getLang(code: string) {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

function LangPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = getLang(value);
  return (
    <View style={{ flex: 1 }}>
      <Pressable onPress={() => setOpen(true)} style={tStyles.langButton}>
        <Text style={{ fontSize: 18 }}>{current.flag}</Text>
        <Text style={tStyles.langButtonText}>{current.label}</Text>
        <Text style={tStyles.langChevron}>▼</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={tStyles.langOverlay} onPress={() => setOpen(false)}>
          <View style={tStyles.langBox}>
            <Text style={tStyles.langTitle}>Select Language</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity key={lang.code} style={[tStyles.langOption, lang.code === value && tStyles.langOptionActive]} onPress={() => { onChange(lang.code); setOpen(false); }}>
                  <Text style={{ fontSize: 22 }}>{lang.flag}</Text>
                  <Text style={[tStyles.langOptionText, lang.code === value && tStyles.langOptionTextActive]}>{lang.label}</Text>
                  {lang.code === value && <Ionicons name="checkmark" size={18} color={MILLER_BLUE} style={{ marginLeft: "auto" }} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function MicButton({ isRecording, isProcessing, onPressIn, onPressOut, color }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    if (isRecording) {
      Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start();
      Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ])).start();
    } else {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      pulse.stopAnimation();
      Animated.timing(pulse, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
  }, [isRecording]);
  return (
    <View style={tStyles.micOuter}>
      {isRecording && <Animated.View style={[tStyles.micPulse, { borderColor: color, transform: [{ scale: pulse }] }]} />}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPressIn={onPressIn} onPressOut={onPressOut} disabled={isProcessing} style={[tStyles.micButton, { backgroundColor: isRecording ? color : "rgba(255,255,255,0.1)" }, isProcessing && { opacity: 0.5 }]}>
          {isProcessing ? <ActivityIndicator size="large" color="#fff" /> : <Ionicons name={isRecording ? "stop" : "mic"} size={28} color="#fff" />}
        </Pressable>
      </Animated.View>
      <Text style={[tStyles.micHint, { color: isRecording ? color : "rgba(255,255,255,0.25)" }]}>
        {isProcessing ? "Translating..." : isRecording ? "Release to translate" : "Hold to speak"}
      </Text>
    </View>
  );
}

export default function TranslatorModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [langA, setLangA] = useState("en");
  const [langB, setLangB] = useState("es");
  const [aRecording, setARecording] = useState(false);
  const [aProcessing, setAProcessing] = useState(false);
  const [aTranscript, setATranscript] = useState("");
  const [aTranslation, setATranslation] = useState("");
  const [bRecording, setBRecording] = useState(false);
  const [bProcessing, setBProcessing] = useState(false);
  const [bTranscript, setBTranscript] = useState("");
  const [bTranslation, setBTranslation] = useState("");
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const startRecording = useCallback(async (speaker: "A" | "B") => {
    try {
      if (recordingRef.current) { try { await recordingRef.current.stopAndUnloadAsync(); } catch {} recordingRef.current = null; }
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { Alert.alert("Permission required", "Microphone access needed."); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      speaker === "A" ? setARecording(true) : setBRecording(true);
    } catch (err) { console.error("startRecording:", err); }
  }, []);

  const stopAndTranslate = useCallback(async (speaker: "A" | "B") => {
    const recording = recordingRef.current;
    if (!recording) return;
    const myLang = speaker === "A" ? langA : langB;
    const theirLang = speaker === "A" ? langB : langA;
    speaker === "A" ? setARecording(false) : setBRecording(false);
    speaker === "A" ? setAProcessing(true) : setBProcessing(true);
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      recordingRef.current = null;
      const uri = recording.getURI();
      if (!uri) throw new Error("No recording URI");
      const formData = new FormData();
      formData.append("audio", { uri, name: "recording.m4a", type: "audio/m4a" } as any);
      formData.append("sourceLanguage", myLang);
      formData.append("targetLanguage", theirLang);
      formData.append("callerApp", "Miller");
      const response = await fetch(`${API_BASE}/api/translate`, { method: "POST", body: formData, headers: { "Content-Type": "multipart/form-data" } });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error || "Translation failed"); }
      const result = await response.json();
      if (speaker === "A") { setATranscript(result.transcript); setATranslation(result.translation); }
      else { setBTranscript(result.transcript); setBTranslation(result.translation); }
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      const fileUri = (FileSystem.cacheDirectory ?? "") + "miller_translation.mp3";
      await FileSystem.writeAsStringAsync(fileUri, result.audioBase64, { encoding: "base64" });
      const { sound } = await Audio.Sound.createAsync({ uri: fileUri }, { shouldPlay: true });
      soundRef.current = sound;
    } catch (err: any) { Alert.alert("Translation Error", err.message || "Something went wrong."); }
    finally { speaker === "A" ? setAProcessing(false) : setBProcessing(false); }
  }, [langA, langB]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={tStyles.modal}>
        {/* Person B — flipped */}
        <View style={[tStyles.panel, { transform: [{ rotate: "180deg" }] }]}>
          <View style={tStyles.panelHeader}>
            <LangPicker value={langB} onChange={setLangB} />
            <Pressable onPress={onClose} style={tStyles.doneBtn}><Text style={tStyles.doneBtnText}>Done</Text></Pressable>
          </View>
          <View style={tStyles.textBox}>
            {bTranscript ? (<><Text style={tStyles.transcriptLabel}>SAID</Text><Text style={tStyles.transcriptText}>{bTranscript}</Text><View style={[tStyles.divider, { backgroundColor: MILLER_BLUE }]} /><Text style={tStyles.translationLabel}>→ {getLang(langA).flag} {getLang(langA).label}</Text><Text style={tStyles.translationText}>{bTranslation}</Text></>) : (<Text style={tStyles.placeholder}>Hold mic to speak</Text>)}
          </View>
          <MicButton isRecording={bRecording} isProcessing={bProcessing} onPressIn={() => startRecording("B")} onPressOut={() => stopAndTranslate("B")} color={MILLER_BLUE} />
        </View>
        {/* Divider */}
        <View style={tStyles.centerDivider}>
          <View style={tStyles.centerLine} />
          <View style={tStyles.centerBadge}><Text style={{ fontSize: 16 }}>🌐</Text></View>
          <View style={tStyles.centerLine} />
        </View>
        {/* Person A */}
        <View style={tStyles.panel}>
          <View style={tStyles.panelHeader}>
            <LangPicker value={langA} onChange={setLangA} />
            <Pressable onPress={onClose} style={tStyles.doneBtn}><Text style={tStyles.doneBtnText}>Done</Text></Pressable>
          </View>
          <View style={tStyles.textBox}>
            {aTranscript ? (<><Text style={tStyles.transcriptLabel}>SAID</Text><Text style={tStyles.transcriptText}>{aTranscript}</Text><View style={[tStyles.divider, { backgroundColor: "#4ECDC4" }]} /><Text style={tStyles.translationLabel}>→ {getLang(langB).flag} {getLang(langB).label}</Text><Text style={tStyles.translationText}>{aTranslation}</Text></>) : (<Text style={tStyles.placeholder}>Hold mic to speak</Text>)}
          </View>
          <MicButton isRecording={aRecording} isProcessing={aProcessing} onPressIn={() => startRecording("A")} onPressOut={() => stopAndTranslate("A")} color="#4ECDC4" />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const tStyles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: "#0A0A0F" },
  panel: { flex: 1, paddingHorizontal: 20, paddingVertical: 12, justifyContent: "space-between" },
  panelHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  doneBtn: { backgroundColor: MILLER_BLUE, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 16 },
  doneBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  textBox: { flex: 1, marginVertical: 10, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", justifyContent: "center" },
  transcriptLabel: { color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: "600", letterSpacing: 1.2, marginBottom: 4 },
  transcriptText: { color: "rgba(255,255,255,0.55)", fontSize: 13, fontStyle: "italic", lineHeight: 19 },
  divider: { height: 1.5, marginVertical: 8, borderRadius: 1 },
  translationLabel: { color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: "600", letterSpacing: 1.2, marginBottom: 4 },
  translationText: { color: "#fff", fontSize: 17, fontWeight: "700", lineHeight: 24 },
  placeholder: { color: "rgba(255,255,255,0.18)", fontSize: 14, textAlign: "center", fontStyle: "italic" },
  micOuter: { alignItems: "center", justifyContent: "center", paddingVertical: 4 },
  micPulse: { position: "absolute", width: 76, height: 76, borderRadius: 38, borderWidth: 2 },
  micButton: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)" },
  micHint: { marginTop: 6, fontSize: 11, fontWeight: "500" },
  centerDivider: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, height: 32 },
  centerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
  centerBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#1A1A2E", alignItems: "center", justifyContent: "center", marginHorizontal: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  langButton: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  langButtonText: { color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 },
  langChevron: { color: "rgba(255,255,255,0.4)", fontSize: 10 },
  langOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  langBox: { width: "100%", maxHeight: "70%", backgroundColor: "#1A1A2E", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  langTitle: { color: "#fff", fontSize: 15, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  langOption: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 12, borderRadius: 10 },
  langOptionActive: { backgroundColor: `${MILLER_BLUE}25` },
  langOptionText: { color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: "500" },
  langOptionTextActive: { color: MILLER_BLUE, fontWeight: "700" },
});
