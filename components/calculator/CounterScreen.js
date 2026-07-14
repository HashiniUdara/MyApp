import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import styles from './calculator.styles';

export default function CounterScreen() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.section}>
      <Text style={styles.emoji}>🔢</Text>
      <Text style={styles.title}>Counter</Text>
      <Text style={styles.counterDisplay}>{count}</Text>
      <View style={styles.row1}>
        <TouchableOpacity style={[styles.btn1, styles.btnDanger]} onPress={() => setCount(c => c - 1)}>
          <Text style={styles.btnText1}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn1, styles.btnSecondary]} onPress={() => setCount(0)}>
          <Text style={styles.btnText1}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn1, styles.btnSuccess]} onPress={() => setCount(c => c + 1)}>
          <Text style={styles.btnText1}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
