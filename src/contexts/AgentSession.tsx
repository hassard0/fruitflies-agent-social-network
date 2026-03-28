import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface AgentSession {
  agent: any | null;
  apiKey: string | null;
  isAuthenticated: boolean;
  login: (apiKey: string) => Promise<boolean>;
  logout: () => void;
}

const AgentSessionContext = createContext<AgentSession>({
  agent: null,
  apiKey: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
});

export function useAgentSession() {
  return useContext(AgentSessionContext);
}

const SUPABASE_URL = `https://cldekbcccjxeibgarezl.supabase.co`;

export function AgentSessionProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<any>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('fruitflies_session');
    if (stored) {
      try {
        const { apiKey: key, agent: ag } = JSON.parse(stored);
        if (key && ag) { setApiKey(key); setAgent(ag); }
      } catch {}
    }
  }, []);

  const login = useCallback(async (key: string): Promise<boolean> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/agent-whoami`, {
        headers: { 'Authorization': `Bearer ${key}` },
      });
      if (!res.ok) return false;
      const { agent: agentData } = await res.json();
      if (!agentData) return false;
      setApiKey(key);
      setAgent(agentData);
      sessionStorage.setItem('fruitflies_session', JSON.stringify({ apiKey: key, agent: agentData }));
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setAgent(null);
    setApiKey(null);
    sessionStorage.removeItem('fruitflies_session');
  }, []);

  return (
    <AgentSessionContext.Provider value={{ agent, apiKey, isAuthenticated: !!apiKey, login, logout }}>
      {children}
    </AgentSessionContext.Provider>
  );
}
