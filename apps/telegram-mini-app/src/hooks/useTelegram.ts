import { useCallback, useEffect, useRef, useState } from 'react';
import type { TelegramWebApp, TelegramUser, TelegramThemeParams } from '../types';

interface UseTelegramReturn {
  webApp: TelegramWebApp | null;
  isReady: boolean;
  user: TelegramUser | null;
  themeParams: TelegramThemeParams;
  colorScheme: 'light' | 'dark';
  viewportHeight: number;
  platform: string;
  expand: () => void;
  close: () => void;
  showMainButton: (text: string, onClick: () => void) => void;
  hideMainButton: () => void;
  setMainButtonLoading: (loading: boolean) => void;
  showBackButton: (onClick: () => void) => void;
  hideBackButton: () => void;
  hapticImpact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  hapticNotification: (type: 'error' | 'success' | 'warning') => void;
  showPopup: (params: Parameters<TelegramWebApp['showPopup']>[0]) => Promise<string>;
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  readTextFromClipboard: () => Promise<string>;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  sendData: (data: string) => void;
}

export function useTelegram(): UseTelegramReturn {
  const [isReady, setIsReady] = useState<boolean>(false);
  const webAppRef = useRef<TelegramWebApp | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      console.warn('Telegram WebApp SDK not available');
      return;
    }
    webAppRef.current = tg;
    tg.ready();
    setIsReady(true);

    const handleViewportChanged = (): void => {
      // Force re-render on viewport change
      setIsReady((prev) => prev);
    };

    tg.onEvent('viewportChanged', handleViewportChanged);

    return () => {
      tg.offEvent('viewportChanged', handleViewportChanged);
    };
  }, []);

  const webApp = webAppRef.current;

  const expand = useCallback((): void => {
    webApp?.expand();
  }, [webApp]);

  const close = useCallback((): void => {
    webApp?.close();
  }, [webApp]);

  const showMainButton = useCallback((text: string, onClick: () => void): void => {
    if (!webApp) return;
    webApp.MainButton.setText(text);
    webApp.MainButton.onClick(onClick);
    webApp.MainButton.show();
  }, [webApp]);

  const hideMainButton = useCallback((): void => {
    if (!webApp) return;
    webApp.MainButton.hide();
  }, [webApp]);

  const setMainButtonLoading = useCallback((loading: boolean): void => {
    if (!webApp) return;
    if (loading) {
      webApp.MainButton.showProgress(false);
      webApp.MainButton.disable();
    } else {
      webApp.MainButton.hideProgress();
      webApp.MainButton.enable();
    }
  }, [webApp]);

  const showBackButton = useCallback((onClick: () => void): void => {
    if (!webApp) return;
    webApp.BackButton.onClick(onClick);
    webApp.BackButton.show();
  }, [webApp]);

  const hideBackButton = useCallback((): void => {
    if (!webApp) return;
    webApp.BackButton.hide();
  }, [webApp]);

  const hapticImpact = useCallback((style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void => {
    webApp?.HapticFeedback?.impactOccurred(style);
  }, [webApp]);

  const hapticNotification = useCallback((type: 'error' | 'success' | 'warning'): void => {
    webApp?.HapticFeedback?.notificationOccurred(type);
  }, [webApp]);

  const showPopup = useCallback(
    (params: Parameters<TelegramWebApp['showPopup']>[0]): Promise<string> => {
      if (!webApp) return Promise.reject(new Error('Telegram WebApp not available'));
      return webApp.showPopup(params);
    },
    [webApp]
  );

  const showAlert = useCallback(
    (message: string): Promise<void> => {
      if (!webApp) return Promise.reject(new Error('Telegram WebApp not available'));
      return webApp.showAlert(message);
    },
    [webApp]
  );

  const showConfirm = useCallback(
    (message: string): Promise<boolean> => {
      if (!webApp) return Promise.reject(new Error('Telegram WebApp not available'));
      return webApp.showConfirm(message);
    },
    [webApp]
  );

  const openLink = useCallback(
    (url: string, options?: { try_instant_view?: boolean }): void => {
      webApp?.openLink(url, options);
    },
    [webApp]
  );

  const readTextFromClipboard = useCallback((): Promise<string> => {
    if (!webApp) return Promise.reject(new Error('Telegram WebApp not available'));
    return webApp.readTextFromClipboard();
  }, [webApp]);

  const setHeaderColor = useCallback(
    (color: string): void => {
      webApp?.setHeaderColor(color);
    },
    [webApp]
  );

  const setBackgroundColor = useCallback(
    (color: string): void => {
      webApp?.setBackgroundColor(color);
    },
    [webApp]
  );

  const enableClosingConfirmation = useCallback((): void => {
    webApp?.enableClosingConfirmation();
  }, [webApp]);

  const disableClosingConfirmation = useCallback((): void => {
    webApp?.disableClosingConfirmation();
  }, [webApp]);

  const sendData = useCallback(
    (data: string): void => {
      webApp?.sendData(data);
    },
    [webApp]
  );

  return {
    webApp,
    isReady,
    user: webApp?.initDataUnsafe?.user ?? null,
    themeParams: webApp?.themeParams ?? {},
    colorScheme: webApp?.colorScheme ?? 'dark',
    viewportHeight: webApp?.viewportHeight ?? window.innerHeight,
    platform: webApp?.platform ?? 'unknown',
    expand,
    close,
    showMainButton,
    hideMainButton,
    setMainButtonLoading,
    showBackButton,
    hideBackButton,
    hapticImpact,
    hapticNotification,
    showPopup,
    showAlert,
    showConfirm,
    openLink,
    readTextFromClipboard,
    setHeaderColor,
    setBackgroundColor,
    enableClosingConfirmation,
    disableClosingConfirmation,
    sendData,
  };
}

