/**
 * SyncStatusBanner.js
 *
 * A slim banner shown at the top of the app when:
 *   • The device is offline  (yellow)
 *   • There are unsynced ops waiting  (yellow)
 *   • A sync is in progress  (blue, pulsing)
 *   • Everything is synced and online  (hidden — no banner)
 */

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SyncStatusBanner({ online, syncing, pendingOps }) {
  const opacity = useRef(new Animated.Value(0)).current;

  const visible = !online || syncing || pendingOps > 0;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible && opacity._value === 0) return null;

  let icon  = 'cloud-offline-outline';
  let color = '#B45309'; // amber-700
  let bg    = '#FEF3C7'; // amber-100
  let msg   = 'Offline — changes saved locally';

  if (syncing) {
    icon  = 'sync-outline';
    color = '#1D4ED8'; // blue-700
    bg    = '#DBEAFE'; // blue-100
    msg   = 'Syncing changes…';
  } else if (!online && pendingOps > 0) {
    msg = `Offline — ${pendingOps} change${pendingOps !== 1 ? 's' : ''} pending sync`;
  } else if (online && pendingOps > 0) {
    icon  = 'time-outline';
    color = '#B45309';
    bg    = '#FEF3C7';
    msg   = `Syncing ${pendingOps} pending change${pendingOps !== 1 ? 's' : ''}…`;
  }

  return (
    <Animated.View style={[styles.banner, { backgroundColor: bg, opacity }]}>
      <Ionicons name={icon} size={14} color={color} style={styles.icon} />
      <Text style={[styles.text, { color }]}>{msg}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 5,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
