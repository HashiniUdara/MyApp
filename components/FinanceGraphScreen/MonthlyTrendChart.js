import { Fragment } from 'react';
import { View, Text } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { themeColor } from '../../config/theme';
import styles from './FinanceGraphScreen.styles';

const VIEW_W = 340;
const VIEW_H = 220;
const PAD_LEFT = 40;
const PAD_RIGHT = 12;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;
const GRID_LINES = 4;

function niceMax(value) {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const residual = value / magnitude;
  let step;
  if (residual <= 1) step = 1;
  else if (residual <= 2) step = 2;
  else if (residual <= 5) step = 5;
  else step = 10;
  return step * magnitude;
}

export default function MonthlyTrendChart({ months }) {
  const maxValue = niceMax(Math.max(1, ...months.map(m => Math.max(m.income, m.expense))));
  const plotW = VIEW_W - PAD_LEFT - PAD_RIGHT;
  const plotH = VIEW_H - PAD_TOP - PAD_BOTTOM;

  const xFor = (i) => PAD_LEFT + (i / (months.length - 1)) * plotW;
  const yFor = (v) => PAD_TOP + plotH - (v / maxValue) * plotH;

  const incomePoints = months.map((m, i) => `${xFor(i)},${yFor(m.income)}`).join(' ');
  const expensePoints = months.map((m, i) => `${xFor(i)},${yFor(m.expense)}`).join(' ');

  const gridColor = themeColor('surfaceAlt');
  const textColor = themeColor('mutedText');
  const incomeColor = themeColor('success');
  const expenseColor = themeColor('danger');

  return (
    <View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: incomeColor }]} />
          <Text style={styles.legendLabel}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: expenseColor }]} />
          <Text style={styles.legendLabel}>Expenses</Text>
        </View>
      </View>

      <Svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" height={220} preserveAspectRatio="none">
        {/* Horizontal grid lines + axis labels */}
        {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
          const value = (maxValue / GRID_LINES) * i;
          const y = yFor(value);
          return (
            <Fragment key={i}>
              <Line x1={PAD_LEFT} y1={y} x2={VIEW_W - PAD_RIGHT} y2={y} stroke={gridColor} strokeWidth={1} />
              <SvgText x={PAD_LEFT - 8} y={y + 3} fontSize={9} fill={textColor} textAnchor="end">
                {Math.round(value)}
              </SvgText>
            </Fragment>
          );
        })}

        {/* Month labels */}
        {months.map((m, i) => (
          <SvgText
            key={m.month}
            x={xFor(i)}
            y={VIEW_H - PAD_BOTTOM + 16}
            fontSize={8.5}
            fill={textColor}
            textAnchor="middle"
          >
            {m.label.slice(0, 3)}
          </SvgText>
        ))}

        {/* Expense line (drawn first so income sits on top) */}
        <Polyline points={expensePoints} fill="none" stroke={expenseColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {months.map((m, i) => (
          <Circle key={`e-${m.month}`} cx={xFor(i)} cy={yFor(m.expense)} r={3.2} fill={expenseColor} />
        ))}

        {/* Income line */}
        <Polyline points={incomePoints} fill="none" stroke={incomeColor} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {months.map((m, i) => (
          <Circle key={`i-${m.month}`} cx={xFor(i)} cy={yFor(m.income)} r={3.2} fill={incomeColor} />
        ))}
      </Svg>
    </View>
  );
}
