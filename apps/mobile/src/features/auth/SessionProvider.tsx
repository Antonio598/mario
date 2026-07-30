import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface SessionContextValue {
  session: Session | null;
  /** True hasta que se resuelve la sesion guardada. Evita el parpadeo del login. */
  cargando: boolean;
}

const SessionContext = createContext<SessionContextValue>({ session: null, cargando: true });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    // Sesion persistida en SecureStore: si existe, el usuario entra directo.
    void supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      setSession(data.session);
      setCargando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion);
    });

    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const valor = useMemo(() => ({ session, cargando }), [session, cargando]);

  return <SessionContext.Provider value={valor}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}
