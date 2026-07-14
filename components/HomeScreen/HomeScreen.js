import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './HomeScreen.styles';
import { themeColor } from '../../config/theme';

const ITEMS = [
  { label: 'Finance Calendar', tab: 'calendar',   icon: 'calendar-outline' },
  { label: 'Calculator',       tab: 'calculator', icon: 'calculator-outline' },
  { label: 'Notes',            tab: 'notes',      icon: 'document-text-outline' },
  { label: 'Reminders',        tab: 'reminders',  icon: 'notifications-outline' },
  { label: 'Settings',         tab: 'settings',   icon: 'settings-outline' },
  { label: 'Profile',          tab: 'profile',    icon: 'person-circle-outline' },
];

export default function HomeScreen({ setActiveTab }) {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>More</Text>
      <View style={styles.grid}>
        {ITEMS.map(item => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [styles.box, pressed && styles.boxPressed]}
            onPress={() => setActiveTab(item.tab)}
          >
            <Ionicons name={item.icon} size={28} color={themeColor('primary')} />
            <Text style={styles.boxText}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}