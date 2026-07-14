import { View, Text, ScrollView, StyleSheet } from 'react-native';
import ReminderTile from './ReminderTile';
import styles from './RemindersScreen.styles';

export default function RemindersScreen() {
  return (
    <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Reminders</Text>
      <Text style={styles.sub}>Set daily reminders. Toggle on/off and tap the time to change it.</Text>
      <ReminderTile reminderId="transactions" />
      <ReminderTile reminderId="todos" />
      <ReminderTile reminderId="habits" />
    </ScrollView>
  );
}
