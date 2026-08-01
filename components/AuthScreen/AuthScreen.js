import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../store/authStore/AuthContext';
import { requestPasswordReset, verifyPasswordResetCode, setNewPassword } from '../../store/supabaseClient';
import { WORDINGS } from '../../config/wordings';
import styles from './AuthScreen.styles';
import { themeColor } from '../../config/theme';

// ── Reusable password field with show/hide eye icon ───────────────
function PasswordInput({ value, onChangeText, placeholder, style }) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.passwordWrap}>
      <TextInput
        style={[styles.input, styles.passwordInput, style]}
        placeholder={placeholder ?? '••••••••'}
        placeholderTextColor={themeColor('placeholder')}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={styles.eyeBtn}
        onPress={() => setShow(v => !v)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={show ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color={themeColor('mutedText')}
        />
      </TouchableOpacity>
    </View>
  );
}

export default function AuthScreen() {
  const { login, register } = useAuth();

  const [mode,     setMode]     = useState('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  // ── Forgot password state ─────────────────────────────────────
  const [resetStep,       setResetStep]       = useState('request');
  const [resetEmail,      setResetEmail]      = useState('');
  const [resetCode,       setResetCode]       = useState('');
  const [newPass,         setNewPass]         = useState('');
  const [newPassConfirm,  setNewPassConfirm]  = useState('');

  const switchMode = (m) => {
    setMode(m); setError(''); setSuccess('');
    if (m === 'forgot') {
      setResetStep('request'); setResetEmail(email.trim());
      setResetCode(''); setNewPass(''); setNewPassConfirm('');
    }
  };

  // ── Sign in / Sign up ─────────────────────────────────────────
  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!email.trim() || !password.trim()) { setError('Email and password are required.'); return; }
    if (mode === 'signup' && password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password);
        setSuccess(`A confirmation email has been sent to ${email.trim()}. Please check your inbox and click the link, then come back and sign in.`);
        setMode('login'); setPassword(''); setConfirm('');
      }
    } catch (e) {
      const msg = e.message ?? '';
      if (msg.includes('Email not confirmed'))       setError('Please confirm your email first. Check your inbox for the confirmation link.');
      else if (msg.includes('Invalid login'))        setError('Wrong email or password.');
      else if (msg.includes('User already registered')) setError('An account with this email already exists. Try signing in.');
      else setError(msg);
    } finally { setLoading(false); }
  };

  // ── Forgot: step 1 — send reset link ─────────────────────────
  const handleSendCode = async () => {
    setError('');
    if (!resetEmail.trim()) { setError('Please enter your email.'); return; }
    setLoading(true);
    try {
      await requestPasswordReset(resetEmail.trim());
      setResetStep('verify');
      setSuccess('Reset link sent! Check your email and click the link. Then come back and enter the code below.');
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  };

  // ── Forgot: step 2 — enter code + new password ───────────────
  const handleResetPassword = async () => {
    setError('');
    if (!resetCode.trim())       { setError('Please enter the verification code.'); return; }
    if (newPass.length < 6)      { setError('Password must be at least 6 characters.'); return; }
    if (newPass !== newPassConfirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const session = await verifyPasswordResetCode(resetEmail.trim(), resetCode.trim());
      if (!session.access_token) throw new Error(WORDINGS.errors.invalidResetCode);
      await setNewPassword(session.access_token, newPass);
      setMode('login'); setEmail(resetEmail.trim()); setPassword('');
      setSuccess(WORDINGS.auth.resetSuccess);
    } catch (e) { setError(e.message); }
    finally     { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.appName}>MyApp</Text>
        <Text style={styles.tagline}>Just track my day</Text>

        {/* ══ FORGOT PASSWORD FLOW ══════════════════════════════ */}
        {mode === 'forgot' ? (
          <>
            <Text style={styles.label}>{WORDINGS.auth.resetTitle}</Text>
            <Text style={[styles.hint, { textAlign: 'left', marginTop: 0, marginBottom: 16 }]}>
              {resetStep === 'request'
                ? WORDINGS.auth.resetStep1Description
                : WORDINGS.auth.resetStep2Description(resetEmail.trim())}
            </Text>

            {!!success && <View style={styles.successBox}><Text style={styles.successText}> {success}</Text></View>}
            {!!error   && <Text style={styles.error}>{error}</Text>}

            {/* Email — always visible */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={themeColor('placeholder')}
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={resetStep === 'request'}
            />

            {/* Code + new passwords — step 2 only */}
            {resetStep === 'verify' && (
              <>
                <Text style={styles.label}>{WORDINGS.auth.codeLabel}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={WORDINGS.auth.codePlaceholder}
                  placeholderTextColor={themeColor('placeholder')}
                  value={resetCode}
                  onChangeText={setResetCode}
                  keyboardType="number-pad"
                />

                <Text style={styles.label}>{WORDINGS.auth.newPasswordLabel}</Text>
                <PasswordInput value={newPass} onChangeText={setNewPass} placeholder="New password" />

                <Text style={styles.label}>{WORDINGS.auth.confirmNewPasswordLabel}</Text>
                <PasswordInput value={newPassConfirm} onChangeText={setNewPassConfirm} placeholder="Confirm new password" />
              </>
            )}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={resetStep === 'request' ? handleSendCode : handleResetPassword}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={themeColor('textPrimary')} />
                : <Text style={styles.btnText}>
                    {resetStep === 'request' ? WORDINGS.auth.sendCode : WORDINGS.auth.verifyAndReset}
                  </Text>
              }
            </TouchableOpacity>

            {resetStep === 'verify' && (
              <Text style={styles.hint}>
                Didn't get a code?{' '}
                <Text style={styles.hintLink} onPress={handleSendCode}>{WORDINGS.auth.resendCode}</Text>
              </Text>
            )}

            <Text style={styles.hint}>
              <Text style={styles.hintLink} onPress={() => switchMode('login')}>
                {WORDINGS.auth.backToSignIn}
              </Text>
            </Text>
          </>

        ) : (
        /* ══ SIGN IN / SIGN UP FLOW ══════════════════════════════ */
        <>
          <View style={styles.toggle}>
            {['login','signup'].map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
                onPress={() => switchMode(m)}
              >
                <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {!!success && <View style={styles.successBox}><Text style={styles.successText}>✅ {success}</Text></View>}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={themeColor('placeholder')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Password with eye icon */}
          <Text style={styles.label}>Password</Text>
          <PasswordInput value={password} onChangeText={setPassword} />

          {/* Confirm password with eye icon */}
          {mode === 'signup' && (
            <>
              <Text style={styles.label}>Confirm Password</Text>
              <PasswordInput value={confirm} onChangeText={setConfirm} placeholder="Repeat password" />
            </>
          )}

          {mode === 'login' && (
            <TouchableOpacity onPress={() => switchMode('forgot')} style={{ alignSelf: 'flex-end', marginBottom: 4 }}>
              <Text style={styles.hintLink}>{WORDINGS.auth.forgotPassword}</Text>
            </TouchableOpacity>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={themeColor('textPrimary')} />
              : <Text style={styles.btnText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
            }
          </TouchableOpacity>

          {mode === 'login' && (
            <Text style={styles.hint}>
              Don't have an account?{' '}
              <Text style={styles.hintLink} onPress={() => switchMode('signup')}>Sign up</Text>
            </Text>
          )}
          {mode === 'signup' && (
            <Text style={styles.hint}>
              Already have an account?{' '}
              <Text style={styles.hintLink} onPress={() => switchMode('login')}>Sign in</Text>
            </Text>
          )}
        </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
