import { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  showPopup: (params: { title?: string; message: string; buttons?: Array<{ id: string; text: string }> }) => Promise<{ button_id: string }>;
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  readTextFromClipboard: () => Promise<string | null>;
  requestWriteAccess: () => Promise<boolean>;
  requestContact: () => Promise<boolean>;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
    setParams: (params: Partial<{
      text: string;
      color: string;
      textColor: string;
      isVisible: boolean;
      isActive: boolean;
    }>) => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
    secondary_bg_color: string;
  };
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
    };
    receiver?: Record<string, unknown>;
    chat?: Record<string, unknown>;
    chat_type?: string;
    chat_instance?: string;
    start_param?: string;
    can_send_after?: number;
    auth_date: number;
    hash: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  isClosingConfirmationEnabled: boolean;
  headerColor: string;
  backgroundColor: string;
  onEvent: (eventType: string, eventHandler: (...args: unknown[]) => void) => void;
  offEvent: (eventType: string, eventHandler: (...args: unknown[]) => void) => void;
  sendData: (data: string) => void;
  switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
}

interface TelegramContextValue {
  webApp: TelegramWebApp | null;
  user: TelegramWebApp['initDataUnsafe']['user'] | null;
  isReady: boolean;
  haptic: {
    light: () => void;
    medium: () => void;
    heavy: () => void;
    success: () => void;
    error: () => void;
    warning: () => void;
    selection: () => void;
  };
  mainButton: {
    show: (text: string, onClick: () => void, options?: { color?: string; textColor?: string }) => void;
    hide: () => void;
    setLoading: (loading: boolean) => void;
    setEnabled: (enabled: boolean) => void;
  };
  backButton: {
    show: (onClick: () => void) => void;
    hide: () => void;
  };
}

const TelegramContext = createContext<TelegramContextValue | undefined>(undefined);

export function useTelegram(): TelegramContextValue {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }
  return context;
}

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tg = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
      setWebApp(tg);
      setIsReady(true);
      tg.HapticFeedback?.impactOccurred('light');
    }
  }, []);

  const haptic = {
    light: useCallback(() => webApp?.HapticFeedback?.impactOccurred('light'), [webApp]),
    medium: useCallback(() => webApp?.HapticFeedback?.impactOccurred('medium'), [webApp]),
    heavy: useCallback(() => webApp?.HapticFeedback?.impactOccurred('heavy'), [webApp]),
    success: useCallback(() => webApp?.HapticFeedback?.notificationOccurred('success'), [webApp]),
    error: useCallback(() => webApp?.HapticFeedback?.notificationOccurred('error'), [webApp]),
    warning: useCallback(() => webApp?.HapticFeedback?.notificationOccurred('warning'), [webApp]),
    selection: useCallback(() => webApp?.HapticFeedback?.selectionChanged(), [webApp]),
  };

  const mainButton = {
    show: useCallback(
      (text: string, onClick: () => void, options?: { color?: string; textColor?: string }) => {
        if (!webApp) return;
        webApp.MainButton.setText(text);
        webApp.MainButton.onClick(onClick);
        webApp.MainButton.setParams({
          color: options?.color || '#00f0ff',
          textColor: options?.textColor || '#0a0a0f',
        });
        webApp.MainButton.show();
      },
      [webApp]
    ),
    hide: useCallback(() => {
      webApp?.MainButton.hide();
    }, [webApp]),
    setLoading: useCallback(
      (loading: boolean) => {
        if (!webApp) return;
        if (loading) {
          webApp.MainButton.showProgress(true);
        } else {
          webApp.MainButton.hideProgress();
        }
      },
      [webApp]
    ),
    setEnabled: useCallback(
      (enabled: boolean) => {
        if (!webApp) return;
        if (enabled) {
          webApp.MainButton.enable();
        } else {
          webApp.MainButton.disable();
        }
      },
      [webApp]
    ),
  };

  const backButton = {
    show: useCallback(
      (onClick: () => void) => {
        if (!webApp) return;
        webApp.BackButton.onClick(onClick);
        webApp.BackButton.show();
      },
      [webApp]
    ),
    hide: useCallback(() => {
      webApp?.BackButton.hide();
    }, [webApp]),
  };

  const user = webApp?.initDataUnsafe?.user ?? null;

  return (
    <TelegramContext.Provider value={{ webApp, user, isReady, haptic, mainButton, backButton }}>
      {children}
    </TelegramContext.Provider>
  );
};

