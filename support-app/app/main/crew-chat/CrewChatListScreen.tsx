/**
 * Crew Chat List Screen - Support staff view all crew chat threads
 * 
 * Shows list of open/closed chat threads with:
 * - Crew member name and email
 * - Last message timestamp
 * - Unread count for support
 * - Thread status (open/closed)
 * 
 * Tapping a thread opens the chat detail screen
 */
import React, { useState } from "react";
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import StyledText from "@/app/components/helpers/StyledText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useGetCrewChatThreadsQuery } from "@/app/store/api/crewChatApi";

type ThreadStatus = "open" | "closed" | "all";

interface CrewChatThread {
  id: string;
  crew_name: string;
  crew_email: string;
  status: "open" | "closed";
  last_message_at: string;
  support_unread_count: number;
  crew_unread_count: number;
}

export default function CrewChatListScreen() {
  const [statusFilter, setStatusFilter] = useState<ThreadStatus>("open");
  
  const backgroundColor = useThemeColor({}, "background");
  const cardBg = useThemeColor({}, "cards");
  const borderColor = useThemeColor({}, "borders");
  const tintColor = useThemeColor({}, "tint");
  const mutedText = useThemeColor({ light: "#757575", dark: "#9E9E9E" }, "text");
  
  const {
    data: threadsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetCrewChatThreadsQuery(statusFilter);
  
  const threads: CrewChatThread[] = threadsResponse?.data?.threads || [];
  
  const handleThreadPress = (thread: CrewChatThread) => {
    router.push({
      pathname: "/main/crew-chat/CrewChatDetailScreen",
      params: {
        threadId: thread.id,
        crewName: thread.crew_name,
      },
    });
  };
  
  const renderThreadItem = ({ item }: { item: CrewChatThread }) => {
    const hasUnread = item.support_unread_count > 0;
    const isOpen = item.status === "open";
    
    return (
      <Pressable
        onPress={() => handleThreadPress(item)}
        style={({ pressed }) => [
          styles.threadCard,
          {
            backgroundColor: cardBg,
            borderColor: borderColor,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <View style={styles.threadHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <StyledText variant="subtitle" style={{ fontWeight: "600" }}>
                {item.crew_name}
              </StyledText>
              {hasUnread && (
                <View
                  style={[
                    styles.unreadBadge,
                    { backgroundColor: tintColor },
                  ]}
                >
                  <StyledText
                    variant="caption"
                    style={{ color: "#fff", fontWeight: "600", fontSize: 11 }}
                  >
                    {item.support_unread_count}
                  </StyledText>
                </View>
              )}
            </View>
            <StyledText variant="caption" style={{ color: mutedText }}>
              {item.crew_email}
            </StyledText>
          </View>
          
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isOpen
                    ? "rgba(76, 175, 80, 0.1)"
                    : "rgba(158, 158, 158, 0.1)",
                },
              ]}
            >
              <StyledText
                variant="caption"
                style={{
                  color: isOpen ? "#4CAF50" : mutedText,
                  fontWeight: "600",
                  fontSize: 11,
                }}
              >
                {isOpen ? "Open" : "Closed"}
              </StyledText>
            </View>
          </View>
        </View>
        
        <View style={styles.threadFooter}>
          <Ionicons
            name="time-outline"
            size={14}
            color={mutedText}
            style={{ marginRight: 4 }}
          />
          <StyledText variant="caption" style={{ color: mutedText }}>
            {formatTimestamp(item.last_message_at)}
          </StyledText>
        </View>
      </Pressable>
    );
  };
  
  const renderFilterButton = (filter: ThreadStatus, label: string) => {
    const isSelected = statusFilter === filter;
    return (
      <Pressable
        onPress={() => setStatusFilter(filter)}
        style={[
          styles.filterButton,
          {
            backgroundColor: isSelected ? tintColor : cardBg,
            borderColor: isSelected ? tintColor : borderColor,
          },
        ]}
      >
        <StyledText
          variant="body"
          style={{
            color: isSelected ? "#fff" : mutedText,
            fontWeight: isSelected ? "600" : "400",
          }}
        >
          {label}
        </StyledText>
      </Pressable>
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color={mutedText} />
      <StyledText
        variant="subtitle"
        style={{ marginTop: 16, color: mutedText }}
      >
        No {statusFilter !== "all" ? statusFilter : ""} chats
      </StyledText>
      <StyledText variant="caption" style={{ marginTop: 8, color: mutedText }}>
        Crew members haven't started any chats yet
      </StyledText>
    </View>
  );
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
        <StyledText variant="body" style={{ marginTop: 16, color: mutedText }}>
          Loading chats...
        </StyledText>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.filterContainer, { backgroundColor: cardBg }]}>
        {renderFilterButton("open", "Open")}
        {renderFilterButton("closed", "Closed")}
        {renderFilterButton("all", "All")}
      </View>
      
      <FlatList
        data={threads}
        renderItem={renderThreadItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={tintColor}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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
  filterContainer: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  threadCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  threadHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  statusContainer: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unreadBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  threadFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
});
