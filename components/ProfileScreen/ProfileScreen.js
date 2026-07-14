import { useState } from 'react';
import { Switch, View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../store/authStore/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import ConfirmDialog from '../common/ConfirmDialog';
import { WORDINGS } from '../../config/wordings';
import { useTheme } from '../../config/theme';
import styles from './ProfileScreen.styles';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const handleLogout = async () => {
    setConfirmSignOut(false);
    await logout();
  };

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{WORDINGS.profile.title}</Text>

      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        <Ionicons name="mail-outline" size={18} color={colors.mutedText} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardLabel}>{WORDINGS.profile.email}</Text>
          <Text style={styles.cardValue}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={18} color={colors.mutedText} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardLabel}>{WORDINGS.profile.theme}</Text>
          <Text style={styles.cardValue}>{isDark ? WORDINGS.profile.darkTheme : WORDINGS.profile.lightTheme}</Text>
        </View>
        <Switch
          value={!isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.surfaceAlt, true: colors.primarySoft }}
          thumbColor={isDark ? colors.accent : colors.primary}
        />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => setConfirmSignOut(true)}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.logoutText}>{WORDINGS.profile.signOut}</Text>
      </TouchableOpacity>

      <ConfirmDialog
        visible={confirmSignOut}
        title={WORDINGS.profile.signOut}
        message={WORDINGS.profile.signOutMessage}
        confirmLabel={WORDINGS.profile.signOut}
        destructive={false}
        onConfirm={handleLogout}
        onCancel={() => setConfirmSignOut(false)}
      />
    </View>
  );
}
