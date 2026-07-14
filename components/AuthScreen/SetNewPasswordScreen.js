/**
 * SetNewPasswordScreen
 * Shown when the user arrives from a password reset email link.
 * The deep link carries a token in the URL fragment.
 */
import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setNewPassword, verifyRecoveryToken } from '../../store/supabaseClient';
import { themeColor } from '../../config/theme';

export default function SetNewPasswordScreen({ tokenHash, onDone }) {
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  // Exchange the token hash for a session access token
  useEffect(() => {
    if (!tokenHash) { setError('Invalid reset link.'); setVerifying(false); return; }
    verifyRecoveryToken(tokenHash)
      .then(data => setAccessToken(data.access_token))
      .catch(e  => setError(e.message ?? 'This reset link is invalid or has expired.'))
      .finally(() => setVerifying(false));
  }, [tokenHash]);

  const handleSubmit = async () => {
    setError('');
    if (!password.trim())          { setError('Please enter a new password.'); return; }
    if (password.length < 6)       { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm)      { setError('Passwords do not match.'); return; }
    if (!accessToken)              { setError('Session expired. Please request a new reset link.'); return; }

    setLoading(true);
    try {
      await setNewPassword(accessToken, password);
      setSuccess(true);
    } catch (e) {
      setError(e.message ?? 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={themeColor('primary')} />
        <Text style={styles.verifyText}>Verifying reset link…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Set New Password</Text>

        {success ? (
          <View>
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                ✅ Password updated successfully!
              </Text>
            </View>
            <Text style={styles.successSub}>
              Your password has been changed. You can now sign in with your new password.
            </Text>
            <TouchableOpacity style={styles.btn} onPress={onDone}>
              <Text style={styles.btnText}>Go to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!error && (
              <>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder="At least 6 characters"
                    placeholderTextColor={themeColor('mutedText')}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    autoFocus
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPass(v => !v)}
                  >
                    <Ionicons
                      name={showPass ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={themeColor('mutedText')}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Repeat your password"
                  placeholderTextColor={themeColor('mutedText')}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={[styles.btn, (loading || !password) && styles.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={loading || !password}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.btnText}>Update Password</Text>
                  }
                </TouchableOpacity>
              </>
            )}

            {/* If the link was invalid, give a retry option */}
            {!!error && (
              <TouchableOpacity style={styles.backLink} onPress={onDone}>
                <Ionicons name="arrow-back" size={16} color={themeColor('primary')} />
                <Text style={styles.backText}>Back to Sign In</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: themeColor('background'), justifyContent: 'center', padding: 24 },
  center:     { flex: 1, backgroundColor: themeColor('background'), alignItems: 'center', justifyContent: 'center', gap: 16 },
  verifyText: { color: themeColor('textSecondary'), fontSize: 14 },

  card: {
    backgroundColor: themeColor('surface'),
    borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: themeColor('surfaceAlt'),
  },

  title: { color: themeColor('textPrimary'), fontSize: 22, fontWeight: '800', marginBottom: 20 },
  label: { color: themeColor('textSecondary'), fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 4 },

  inputWrap: { position: 'relative' },
  input: {
    backgroundColor: themeColor('background'),
    borderWidth: 1, borderColor: themeColor('surfaceAlt'),
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: themeColor('textPrimary'), fontSize: 15, marginBottom: 12,
    paddingRight: 48,
  },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },

  btn:         { backgroundColor: themeColor('primary'), borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.5 },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 16 },

  errorBox:  { backgroundColor: '#3a1a1f', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: themeColor('danger') },
  errorText: { color: themeColor('danger'), fontSize: 13, lineHeight: 20 },

  successBox: { backgroundColor: '#0d2b1a', borderRadius: 10, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: themeColor('primary') },
  successText:{ color: themeColor('primary'), fontSize: 13, fontWeight: '600' },
  successSub: { color: themeColor('textSecondary'), fontSize: 13, marginBottom: 20, lineHeight: 20 },

  backLink:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, justifyContent: 'center' },
  backText:  { color: themeColor('primary'), fontSize: 14, fontWeight: '600' },
});
