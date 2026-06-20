import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import AuthShell, { AuthDivider, AuthFooterLink, AuthError } from '../../components/auth/AuthShell';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, loginWithGoogle, verify2FA } = useAuth();
  const { googleEnabled } = useGoogleAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('credentials');
  const [tempToken, setTempToken] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      const result = await login(data);
      if (result?.requires2FA) {
        setTempToken(result.tempToken);
        setStep('2fa');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setError('');
    setLoading(true);
    try {
      const result = await loginWithGoogle(response.credential);
      if (result?.requires2FA) {
        setTempToken(result.tempToken);
        setStep('2fa');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || t('auth.googleSignInFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onVerify2FA = async (data) => {
    setError('');
    setLoading(true);
    try {
      await verify2FA({
        tempToken,
        code: useRecovery ? undefined : data.code,
        recoveryCode: useRecovery ? data.recoveryCode : undefined,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('auth.verificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setStep('credentials');
    setTempToken('');
    setUseRecovery(false);
    setError('');
  };

  if (step === '2fa') {
    return (
      <AuthShell
        variant="minimal"
        title={t('auth.twoFactorTitle')}
        subtitle={
          useRecovery ? t('auth.twoFactorRecoverySubtitle') : t('auth.twoFactorTotpSubtitle')
        }
        footer={
          <div className="flex flex-col gap-2 text-center text-sm">
            <button
              type="button"
              onClick={() => setUseRecovery(!useRecovery)}
              className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
            >
              {useRecovery ? t('auth.useAuthenticator') : t('auth.useRecovery')}
            </button>
            <button
              type="button"
              onClick={backToLogin}
              className="text-slate-500 transition-colors hover:text-slate-700 dark:hover:text-slate-300"
            >
              {t('auth.backToSignIn')}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onVerify2FA)} className="space-y-5">
          {useRecovery ? (
            <Input
              label={t('auth.recoveryCode')}
              placeholder="XXXX-XXXX"
              {...register('recoveryCode', { required: true })}
            />
          ) : (
            <Input
              label={t('auth.verificationCode')}
              placeholder="000000"
              maxLength={6}
              {...register('code', { required: true, minLength: 6, maxLength: 6 })}
            />
          )}

          <AuthError message={error} />

          <Button type="submit" className="w-full" loading={loading}>
            {t('auth.verifyContinue')}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t('auth.welcomeBack')}
      subtitle={t('auth.signInSubtitle')}
      footer={
        <AuthFooterLink
          prompt={t('auth.noAccount')}
          linkText={t('auth.createOne')}
          to="/register"
        />
      }
    >
      {googleEnabled && (
        <>
          <GoogleSignInButton
            label="signin_with"
            onSuccess={handleGoogleSuccess}
            onError={() => setError(t('auth.googleCancelled'))}
          />
          <AuthDivider />
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label={t('common.email')}
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          {...register('email', { required: true })}
        />
        <Input
          label={t('common.password')}
          type="password"
          placeholder={t('auth.passwordPlaceholder')}
          {...register('password', { required: true })}
        />

        <AuthError message={error} />

        <Button type="submit" className="w-full" loading={loading}>
          {t('auth.signIn')}
        </Button>
      </form>
    </AuthShell>
  );
}
