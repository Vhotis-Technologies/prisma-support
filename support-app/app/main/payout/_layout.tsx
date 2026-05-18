import React from 'react'
import { Stack } from 'expo-router'
import { useDrawerStackScreenOptions } from '@/hooks/useDrawerStackScreenOptions'

const PayoutLayout = () => {
  const screenOptions = useDrawerStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
        <Stack.Screen name="PayoutScreen" options={{ title: "Payout" }} />
        <Stack.Screen name="PayoutDetailScreen" options={{ title: "Payout details" }} />
    </Stack>
  )
}

export default PayoutLayout