import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { API_ROOT } from '@/constants/api';

// Perfis de trabalho (specs/perfis.md): Academia, Personal e Pessoal.
export type TipoPerfil = 'academia' | 'personal' | 'pessoal';
export type Perfil = { id: number; tipo: TipoPerfil; nome: string; total_alunos: number };

export const PERFIL_ICON: Record<TipoPerfil, React.ComponentProps<typeof MaterialIcons>['name']> = {
  academia: 'storefront',
  personal: 'directions-run',
  pessoal: 'person',
};

export const PERFIL_DESCRICAO: Record<TipoPerfil, string> = {
  academia: 'Alunos e financeiro do seu studio',
  personal: 'Atendimentos em outras academias ou em casa',
  pessoal: 'Seu treino e o de amigos',
};

const CHAVE = 'studioge.perfilAtivo';

type PerfilContexto = {
  perfis: Perfil[];
  /** Perfil ativo; null enquanto carrega ou sem conexão (a API usa Academia). */
  perfil: Perfil | null;
  perfilId: number | null;
  carregando: boolean;
  erro: boolean;
  escolher: (id: number) => void;
  renomear: (id: number, nome: string) => Promise<void>;
  recarregar: () => Promise<void>;
};

const Contexto = createContext<PerfilContexto | null>(null);

async function lerGuardado(): Promise<number | null> {
  try {
    const valor = await AsyncStorage.getItem(CHAVE);
    return valor ? Number(valor) : null;
  } catch {
    return null;
  }
}

export function PerfilProvider({ children }: { children: React.ReactNode }) {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [perfilId, setPerfilId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  const recarregar = useCallback(async () => {
    try {
      const resposta = await fetch(`${API_ROOT}/perfis/`);
      if (!resposta.ok) throw new Error();
      const lista: Perfil[] = await resposta.json();
      setPerfis(lista);
      setErro(false);
      const guardado = await lerGuardado();
      setPerfilId((atual) => {
        const preferido = atual ?? guardado;
        if (preferido && lista.some((p) => p.id === preferido)) return preferido;
        return lista.find((p) => p.tipo === 'academia')?.id ?? lista[0]?.id ?? null;
      });
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void recarregar(); }, [recarregar]);

  const escolher = useCallback((id: number) => {
    setPerfilId(id);
    AsyncStorage.setItem(CHAVE, String(id)).catch(() => undefined);
  }, []);

  const renomear = useCallback(async (id: number, nome: string) => {
    const resposta = await fetch(`${API_ROOT}/perfis/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    });
    if (!resposta.ok) throw new Error('Não foi possível renomear o perfil.');
    const atualizado: Perfil = await resposta.json();
    setPerfis((atual) => atual.map((p) => (p.id === id ? { ...p, nome: atualizado.nome } : p)));
  }, []);

  const valor = useMemo<PerfilContexto>(() => ({
    perfis,
    perfil: perfis.find((p) => p.id === perfilId) ?? null,
    perfilId,
    carregando,
    erro,
    escolher,
    renomear,
    recarregar,
  }), [perfis, perfilId, carregando, erro, escolher, renomear, recarregar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePerfil() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('usePerfil precisa estar dentro de PerfilProvider');
  return contexto;
}
