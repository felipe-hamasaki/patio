'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ZodError } from 'zod';
import {
  type State,
  type Action,
  type Order,
  stateSchema,
  transition,
  parseBackup,
} from './domain';
import { seed } from './seed';

export const STORAGE_KEY = 'patio.demo.v1';
type Store = {
  state: State | null;
  error: string;
  message: string;
  notify: (s: string) => void;
  commit: (fn: (s: State) => State) => boolean;
  act: (id: string, action: Action) => boolean;
  reset: () => boolean;
  importBackup: (raw: string, expectedRevision: number) => boolean;
  reload: () => void;
  simulateFailure: () => void;
};
const Context = createContext<Store | null>(null);
function clearQuoteDrafts() {
  try {
    for (const key of Object.keys(sessionStorage))
      if (key.startsWith('patio.quote-draft.')) sessionStorage.removeItem(key);
  } catch {
    /* Temporary storage may be restricted independently of local storage. */
  }
}
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  const ref = useRef<State | null>(null),
    failure = useRef(false),
    corrupt = useRef(false);
  const notify = useCallback((s: string) => setMessage(s), []);
  const load = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const next = raw ? stateSchema.parse(JSON.parse(raw)) : seed();
      if (!raw) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      ref.current = next;
      setState(next);
      corrupt.current = false;
      setError('');
    } catch {
      corrupt.current = true;
      if (!ref.current) {
        const next = seed();
        ref.current = next;
        setState(next);
      }
      setError(
        'Não foi possível ler os dados locais. Nada foi sobrescrito. Tente recarregar ou restaure a demo para começar novamente.',
      );
    }
  }, []);
  useEffect(() => {
    // Browser storage is an external system and is read only after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const sync = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) {
        load();
        setMessage('Dados atualizados a partir de outra aba.');
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [load]);
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(''), 6000);
    return () => clearTimeout(id);
  }, [message]);
  const commit = useCallback(
    (fn: (s: State) => State) => {
      try {
        if (!ref.current || corrupt.current)
          throw new Error('Recupere o armazenamento antes de salvar alterações.');
        if (failure.current) {
          failure.current = false;
          throw new Error(
            'Falha de gravação simulada. Seu formulário foi preservado. Tente salvar novamente.',
          );
        }
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw || stateSchema.parse(JSON.parse(raw)).revision !== ref.current.revision) {
          load();
          throw new Error(
            'O cenário mudou em outra aba. Revise os dados atualizados e tente novamente.',
          );
        }
        const next = stateSchema.parse(fn(structuredClone(ref.current)));
        next.revision = ref.current.revision + 1;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        ref.current = next;
        setState(next);
        setError('');
        return true;
      } catch (e) {
        const msg =
          e instanceof ZodError
            ? e.issues[0]?.message
            : e instanceof Error
              ? e.message
              : 'Não foi possível salvar. Tente novamente.';
        setError(msg || 'Confira os dados informados.');
        return false;
      }
    },
    [load],
  );
  function act(id: string, action: Action) {
    return commit((s) => {
      const i = s.orders.findIndex((o) => o.id === id);
      if (i < 0) throw new Error('OS não encontrada.');
      s.orders[i] = transition(s.orders[i], action);
      return s;
    });
  }
  function reset() {
    try {
      const next = seed();
      next.revision = (ref.current?.revision ?? 0) + 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      clearQuoteDrafts();
      ref.current = next;
      corrupt.current = false;
      failure.current = false;
      setState(next);
      setError('');
      notify('Cenário restaurado. Um novo dia no pátio.');
      return true;
    } catch {
      setError(
        'O navegador está impedindo a gravação. Permita armazenamento local e tente novamente.',
      );
      return false;
    }
  }
  function importBackup(raw: string, expectedRevision: number) {
    try {
      const next = parseBackup(raw);
      const saved = localStorage.getItem(STORAGE_KEY);
      let current: State | null = null;
      try {
        current = saved ? stateSchema.parse(JSON.parse(saved)) : null;
      } catch {
        if (!corrupt.current)
          throw new Error('O cenário mudou em outra aba. Selecione o arquivo novamente.');
      }
      if (
        ref.current?.revision !== expectedRevision ||
        (current && current.revision !== expectedRevision) ||
        (!saved && !corrupt.current)
      )
        throw new Error('O cenário mudou em outra aba. Selecione o arquivo novamente.');
      next.revision = expectedRevision + 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      clearQuoteDrafts();
      ref.current = next;
      corrupt.current = false;
      failure.current = false;
      setState(next);
      setError('');
      notify('Cenário importado. Seus registros estão disponíveis neste navegador.');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar. Tente novamente.');
      return false;
    }
  }
  return (
    <Context.Provider
      value={{
        state,
        error,
        message,
        notify,
        commit,
        act,
        reset,
        importBackup,
        reload: load,
        simulateFailure: () => {
          failure.current = true;
          notify('A próxima gravação vai falhar uma vez. Depois, tente novamente.');
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDemo() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('DemoProvider ausente.');
  return ctx;
}
export function orderContext(state: State, order: Order) {
  return {
    customer: state.customers.find((c) => c.id === order.customerId)!,
    vehicle: state.vehicles.find((v) => v.id === order.vehicleId)!,
  };
}
