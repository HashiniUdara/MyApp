import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { setNewPassword } from '../../store/supabaseClient';
import { WORDINGS } from '../../config/wordings';
import { themeColor } from '../../config/theme';
import styles from './AuthScreen.styles';

// Rendered instead of the normal AuthScreen/MainApp tree whenever the app
// detects it was opened via a Supabase "reset password" email link (see
// utils/recoveryLink.js + App.js). The access token in that link is a
// short-lived recovery session — good for nothing except setting a new
// password, so that's the only thing this screen does.
export default function ResetPasswordScreen({ accessToken, onDone }) {
  const [newPass, setNewPassState] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (newPass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPass !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await setNewPassword(accessToken, newPass);
      setSuccess(true);
    } catch (e) {
      setError(e.message || WORDINGS.errors.invalidResetCode);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.appName}>MyApp</Text>
        <Text style={styles.tagline}>{WORDINGS.auth.resetTitle}</Text>

        {success ? (
          <>
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ {WORDINGS.auth.resetSuccess}</Text>
            </View>
            <TouchableOpacity style={styles.btn} onPress={onDone}>
              <Text style={styles.btnText}>{WORDINGS.auth.backToSignIn}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.hint, { textAlign: 'left', marginTop: 0, marginBottom: 16 }]}>
              Choose a new password for your account.
            </Text>

            <Text style={styles.label}>{WORDINGS.auth.newPasswordLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={themeColor('mutedText')}
              value={newPass}
              onChangeText={setNewPassState}
              secureTextEntry
            />

            <Text style={styles.label}>{WORDINGS.auth.confirmNewPasswordLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={themeColor('mutedText')}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
            />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
              {loading
                ? <ActivityIndicator color={themeColor('textPrimary')} />
                : <Text style={styles.btnText}>{WORDINGS.auth.verifyAndReset}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={onDone}>
              <Text style={styles.hint}>{WORDINGS.auth.backToSignIn}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
