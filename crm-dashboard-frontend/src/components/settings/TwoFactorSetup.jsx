import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldCheck, ShieldOff, Copy, Check } from 'lucide-react';
import { twoFactorApi } from '../../api';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import { cn } from '../../utils/helpers';

export default function TwoFactorSetup() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [setupData, setSetupData] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState(null);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: twoFactorApi.getStatus,
  });

  const setupMutation = useMutation({
    mutationFn: twoFactorApi.setup,
    onSuccess: (data) => {
      setSetupData(data);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.error || t('settings.setupFailed')),
  });

  const verifyMutation = useMutation({
    mutationFn: () => twoFactorApi.verifySetup(verifyCode),
    onSuccess: (data) => {
      setRecoveryCodes(data.recoveryCodes);
      setSetupData(null);
      setVerifyCode('');
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      setError('');
    },
    onError: (err) => setError(err.response?.data?.error || t('settings.invalidCode')),
  });

  const disableMutation = useMutation({
    mutationFn: () =>
      twoFactorApi.disable({
        password: disablePassword,
        code: disableCode || undefined,
      }),
    onSuccess: () => {
      setDisableOpen(false);
      setDisablePassword('');
      setDisableCode('');
      setRecoveryCodes(null);
      setSetupData(null);
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      setError('');
    },
    onError: (err) => setError(err.response?.data?.error || t('settings.disable2faFailed')),
  });

  const copyRecoveryCodes = async () => {
    if (!recoveryCodes) return;
    await navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4 dark:border-slate-800 dark:bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'rounded-lg p-2',
              status?.enabled
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            )}
          >
            {status?.enabled ? <ShieldCheck className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {t('settings.twoFactorTitle')}
            </p>
            <p className="text-xs text-slate-500">
              {status?.enabled
                ? t('settings.twoFactorEnabledDesc')
                : t('settings.twoFactorDisabledDesc')}
            </p>
          </div>
        </div>
        {status?.enabled ? (
          <Button variant="secondary" size="sm" onClick={() => setDisableOpen(true)}>
            <ShieldOff className="h-4 w-4" />
            {t('settings.disable2fa')}
          </Button>
        ) : (
          <Button size="sm" onClick={() => setupMutation.mutate()} loading={setupMutation.isPending}>
            {t('settings.enable2fa')}
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {recoveryCodes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {t('settings.saveRecoveryCodes')}
          </p>
          <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/80">
            {t('settings.recoveryCodesDesc')}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-white p-3 font-mono text-sm dark:bg-slate-900">
            {recoveryCodes.map((code) => (
              <span key={code} className="text-slate-700 dark:text-slate-300">
                {code}
              </span>
            ))}
          </div>
          <Button size="sm" variant="secondary" className="mt-3" onClick={copyRecoveryCodes}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t('settings.copied') : t('settings.copyCodes')}
          </Button>
        </div>
      )}

      <Modal
        open={!!setupData}
        onClose={() => {
          setSetupData(null);
          setVerifyCode('');
        }}
        title={t('settings.setup2faTitle')}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {t('settings.setup2faDesc')}
          </p>
          {setupData?.qrCode && (
            <div className="flex justify-center">
              <img
                src={setupData.qrCode}
                alt="2FA QR Code"
                className="rounded-lg border border-slate-200 dark:border-slate-700"
              />
            </div>
          )}
          {setupData?.secret && (
            <p className="text-center font-mono text-xs text-slate-500">
              {t('settings.manualKey')}: {setupData.secret}
            </p>
          )}
          <Input
            label={t('auth.verificationCode')}
            placeholder="000000"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setSetupData(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => verifyMutation.mutate()}
              loading={verifyMutation.isPending}
              disabled={verifyCode.length !== 6}
            >
              {t('settings.verifyEnable')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={disableOpen} onClose={() => setDisableOpen(false)} title={t('settings.disable2faTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {t('settings.disable2faDesc')}
          </p>
          <Input
            label={t('common.password')}
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
          />
          <Input
            label={t('settings.authenticatorCode')}
            placeholder="000000"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDisableOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => disableMutation.mutate()}
              loading={disableMutation.isPending}
              disabled={!disablePassword && disableCode.length !== 6}
            >
              {t('settings.disable2faBtn')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
