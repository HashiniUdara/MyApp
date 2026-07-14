import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore }  from '../../store/useAppStore';
import { useTodos }     from '../../store/todoStore/TodoContext';
import { useHabits }    from '../../store/habitStore/HabitContext';
import { useAuth }      from '../../store/authStore/AuthContext';
import { todayStr }     from '../../utils/dateUtils';
import styles from './SplitBillsScreen.styles';
import { themeColor } from '../../config/theme';


export default function SplitBillsScreen() {

  return (
    <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting}>Split Bills with People</Text>
    </ScrollView>
  );
}
