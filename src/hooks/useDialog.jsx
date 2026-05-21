import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const DialogContext = createContext(null);

export const DialogProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [active, setActive] = useState(null);

  const processNext = useCallback(() => {
    setActive((prev) => {
      if (prev) return prev;
      return setQueue((q) => {
        const next = q[0] || null;
        if (next) {
          setActive(next);
          return q.slice(1);
        }
        return q;
      });
    });
  }, []);

  const closeActive = useCallback(() => {
    setActive(null);
    setTimeout(processNext, 0);
  }, [processNext]);

  const alert = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      const item = {
        id: Math.random().toString(36).slice(2),
        type: 'alert',
        message: String(message ?? ''),
        title: options.title || 'Aviso',
        confirmText: options.confirmText || 'Aceptar',
        onConfirm: () => {
          resolve(true);
          closeActive();
        },
      };
      setQueue((q) => [...q, item]);
      setTimeout(processNext, 0);
    });
  }, [closeActive, processNext]);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      const item = {
        id: Math.random().toString(36).slice(2),
        type: 'confirm',
        message: String(message ?? ''),
        title: options.title || 'Confirmación',
        confirmText: options.confirmText || 'Sí',
        cancelText: options.cancelText || 'No',
        onConfirm: () => { resolve(true); closeActive(); },
        onCancel: () => { resolve(false); closeActive(); },
      };
      setQueue((q) => [...q, item]);
      setTimeout(processNext, 0);
    });
  }, [closeActive, processNext]);

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      {active && (
        <div className="modal d-block panel-dialog" tabIndex="-1" role="dialog" style={{ background: 'rgba(15,23,42,0.55)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{active.title}</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => {
                  if (active.type === 'confirm' && active.onCancel) active.onCancel(); else closeActive();
                }}></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">{active.message}</p>
              </div>
              <div className="modal-footer">
                {active.type === 'confirm' && (
                  <button type="button" className="btn btn-secondary" onClick={active.onCancel}>{active.cancelText}</button>
                )}
                <button type="button" className="btn btn-primary" onClick={active.onConfirm}>{active.confirmText}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog debe usarse dentro de DialogProvider');
  return ctx;
};


