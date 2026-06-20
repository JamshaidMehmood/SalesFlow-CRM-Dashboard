import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import { cn } from '../../utils/helpers';

const LABEL_KEYS = {
  signin_with: 'auth.signInGoogle',
  signup_with: 'auth.signUpGoogle',
  continue_with: 'auth.continueGoogle',
  signin: 'auth.signInGoogle',
};

function GoogleLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.56 2.95-2.24 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function GoogleSignInButton({ onSuccess, onError, label = 'continue_with' }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const { googleEnabled, googleClientId, loading } = useGoogleAuth();
  const [buttonWidth, setButtonWidth] = useState(360);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const updateWidth = () => {
      const width = Math.floor(container.getBoundingClientRect().width);
      setButtonWidth(Math.min(400, Math.max(240, width)));
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  if (loading || !googleEnabled || !googleClientId) return null;

  const buttonText = t(LABEL_KEYS[label] || LABEL_KEYS.continue_with);

  return (
    <div ref={containerRef} className="group relative w-full">
      <div
        className={cn(
          'pointer-events-none flex h-11 w-full items-center justify-center gap-3 rounded-xl border px-4',
          'border-[#dadce0] bg-white text-sm font-medium text-[#3c4043]',
          'shadow-sm transition-all duration-150',
          'group-hover:border-[#c6c9cc] group-hover:bg-[#f8f9fa] group-hover:shadow',
          'group-active:scale-[0.99] group-active:shadow-sm',
          'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
          'dark:group-hover:border-slate-500 dark:group-hover:bg-slate-700/80'
        )}
      >
        <GoogleLogo className="h-5 w-5 shrink-0" />
        <span className="truncate">{buttonText}</span>
      </div>

      <div
        className="absolute inset-0 z-10 cursor-pointer opacity-[0.01]"
        aria-label={buttonText}
      >
        <div className="h-full w-full [&>div]:!h-full [&>div]:!w-full [&>div>div]:!h-full [&>div>div]:!w-full [&_iframe]:!h-full [&_iframe]:!min-h-[44px] [&_iframe]:!w-full">
          <GoogleLogin
            onSuccess={onSuccess}
            onError={onError}
            text={label}
            theme="outline"
            shape="rectangular"
            size="large"
            logo_alignment="left"
            width={buttonWidth}
            containerProps={{
              style: { width: '100%', height: '100%' },
            }}
          />
        </div>
      </div>
    </div>
  );
}
