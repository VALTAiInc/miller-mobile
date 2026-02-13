import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
  Keyboard,
} from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import Colors from "../../constants/colors";

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";

const SYSTEM_PROMPT =
  "You are SAWWISE, an expert assistant for the HYDMECH S-20 Series III Horizontal Pivot Bandsaw. Answer concisely, prioritize safety, and give step-by-step guidance when appropriate.";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let msgCounter = 0;
function uid(): string {
  msgCounter++;
  return `m-${Date.now()}-${msgCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

type TTSState = "idle" | "playing" | "paused";

export default function TalkScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [ttsState, setTtsState] = useState<TTSState>("idle");

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const lockRef = useRef(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const stopTTS = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
    setTtsState("idle");
  }, []);

  const pauseTTS = useCallback(async () => {
    if (soundRef.current && ttsState === "playing") {
      try {
        await soundRef.current.pauseAsync();
        setTtsState("paused");
      } catch {}
    }
  }, [ttsState]);

  const resumeTTS = useCallback(async () => {
    if (soundRef.current && ttsState === "paused") {
      try {
        await soundRef.current.playAsync();
        setTtsState("playing");
      } catch {}
    }
  }, [ttsState]);

  const playTTS = useCallback(async (text: string) => {
    await stopTTS();

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: "alloy",
          input: text,
        }),
      });

      if (!response.ok) {
        console.error("TTS request failed:", response.status);
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const uri = `data:audio/mpeg;base64,${base64}`;

      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setTtsState("playing");

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
          setTtsState("idle");
        }
      });

      await sound.playAsync();
    } catch (err) {
      console.error("TTS error:", err);
      setTtsState("idle");
    }
  }, [stopTTS]);

  const chatCompletion = useCallback(
    async (allMessages: Message[]): Promise<string> => {
      const apiMessages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        ...allMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: apiMessages,
            max_tokens: 1024,
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Chat API error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "I could not generate a response.";
    },
    []
  );

  const sendTextMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isThinking) return;

      const userMsg: Message = { id: uid(), role: "user", content: text.trim() };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInputText("");
      setIsThinking(true);

      try {
        const reply = await chatCompletion(updatedMessages);
        const assistantMsg: Message = {
          id: uid(),
          role: "assistant",
          content: reply,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "assistant", content: "Sorry, something went wrong. Please try again." },
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [messages, isThinking, chatCompletion]
  );

  const transcribeAudio = useCallback(async (uri: string): Promise<string> => {
    const formData = new FormData();

    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append("file", blob, "recording.webm");
    } else {
      formData.append("file", {
        uri,
        name: "recording.m4a",
        type: "audio/m4a",
      } as any);
    }
    formData.append("model", "whisper-1");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Transcription error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.text || "";
  }, []);

  const startRecording = useCallback(async () => {
    if (lockRef.current) return;
    lockRef.current = true;

    try {
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {}
        recordingRef.current = null;
      }

      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        lockRef.current = false;
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error("Start recording error:", err);
    }

    lockRef.current = false;
  }, []);

  const stopRecording = useCallback(async () => {
    if (lockRef.current || !recordingRef.current) return;
    lockRef.current = true;

    try {
      const recording = recordingRef.current;
      recordingRef.current = null;
      setIsRecording(false);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) {
        lockRef.current = false;
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      setIsThinking(true);

      const transcript = await transcribeAudio(uri);

      if (!transcript.trim()) {
        setIsThinking(false);
        lockRef.current = false;
        return;
      }

      const userMsg: Message = {
        id: uid(),
        role: "user",
        content: transcript,
      };

      const currentMessages = [...messages, userMsg];
      setMessages(currentMessages);

      const reply = await chatCompletion(currentMessages);
      const assistantMsg: Message = {
        id: uid(),
        role: "assistant",
        content: reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsThinking(false);

      playTTS(reply);
    } catch (err: any) {
      console.error("Voice flow error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: "Sorry, I had trouble processing your voice. Please try again.",
        },
      ]);
      setIsThinking(false);
    }

    lockRef.current = false;
  }, [messages, transcribeAudio, chatCompletion, playTTS]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      stopTTS();
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording, stopTTS]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isUser = item.role === "user";
      return (
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          {!isUser && (
            <View style={styles.avatarContainer}>
              <Ionicons name="hardware-chip" size={16} color={Colors.dark.tint} />
            </View>
          )}
          <View
            style={[
              styles.bubbleContent,
              isUser ? styles.userBubbleContent : styles.assistantBubbleContent,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isUser ? styles.userMessageText : styles.assistantMessageText,
              ]}
            >
              {item.content}
            </Text>
          </View>
        </View>
      );
    },
    []
  );

  const reversedMessages = [...messages].reverse();

  if (!fontsLoaded) return null;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="hardware-chip" size={20} color={Colors.dark.tint} />
        </View>
        <View>
          <Text style={styles.headerTitle}>SAWWISE</Text>
          <Text style={styles.headerSubtitle}>HYDMECH S-20 Expert</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={reversedMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted={messages.length > 0}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.emptyList,
          ]}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            isThinking ? (
              <View style={styles.thinkingContainer}>
                <View style={styles.thinkingBubble}>
                  <ActivityIndicator size="small" color={Colors.dark.tint} />
                  <Text style={styles.thinkingText}>Thinking...</Text>
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={
            messages.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="chatbubbles-outline" size={40} color={Colors.dark.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>Ask SAWWISE anything</Text>
                <Text style={styles.emptySubtitle}>
                  Type a question or tap the mic to talk about the HYDMECH S-20 Series III bandsaw.
                </Text>
              </View>
            ) : null
          }
        />

        {ttsState !== "idle" && (
          <View style={styles.ttsControls}>
            <View style={styles.ttsBar}>
              <Ionicons name="volume-high" size={18} color={Colors.dark.tint} />
              <Text style={styles.ttsLabel}>
                {ttsState === "playing" ? "Speaking..." : "Paused"}
              </Text>
              <View style={styles.ttsButtons}>
                {ttsState === "playing" ? (
                  <Pressable onPress={pauseTTS} style={styles.ttsButton}>
                    <Ionicons name="pause" size={20} color={Colors.dark.text} />
                  </Pressable>
                ) : (
                  <Pressable onPress={resumeTTS} style={styles.ttsButton}>
                    <Ionicons name="play" size={20} color={Colors.dark.text} />
                  </Pressable>
                )}
                <Pressable onPress={stopTTS} style={styles.ttsButton}>
                  <Ionicons name="stop" size={20} color={Colors.dark.danger} />
                </Pressable>
              </View>
            </View>
          </View>
        )}

        <View style={[styles.inputArea, { paddingBottom: bottomInset + 90 }]}>
          <View style={styles.inputRow}>
            <Pressable
              onPress={toggleRecording}
              style={({ pressed }) => [
                styles.micButton,
                isRecording && styles.micButtonRecording,
                pressed && { opacity: 0.7 },
              ]}
              disabled={isThinking}
            >
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={22}
                color={isRecording ? "#fff" : Colors.dark.tint}
              />
            </Pressable>

            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                placeholder={isRecording ? "Recording..." : "Ask about the S-20..."}
                placeholderTextColor={Colors.dark.textMuted}
                value={inputText}
                onChangeText={setInputText}
                editable={!isRecording && !isThinking}
                multiline
                maxLength={2000}
                blurOnSubmit={false}
                onSubmitEditing={() => {
                  if (inputText.trim()) {
                    sendTextMessage(inputText);
                    inputRef.current?.focus();
                  }
                }}
              />
            </View>

            <Pressable
              onPress={() => {
                if (inputText.trim()) {
                  sendTextMessage(inputText);
                  inputRef.current?.focus();
                }
              }}
              style={({ pressed }) => [
                styles.sendButton,
                !!inputText.trim() && styles.sendButtonActive,
                pressed && { opacity: 0.7 },
              ]}
              disabled={!inputText.trim() || isThinking || isRecording}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? "#fff" : Colors.dark.textMuted}
              />
            </Pressable>
          </View>

          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording - tap mic to stop</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    marginTop: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  messageBubble: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
    gap: 8,
  },
  userBubble: {
    justifyContent: "flex-end",
  },
  assistantBubble: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleContent: {
    maxWidth: "75%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubbleContent: {
    backgroundColor: Colors.dark.userBubble,
    borderBottomRightRadius: 4,
    marginLeft: "auto",
  },
  assistantBubbleContent: {
    backgroundColor: Colors.dark.assistantBubble,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
  userMessageText: {
    color: "#fff",
  },
  assistantMessageText: {
    color: Colors.dark.text,
  },
  thinkingContainer: {
    marginBottom: 12,
    alignItems: "flex-start",
    paddingLeft: 36,
  },
  thinkingBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.assistantBubble,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  thinkingText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  ttsControls: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  ttsBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  ttsLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  ttsButtons: {
    flexDirection: "row",
    gap: 6,
  },
  ttsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  inputArea: {
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  micButtonRecording: {
    backgroundColor: Colors.dark.recording,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: Colors.dark.inputBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: "center",
  },
  textInput: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.text,
    maxHeight: 110,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: Colors.dark.tint,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.recording,
  },
  recordingText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.recording,
  },
});
