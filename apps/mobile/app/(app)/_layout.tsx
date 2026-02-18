import { Tabs } from 'expo-router';

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="studios" options={{ title: 'Studios', tabBarLabel: 'Studios' }} />
      <Tabs.Screen
        name="classrooms/[classroomId]/calendar"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: 'Notifications', tabBarLabel: 'Inbox' }}
      />
    </Tabs>
  );
}
