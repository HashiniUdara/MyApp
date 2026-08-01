import { View, Text, ScrollView, StyleSheet } from 'react-native';
import ReminderTile from './ReminderTile';
import styles from './RemindersScreen.styles';
import { WORDINGS } from '../../config/wordings';

export default function RemindersScreen() {
  return (
    <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{WORDINGS.reminders.title}</Text>
      <Text style={styles.sub}>{WORDINGS.reminders.description}</Text>
      <ReminderTile reminderId="transactions" />
      <ReminderTile reminderId="todos" />
      <ReminderTile reminderId="habits" />
    </ScrollView>
  );
}
