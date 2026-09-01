/**
 * Crew Chat Detail Screen - Support staff chat with a specific crew member
 * 
 * Features:
 * - Real-time WebSocket chat using react-native-gifted-chat
 * - Send and receive messages
 * - Close/reopen chat threads
 * - View booking references mentioned in messages
 * - Mark messages as read automatically
 */
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GiftedChat, IMessage, Send, Bubble, InputToolbar } from "react-native-gifted-chat";
import Constants from "expo-constants";
import { useThemeColor } from "@/hooks/useThemeColor";
import StyledText from "@/app/components/helpers/StyledText";
import { useAppSelector } from "@/app/store/main_store";
import {
  useGetCrewChatThreadQuery,
  useCloseCrewChatThreadMutation,
  useReopenCrewChatThreadMutation,
} from "@/app/store/api/crewChatApi";

export default function CrewChatDetailScreen() {
  const { threadId, crewName } = useLocalSearchParams<{
    threadId: string;
    crewName: string;
  }>();
  
  const backgroundColor = useThemeColor({}, "background");
  const cardBg = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const tintColor = useThemeColor({}, "tint");
  const mutedText = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  
  const accessToken = useAppSelector((s) => s.auth.access);
  const userProfile = useAppSelector((s) => s.auth.user);
  
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [threadStatus, setThreadStatus] = useState<"open" | "closed">("open");
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  
  const wsUrl = Constants.expoConfig?.extra?.websockets_url;
  const apiUrl = Constants.expoConfig?.extra?.support_app_url;
  
  const {
    data: threadResponse,
    isLoading,
    refetch,
  } = useGetCrewChatThreadQuery(threadId || "", {
    skip: !threadId,
  });
  
  const [closeThread] = useCloseCrewChatThreadMutation();
  const [reopenThread] = useReopenCrewChatThreadMutation();
  
  // Decode JWT to check if token is valid
  const isTokenValid = useCallback((token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const now = Date.now();
      return expiryTime > (now + 30000);
    } catch (error) {
      console.error("Failed to decode token:", error);
      return false;
    }
  }, []);
  
  useEffect(() => {
    if (threadResponse?.data?.thread) {
      const thread = threadResponse.data.thread;
      setThreadStatus(thread.status);
      
      if (thread.messages) {
        const history = thread.messages.map((m: any) => ({
          _id: m._id,
          text: m.text,
          createdAt: new Date(m.createdAt),
          user: {
            _id: m.user._id,
            name: m.user.name,
          },
        }));
        setMessages(history.reverse());
      }
    }
  }, [threadResponse]);
  
  // Only connect when screen is focused
  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      
      if (!accessToken || !wsUrl || !threadId) {
        return;
      }
      
      if (!isTokenValid(accessToken)) {
        console.warn("Token is expired or invalid");
        return;
      }
      
      connectWebSocket();
      
      return () => {
        mountedRef.current = false;
        if (wsRef.current) {
          console.log("Closing WebSocket - screen unfocused");
          wsRef.current.close();
          wsRef.current = null;
        }
        setIsConnected(false);
      };
    }, [accessToken, wsUrl, threadId, isTokenValid])
  );
  
  const connectWebSocket = () => {
    if (!wsUrl || !threadId || !accessToken) return;
    
    if (!isTokenValid(accessToken)) {
      console.warn("Cannot connect: token is expired");
      return;
    }
    
    console.log("Connecting to crew chat WebSocket...");
    const ws = new WebSocket(`${wsUrl}/crew-chat/${threadId}/?token=${accessToken}`);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log("Crew chat connected");
      if (mountedRef.current) {
        setIsConnected(true);
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "thread_status") {
          if (mountedRef.current) {
            setThreadStatus(data.status === "closed" ? "closed" : "open");
          }
          return;
        }

        if (!data._id || !data.text) {
          return;
        }
        
        const newMessage: IMessage = {
          _id: data._id,
          text: data.text,
          createdAt: new Date(data.createdAt),
          user: {
            _id: data.user._id,
            name: data.user.name,
          },
        };
        
        if (mountedRef.current) {
          setMessages((prev) => GiftedChat.append(prev, [newMessage]));
        }
      } catch (error) {
        console.error("Failed to parse message:", error);
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      if (mountedRef.current) {
        setIsConnected(false);
      }
    };
    
    ws.onclose = (event) => {
      console.log("Crew chat disconnected", event.code, event.reason);
      if (mountedRef.current) {
        setIsConnected(false);
      }
      
      // Only reconnect if still on screen and token is valid
      if (mountedRef.current && isTokenValid(accessToken) && event.code !== 1000) {
        console.log("Attempting to reconnect in 3 seconds...");
        setTimeout(() => {
          if (mountedRef.current && wsUrl && threadId && isTokenValid(accessToken)) {
            connectWebSocket();
          }
        }, 3000);
      }
    };
  };
  
  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      if (!wsRef.current || !isConnected) {
        Alert.alert("Not Connected", "WebSocket is not connected. Please wait...");
        return;
      }
      if (threadStatus === "closed") {
        Alert.alert("Chat Closed", "This chat is closed. Reopen it to send messages.");
        return;
      }
      
      const message = newMessages[0];
      
      // Send via WebSocket
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          body: message.text,
        })
      );
    },
    [isConnected, threadStatus]
  );
  
  const handleCloseThread = async () => {
    if (!threadId) return;
    
    Alert.alert(
      "Close Chat",
      "Are you sure you want to close this chat thread?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close",
          style: "destructive",
          onPress: async () => {
            try {
              await closeThread(threadId).unwrap();
              setThreadStatus("closed");
              
              const systemMessage: IMessage = {
                _id: Math.random().toString(),
                text: "Chat closed by support staff.",
                createdAt: new Date(),
                user: {
                  _id: "0",
                  name: "System",
                },
                system: true,
              };
              setMessages((prev) => GiftedChat.append(prev, [systemMessage]));
            } catch (error) {
              console.error("Failed to close chat:", error);
              Alert.alert("Error", "Failed to close chat. Please try again.");
            }
          },
        },
      ]
    );
  };
  
  const handleReopenThread = async () => {
    if (!threadId) return;
    
    try {
      await reopenThread(threadId).unwrap();
      setThreadStatus("open");
      
      const systemMessage: IMessage = {
        _id: Math.random().toString(),
        text: "Chat reopened by support staff.",
        createdAt: new Date(),
        user: {
          _id: "0",
          name: "System",
        },
        system: true,
      };
      setMessages((prev) => GiftedChat.append(prev, [systemMessage]));
    } catch (error) {
      console.error("Failed to reopen chat:", error);
      Alert.alert("Error", "Failed to reopen chat. Please try again.");
    }
  };
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
        <StyledText variant='bodySmall' style={{ marginTop: 16, color: mutedText }}>
          Loading chat...
        </StyledText>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: cardBg,
            borderBottomWidth: 1,
            borderBottomColor: borderColor,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Back"
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={tintColor} />
        </Pressable>
        
        <View style={styles.headerTitle}>
          <StyledText variant='bodySmall' style={{ fontWeight: "600" }}>
            {crewName || "Crew Member"}
          </StyledText>
          {threadStatus === "closed" && (
            <StyledText variant='bodySmall' style={{ color: mutedText }}>
              Closed
            </StyledText>
          )}
        </View>
        
        <View style={styles.headerActions}>
          {isConnected ? (
            <View
              style={[styles.statusDot, { backgroundColor: "#4CAF50" }]}
              accessibilityLabel="Connected"
            />
          ) : (
            <View
              style={[styles.statusDot, { backgroundColor: mutedText }]}
              accessibilityLabel="Connecting..."
            />
          )}
          
          {threadStatus === "open" ? (
            <Pressable
              onPress={handleCloseThread}
              style={({ pressed }) => [
                {
                  padding: 8,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              accessibilityLabel="Close chat"
            >
              <Ionicons name="close-circle-outline" size={24} color={tintColor} />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleReopenThread}
              style={({ pressed }) => [
                {
                  padding: 8,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              accessibilityLabel="Reopen chat"
            >
              <Ionicons name="refresh-outline" size={24} color={tintColor} />
            </Pressable>
          )}
        </View>
      </View>
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 12}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: userProfile?.id || "0",
            name: `${userProfile?.first_name || ""} ${userProfile?.last_name || ""}`.trim() || "Support",
          }}
          renderBubble={(props) => (
            <Bubble
              {...props}
              wrapperStyle={{
                left: {
                  backgroundColor: cardBg,
                  borderRadius: 12,
                  padding: 4,
                },
                right: {
                  backgroundColor: tintColor,
                  borderRadius: 12,
                  padding: 4,
                },
              }}
              textStyle={{
                left: {
                  color: "#000",
                },
                right: {
                  color: "#fff",
                },
              }}
            />
          )}
          renderInputToolbar={(props) => (
            <InputToolbar
              {...props}
              containerStyle={{
                backgroundColor: cardBg,
                borderTopColor: borderColor,
                borderTopWidth: 1,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
              primaryStyle={{
                alignItems: "center",
              }}
            />
          )}
          renderSend={(props) =>
            threadStatus === "closed" ? null : (
              <Send {...props}>
                <View
                  style={[
                    styles.sendButton,
                    { marginRight: 8, marginBottom: 8 },
                  ]}
                >
                  <Ionicons name="send" size={24} color={tintColor} />
                </View>
              </Send>
            )
          }
          textInputProps={{
            placeholder: threadStatus === "closed" ? "Chat is closed" : "Type a message...",
            editable: threadStatus !== "closed",
          }}
          messagesContainerStyle={{
            backgroundColor: backgroundColor,
          }}
          renderAvatar={null}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    gap: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sendButton: {
    justifyContent: "center",
    alignItems: "center",
  },
});
