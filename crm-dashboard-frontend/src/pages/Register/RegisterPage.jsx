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

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerUser, loginWithGoogle } = useAuth();
  const { googleEnabled } = useGoogleAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    setError('');
    if (data.password !== data.confirmPassword) {
      setError(t('auth.passwordsNoMatch'));
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('auth.googleSignUpFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={t('auth.createAccount')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <AuthFooterLink
          prompt={t('auth.hasAccount')}
          linkText={t('auth.signIn')}
          to="/login"
        />
      }
    >
      {googleEnabled && (
        <>
          <GoogleSignInButton
            label="signup_with"
            onSuccess={handleGoogleSuccess}
            onError={() => setError(t('auth.googleCancelled'))}
          />
          <AuthDivider />
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label={t('auth.fullName')}
          placeholder={t('auth.namePlaceholder')}
          {...register('name', { required: true })}
        />
        <Input
          label={t('common.email')}
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          {...register('email', { required: true })}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label={t('common.password')}
            type="password"
            placeholder={t('auth.passwordMinPlaceholder')}
            {...register('password', { required: true, minLength: 6 })}
          />
          <Input
            label={t('auth.confirmPassword')}
            type="password"
            placeholder={t('auth.passwordPlaceholder')}
            {...register('confirmPassword', { required: true })}
          />
        </div>

        <AuthError message={error} />

        <Button type="submit" className="w-full" loading={loading}>
          {t('auth.createAccountBtn')}
        </Button>
      </form>
    </AuthShell>
  );
}
