const rootEl = document.getElementById('root');

if (!rootEl) {
  document.body.innerHTML =
    '<div style="padding:24px;background:#0a0a0f;color:#fff">Missing #root</div>';
} else {
  // Always paint something before async imports (diagnoses white screen)
  rootEl.innerHTML =
    '<div style="min-height:100dvh;padding:24px;background:#0a0a0f;color:#f0f0f5;font-family:system-ui,sans-serif">' +
    '<h1 style="margin:0 0 8px;font-size:20px">Cryptra</h1>' +
    '<p style="margin:0;color:rgba(255,255,255,0.55)">Loading app…</p>' +
    '<p id="boot-status" style="margin-top:12px;font-size:12px;color:#a78bfa">boot ok</p>' +
    '</div>';

  void (async () => {
    const status = document.getElementById('boot-status');
    try {
      status && (status.textContent = 'importing react…');
      const React = await import('react');
      const ReactDOM = await import('react-dom/client');
      status && (status.textContent = 'importing router…');
      const { RouterProvider } = await import('@tanstack/react-router');
      const { router } = await import('./app/router');
      const { Providers } = await import('./app/providers');
      await import('./styles/globals.css');

      class ErrorBoundary extends React.Component<
        { children: React.ReactNode },
        { error: Error | null }
      > {
        state: { error: Error | null } = { error: null };
        static getDerivedStateFromError(error: Error) {
          return { error };
        }
        render() {
          if (this.state.error) {
            return React.createElement(
              'div',
              {
                style: {
                  minHeight: '100dvh',
                  padding: 24,
                  background: '#0a0a0f',
                  color: '#f0f0f5',
                  fontFamily: 'system-ui, sans-serif',
                },
              },
              React.createElement('h1', { style: { fontSize: 18 } }, 'Cryptra UI error'),
              React.createElement(
                'pre',
                {
                  style: {
                    whiteSpace: 'pre-wrap',
                    fontSize: 12,
                    color: '#ff8a80',
                  },
                },
                String(this.state.error?.message || this.state.error) +
                  '\n' +
                  String(this.state.error?.stack || ''),
              ),
            );
          }
          return this.props.children;
        }
      }

      status && (status.textContent = 'rendering…');
      ReactDOM.createRoot(rootEl).render(
        React.createElement(
          React.StrictMode,
          null,
          React.createElement(
            ErrorBoundary,
            null,
            React.createElement(
              Providers,
              null,
              React.createElement(RouterProvider, { router }),
            ),
          ),
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message + '\n' + err.stack : String(err);
      rootEl.innerHTML =
        '<div style="min-height:100dvh;padding:24px;background:#0a0a0f;color:#ff8a80;font-family:monospace;white-space:pre-wrap;font-size:12px">BOOT ERROR\n' +
        msg +
        '</div>';
    }
  })();
}
