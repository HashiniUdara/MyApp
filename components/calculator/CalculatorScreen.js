import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import styles from './calculator.styles';

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
];

export default function CalculatorScreen() {
  const [display, setDisplay] = useState('0');
  const [prev,    setPrev]    = useState(null);
  const [op,      setOp]      = useState(null);
  const [reset,   setReset]   = useState(false);

  const handlePress = (btn) => {
    if (btn === 'C') { setDisplay('0'); setPrev(null); setOp(null); setReset(false); return; }

    if (btn === '⌫') {
      setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0');
      return;
    }

    if (btn === '±') { setDisplay(d => d.startsWith('-') ? d.slice(1) : '-' + d); return; }
    if (btn === '%')  { setDisplay(d => String(parseFloat(d) / 100)); return; }

    if (['÷','×','−','+'].includes(btn)) {
      setPrev(parseFloat(display));
      setOp(btn);
      setReset(true);
      return;
    }

    if (btn === '=') {
      if (op === null || prev === null) return;
      const cur = parseFloat(display);
      let result;
      if (op === '+') result = prev + cur;
      else if (op === '−') result = prev - cur;
      else if (op === '×') result = prev * cur;
      else if (op === '÷') result = cur === 0 ? 'Error' : prev / cur;
      setDisplay(String(+result.toFixed(10)));
      setPrev(null); setOp(null); setReset(false);
      return;
    }

    if (btn === '.') {
      if (reset) { setDisplay('0.'); setReset(false); return; }
      if (!display.includes('.')) setDisplay(d => d + '.');
      return;
    }

    // Number
    setDisplay(d => {
      if (reset) { setReset(false); return btn; }
      return d === '0' ? btn : d + btn;
    });
  };

  const isOp = (b) => ['÷','×','−','+'].includes(b);

  return (
    <View style={styles.container}>
      {/* Display */}
      <View style={styles.displayBox}>
        {op && <Text style={styles.opHint}>{prev} {op}</Text>}
        <Text style={styles.display} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>

      {/* Buttons */}
      {BUTTONS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map(btn => {
            const isEquals  = btn === '=';
            const isOperator = isOp(btn);
            const isSpecial  = ['C','±','%'].includes(btn);
            return (
              <TouchableOpacity
                key={btn}
                style={[
                  styles.btn,
                  isEquals   && styles.btnEquals,
                  isOperator && styles.btnOp,
                  isSpecial  && styles.btnSpecial,
                  btn === op && styles.btnOpActive,
                ]}
                onPress={() => handlePress(btn)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.btnText,
                  isEquals   && styles.btnTextEquals,
                  isOperator && styles.btnTextOp,
                  isSpecial  && styles.btnTextSpecial,
                ]}>
                  {btn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}
