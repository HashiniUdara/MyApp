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
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SYNC_BANNER_COLORS } from '../../config/appConstants';
import { WORDINGS } from '../../config/wordings';

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

  const W = WORDINGS.syncBanner;
  const C = SYNC_BANNER_COLORS;

  let icon  = W.iconOffline;
  let color = C.offlineText;
  let bg    = C.offlineBg;
  let msg   = W.offline;

  if (syncing) {
    icon  = W.iconSyncing;
    color = C.syncingText;
    bg    = C.syncingBg;
    msg   = W.syncing;
  } else if (!online && pendingOps > 0) {
    msg = W.offlinePending(pendingOps);
  } else if (online && pendingOps > 0) {
    icon  = W.iconPending;
    color = C.offlineText;
    bg    = C.offlineBg;
    msg   = W.syncingPending(pendingOps);
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
