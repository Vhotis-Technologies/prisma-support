import React from "react";
import { Stack } from "expo-router";
import { useDrawerStackScreenOptions } from "@/hooks/useDrawerStackScreenOptions";

const CrewChatLayout = () => {
  const screenOptions = useDrawerStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="CrewChatListScreen" options={{ title: "Crew Chats" }} />
      <Stack.Screen name="CrewChatDetailScreen" options={{ title: "Chat with Crew" }} />
    </Stack>
  );
};

export default CrewChatLayout;
