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
import { WORDINGS } from '../../config/wordings';

export default function SetNewPasswordScreen({ recoveryPayload, onDone }) {
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [accessToken, setAccessToken] = useState(recoveryPayload?.accessToken ?? null);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  // Exchange the token hash for a session access token if needed
  useEffect(() => {
    const tokenHash = recoveryPayload?.tokenHash;
    if (accessToken) {
      setVerifying(false);
      return;
    }
    if (!tokenHash) {
      setError('Invalid reset link.');
      setVerifying(false);
      return;
    }

    verifyRecoveryToken(tokenHash)
      .then(data => setAccessToken(data.access_token))
      .catch(e  => setError(e.message ?? WORDINGS.auth.invalidResetCode))
      .finally(() => setVerifying(false));
  }, [accessToken, recoveryPayload]);

  const handleSubmit = async () => {
    setError('');
    if (!password.trim())          { setError(WORDINGS.auth.pleaseEnterNewPassword); return; }
    if (password.length < 6)       { setError(WORDINGS.auth.passwordTooShort); return; }
    if (password !== confirm)      { setError(WORDINGS.auth.passwordsDoNotMatch); return; }
    if (!accessToken)              { setError(WORDINGS.auth.sessionExpired); return; }

    setLoading(true);
    try {
      await setNewPassword(accessToken, password);
      setSuccess(true);
    } catch (e) {
      setError(e.message ?? WORDINGS.auth.failedToUpdatePassword);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={themeColor('primary')} />
        <Text style={styles.verifyText}>{WORDINGS.auth.verifyingResetLink}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{WORDINGS.auth.setNewPassword}</Text>

        {success ? (
          <View>
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                {WORDINGS.auth.resetSuccess}
              </Text>
            </View>
            <Text style={styles.successSub}>
              {WORDINGS.auth.passwordChanged}
            </Text>
            <TouchableOpacity style={styles.btn} onPress={onDone}>
              <Text style={styles.btnText}>{WORDINGS.auth.goToSignIn}</Text>
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
                <Text style={styles.label}>{WORDINGS.auth.newPasswordLabel}</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder={WORDINGS.auth.newPasswordPlaceholder}
                    placeholderTextColor={themeColor('placeholder')}
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

                <Text style={styles.label}>{WORDINGS.auth.confirmNewPasswordLabel}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={WORDINGS.auth.confirmNewPasswordPlaceholder}
                  placeholderTextColor={themeColor('placeholder')}
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
                    : <Text style={styles.btnText}>{WORDINGS.auth.updatePassword}</Text>
                  }
                </TouchableOpacity>
              </>
            )}

            {/* If the link was invalid, give a retry option */}
            {!!error && (
              <TouchableOpacity style={styles.backLink} onPress={onDone}>
                <Ionicons name="arrow-back" size={16} color={themeColor('primary')} />
                <Text style={styles.backText}>{WORDINGS.auth.backToSignIn}</Text>
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
