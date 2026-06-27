/**
 * useSocialAuth – shared hook for Google and Facebook OAuth sign-in.
 *
 * Google:   Uses @react-oauth/google `useGoogleLogin` with flow:'auth-code'
 *           to get a one-time code, then we use the tokenResponse (access_token)
 *           + fetch userinfo from Google's API, then send idToken to backend.
 *
 *           Simpler approach used here: Google One Tap / accounts.google.com
 *           credential callback that returns a JWT credential (idToken) directly.
 *
 * Facebook: Loads the Facebook JS SDK lazily, calls FB.login() popup,
 *           then sends the access_token to our backend for verification.
 *
 * IMPORTANT: Replace placeholder values in client/.env:
 *   VITE_GOOGLE_CLIENT_ID=your_client_id
 *   VITE_FACEBOOK_APP_ID=your_app_id
 */

import { useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { apiErrorMessage } from '../services/api.js';

// ── Google Sign-In Script Loader ─────────────────────────────────────────────
let googleScriptPromise = null;

function loadGoogleScript() {
  if (googleScriptPromise) return googleScriptPromise;
  if (window.google?.accounts?.id) return Promise.resolve();

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-gsi-script');
    if (existing) { existing.onload = resolve; return; }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

// ── Facebook SDK Loader ───────────────────────────────────────────────────────
let fbSdkPromise = null;

function loadFacebookSdk(appId) {
  if (fbSdkPromise) return fbSdkPromise;

  fbSdkPromise = new Promise((resolve, reject) => {
    if (window.FB) { resolve(window.FB); return; }

    window.fbAsyncInit = () => {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: 'v19.0'
      });
      resolve(window.FB);
    };

    const existing = document.getElementById('facebook-jssdk');
    if (existing) return;

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Facebook SDK'));
    document.body.appendChild(script);
  });

  return fbSdkPromise;
}
// ─────────────────────────────────────────────────────────────────────────────

export function useSocialAuth({ onSuccess, onError }) {
  const { socialLogin } = useAuth();
  const loadingRef = useRef(false);

  const handleResult = useCallback(
    async (payload) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      try {
        const user = await socialLogin(payload);
        onSuccess?.(user);
      } catch (err) {
        onError?.(apiErrorMessage(err));
      } finally {
        loadingRef.current = false;
      }
    },
    [socialLogin, onSuccess, onError]
  );

  // ── Google ────────────────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'PASTE_YOUR_GOOGLE_CLIENT_ID_HERE') {
      onError?.('Google sign-in is not configured yet. Please use email and password.');
      return;
    }

    try {
      await loadGoogleScript();

      // Initialize Google Identity Services and open One Tap / popup
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            // response.credential is a JWT idToken signed by Google
            handleResult({ provider: 'google', idToken: response.credential });
          } else {
            onError?.('Google sign-in failed. Please try again.');
          }
        },
        ux_mode: 'popup',
        context: 'signin'
      });

      // Render a hidden button and trigger it programmatically
      const container = document.createElement('div');
      container.style.display = 'none';
      document.body.appendChild(container);

      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large'
      });

      // Click the hidden Google button to open the OAuth popup
      const googleBtn = container.querySelector('[role="button"]') || container.querySelector('div[tabindex]');
      if (googleBtn) {
        googleBtn.click();
      } else {
        // Fallback: use prompt (One Tap)
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            onError?.('Google sign-in popup was blocked. Please allow popups for this site.');
          }
        });
      }

      // Clean up the hidden container after 5s
      setTimeout(() => document.body.removeChild(container), 5000);
    } catch {
      onError?.('Could not load Google sign-in. Please check your connection and try again.');
    }
  }, [handleResult, onError]);

  // ── Facebook ──────────────────────────────────────────────────────────────
  const signInWithFacebook = useCallback(async () => {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!appId || appId === 'PASTE_YOUR_FACEBOOK_APP_ID_HERE') {
      onError?.('Facebook sign-in is not configured yet. Please use email and password.');
      return;
    }

    try {
      const FB = await loadFacebookSdk(appId);

      FB.login(
        (response) => {
          if (response.authResponse?.accessToken) {
            handleResult({
              provider: 'facebook',
              accessToken: response.authResponse.accessToken
            });
          } else {
            onError?.('Facebook sign-in was cancelled.');
          }
        },
        { scope: 'public_profile,email' }
      );
    } catch {
      onError?.('Could not load Facebook sign-in. Please try again.');
    }
  }, [handleResult, onError]);

  return { signInWithGoogle, signInWithFacebook };
}
