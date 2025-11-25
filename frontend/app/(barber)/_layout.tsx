import { Stack } from 'expo-router';

export default function BarberLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="subscription" />
      <Stack.Screen name="create-shop" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="manage-services" />
      <Stack.Screen name="manage-products" />
      <Stack.Screen name="manage-gallery" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
