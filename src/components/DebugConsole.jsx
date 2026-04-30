import { useEffect, useState } from "react";

export default function DebugConsole() {
  const [logs, setLogs] = useState([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Provide append function other scripts can call
    window.__arConsoleAppend = (level, msg) => {
      setLogs((s) => [...s.slice(-80), { level, msg, time: Date.now() }]);
    };

    // Patch console methods to mirror output into the UI
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    console.log = (...args) => {
      origLog.apply(console, args);
      try {
        window.__arConsoleAppend('log', args.map(a => String(a)).join(' '));
      } catch {
        // Debug mirroring should never break console logging.
      }
    };
    console.warn = (...args) => {
      origWarn.apply(console, args);
      try {
        window.__arConsoleAppend('warn', args.map(a => String(a)).join(' '));
      } catch {
        // Debug mirroring should never break console logging.
      }
    };
    console.error = (...args) => {
      origError.apply(console, args);
      try {
        window.__arConsoleAppend('error', args.map(a => String(a)).join(' '));
      } catch {
        // Debug mirroring should never break console logging.
      }
    };

    return () => {
      // restore
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
      delete window.__arConsoleAppend;
    };
  }, []);

  return (
    <div style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 99, pointerEvents: 'auto' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={() => setVisible(v => !v)} style={{ padding: '6px 10px', fontSize: 12 }}>Debug</button>
        <button onClick={() => setLogs([])} style={{ padding: '6px 10px', fontSize: 12 }}>Clear</button>
      </div>
      {visible && (
        <div style={{ width: 320, maxWidth: '86vw', maxHeight: '46vh', overflow: 'auto', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 12, padding: 8, borderRadius: 8 }}>
          {logs.length === 0 && <div style={{ opacity: 0.6 }}>No logs yet — tap Launch AR</div>}
          {logs.map((l, i) => (
            <div key={i} style={{ marginBottom: 6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <strong style={{ color: l.level === 'error' ? '#ff7777' : l.level === 'warn' ? '#ffd27f' : '#9fe7ff' }}>{l.level}</strong>
              : <span style={{ opacity: 0.85 }}>{l.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
