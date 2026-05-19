import React from 'react'
import { Stack } from 'expo-router'
import { useDrawerStackScreenOptions } from '@/hooks/useDrawerStackScreenOptions'

const PayoutLayout = () => {
  const screenOptions = useDrawerStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
        <Stack.Screen name="PayoutScreen" options={{ title: "Payout" }} />
        <Stack.Screen name="PayoutDetailScreen" options={{ title: "Payout details" }} />
        <Stack.Screen name="CrewUnpaidDetailScreen" options={{ title: "Crew unpaid detail" }} />
    </Stack>
  )
}

export default PayoutLayout