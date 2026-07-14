import { View, Text } from 'react-native';
import styles from './FinanceGraphScreen.styles';
import { themeColor } from '../../config/theme';

export default function CategoryBreakdownChart({ byCategory, emptyLabel }) {
  const PALETTE = [
    themeColor('primary'),
    themeColor('secondary'),
    themeColor('accent'),
    themeColor('success'),
    themeColor('danger'),
    themeColor('primarySoft'),
  ];
  const total = Object.values(byCategory).reduce((s, v) => s + Number(v), 0);
  const rows = Object.entries(byCategory)
    .map(([name, amount]) => ({ name, amount: Number(amount) }))
    .sort((a, b) => b.amount - a.amount);

  if (rows.length === 0) {
    return <Text style={styles.emptyText}>{emptyLabel}</Text>;
  }

  return (
    <View>
      {rows.map((row, index) => {
        const pct = total > 0 ? (row.amount / total) * 100 : 0;
        const color = PALETTE[index % PALETTE.length];
        return (
          <View key={row.name} style={styles.catRow}>
            <View style={styles.catRowHeader}>
              <View style={styles.catNameWrap}>
                <View style={[styles.catDot, { backgroundColor: color }]} />
                <Text style={styles.catName}>{row.name}</Text>
              </View>
              <Text style={styles.catAmount}>{row.amount.toFixed(2)}</Text>
            </View>
            <View style={styles.catBarTrack}>
              <View style={[styles.catBarFill, { width: `${Math.max(pct, 2)}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.catPercent}>{pct.toFixed(1)}%</Text>
          </View>
        );
      })}
    </View>
  );
}
