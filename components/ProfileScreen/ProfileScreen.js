import { useEffect, useState } from 'react';
import { Switch, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../store/authStore/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import ConfirmDialog from '../common/ConfirmDialog';
import { WORDINGS } from '../../config/wordings';
import { useTheme } from '../../config/theme';
import styles from './ProfileScreen.styles';
import { getQuickAccessItems, saveQuickAccessItems, QUICK_ACCESS_OPTIONS } from '../../utils/quickAccess';

export default function ProfileScreen({ setActiveTab }) {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [selectedQuickAccess, setSelectedQuickAccess] = useState([]);

  const handleLogout = async () => {
    setConfirmSignOut(false);
    await logout();
  };

  useEffect(() => {
    let mounted = true;
    getQuickAccessItems().then((items) => {
      if (mounted) setSelectedQuickAccess(items);
    });
    return () => { mounted = false; };
  }, []);

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  const toggleQuickAccess = async (id) => {
    setSelectedQuickAccess((prev) => {
      const exists = prev.includes(id);
      let next;
      if (exists) {
        next = prev.filter((item) => item !== id);
      } else {
        next = [...prev, id];
      }
      if (next.length > 3) {
        next = next.slice(-3);
      }
      saveQuickAccessItems(next);
      return next;
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentInner}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{WORDINGS.profile.title}</Text>

      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      
      <TouchableOpacity style={styles.logoutBtn} onPress={() => setConfirmSignOut(true)}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.logoutText}>{WORDINGS.profile.signOut}</Text>
      </TouchableOpacity>

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

      <View style={styles.card}>
        <Ionicons name="flash-outline" size={18} color={colors.mutedText} />
        <TouchableOpacity style={styles.cardInfo} onPress={() => setCollapsed((prev) => !prev)}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>{WORDINGS.profile.quickAccess}</Text>
              <Text style={styles.cardValue}>
                {selectedQuickAccess.length > 0 ? selectedQuickAccess.join(', ') : 'Select up to 3 items'}
              </Text>
            </View>
            <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={18} color={colors.textPrimary} />
          </View>
        </TouchableOpacity>
      </View>

      {!collapsed && (
        <View style={styles.quickAccessOptions}>
          {QUICK_ACCESS_OPTIONS.map((item) => {
            const selected = selectedQuickAccess.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.quickAccessOption, selected && styles.quickAccessOptionActive]}
                onPress={() => toggleQuickAccess(item.id)}
              >
                <Ionicons name={item.icon} size={16} color={selected ? colors.textPrimary : colors.mutedText} />
                <Text style={[styles.quickAccessOptionText, selected && styles.quickAccessOptionTextActive]}>
                  {item.label ? item.label : WORDINGS.nav[item.labelKey]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <ConfirmDialog
        visible={confirmSignOut}
        title={WORDINGS.profile.signOut}
        message={WORDINGS.profile.signOutMessage}
        confirmLabel={WORDINGS.profile.signOut}
        destructive={false}
        onConfirm={handleLogout}
        onCancel={() => setConfirmSignOut(false)}
      />
    </ScrollView>
  );
}
