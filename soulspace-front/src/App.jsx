import React, { useState, useEffect, createContext, useContext } from "react";

/* ─────────────────────────────────────────────────────────────
   SOULSPACE — Plataforma de bem-estar mental
   Versão conectada à API real (Node.js + Express + MySQL)

   Pré-requisitos para rodar:
   1. Banco MySQL criado com db/schema.sql + db/seed.sql
   2. Back-end rodando em http://localhost:3000 (npm start)
   3. Este front-end servido separadamente (ex.: Vite/CRA)

   Se a API_URL não responder, o app cai em modo "offline"
   usando os dados estáticos abaixo (mesma UX, sem persistência).
───────────────────────────────────────────────────────────── */

const API_URL = "http://localhost:3000/api";

// ── Fallback offline (usado se a API não responder) ─────────
const FALLBACK_MEDITATIONS = [
  { id_meditacao: 1, titulo: "Respiração para Iniciantes", duracao: "5 min", descricao: "Uma introdução suave à meditação focada na respiração", nivel: "Iniciante" },
  { id_meditacao: 2, titulo: "Relaxamento Profundo", duracao: "15 min", descricao: "Libere as tensões e encontre paz e tranquilidade", nivel: "Intermediário" },
  { id_meditacao: 3, titulo: "Mindfulness Matinal", duracao: "10 min", descricao: "Comece seu dia com clareza e foco", nivel: "Todos os níveis" },
  { id_meditacao: 4, titulo: "Sono Profundo", duracao: "20 min", descricao: "Meditação guiada para uma noite de sono reparadora", nivel: "Todos os níveis" },
  { id_meditacao: 5, titulo: "Foco no Trabalho", duracao: "8 min", descricao: "Recupere a concentração entre tarefas", nivel: "Intermediário" },
  { id_meditacao: 6, titulo: "Alívio da Ansiedade", duracao: "12 min", descricao: "Técnicas de respiração 4-7-8 para acalmar a mente", nivel: "Iniciante" },
];

const FALLBACK_WORKOUTS = [
  { id_exercicio: 1, titulo: "Hiit para correr na esteira", duracao: "30 min", categoria: "Cardio", descricao: "Acompanhe as orientações do app e regule sua esteira para seguir as instruções do SoulHiit" },
  { id_exercicio: 2, titulo: "Momento Relax", duracao: "15 min", categoria: "Yoga", descricao: "Siga as instruções do aplicativo para fazer seu treino de Yoga com base no seu condicionamento" },
  { id_exercicio: 3, titulo: "Treino de Força", duracao: "50 min", categoria: "Força", descricao: "Treino de superiores, pode ser feito na academia ou improvisado com o que você tiver em casa" },
  { id_exercicio: 4, titulo: "Alongamento Matinal", duracao: "12 min", categoria: "Alongamento", descricao: "Sequência completa para acordar o corpo com suavidade" },
];

const BLOG_POSTS = [
  { id: 1, title: "Como praticar Mindfulness no Dia a Dia", date: "21 Nov 2025", read: "5 min de leitura", excerpt: "Descubra técnicas simples para trazer mais consciência para suas atividades cotidianas." },
  { id: 2, title: "Os Benefícios da Meditação para a Saúde Mental", date: "21 Nov 2025", read: "5 min de leitura", excerpt: "Estudos comprovam os efeitos positivos da prática meditativa no nosso bem-estar psicológico." },
  { id: 3, title: "Técnicas de Respiração para Reduzir a Ansiedade", date: "21 Nov 2025", read: "5 min de leitura", excerpt: "Aprenda exercícios respiratórios que podem ser feitos em qualquer lugar para acalmar a mente." },
  { id: 4, title: "Meditação para uma Noite de Sono Reparadora", date: "21 Nov 2025", read: "5 min de leitura", excerpt: "Rotinas e práticas meditativas que podem melhorar significativamente a qualidade do seu sono." },
];

// ── Helper de requisições à API ──────────────────────────────
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("soulspace_token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  let data = null;
  try { data = await res.json(); } catch { /* sem corpo */ }

  if (!res.ok) {
    throw new Error(data?.erro || `Erro ${res.status}`);
  }
  return data;
}

// ── Contexto de autenticação ─────────────────────────────────
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);

  // Tenta restaurar sessão e checar se a API está de pé
  useEffect(() => {
    (async () => {
      try {
        await apiFetch("/health");
        setApiOnline(true);
        const token = localStorage.getItem("soulspace_token");
        if (token) {
          const me = await apiFetch("/auth/me");
          setCurrentUser(me);
        }
      } catch {
        setApiOnline(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const register = async (payload) => {
    try {
      const data = await apiFetch("/auth/cadastro", {
        method: "POST",
        body: JSON.stringify({
          Nome: payload.nome, email: payload.email, senha: payload.senha,
          cpf: payload.cpf, contato: payload.contato,
        }),
      });
      localStorage.setItem("soulspace_token", data.token);
      setCurrentUser({ ...data.usuario, progresso: { meditacoesConcluidas: [], treinosConcluidos: [], diario: [] } });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const login = async (email, senha) => {
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, senha }),
      });
      localStorage.setItem("soulspace_token", data.token);
      const me = await apiFetch("/auth/me");
      setCurrentUser(me);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem("soulspace_token");
    setCurrentUser(null);
  };

  const updateUser = async (updates) => {
    try {
      await apiFetch("/auth/me", { method: "PUT", body: JSON.stringify(updates) });
      setCurrentUser(prev => ({ ...prev, ...updates }));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const refreshProgresso = async () => {
    try {
      const me = await apiFetch("/auth/me");
      setCurrentUser(me);
    } catch { /* ignore */ }
  };

  const toggleMeditationDone = async (id) => {
    try {
      await apiFetch(`/meditacoes/${id}/toggle`, { method: "POST" });
      await refreshProgresso();
    } catch (err) { console.error(err); }
  };

  const toggleWorkoutDone = async (id) => {
    try {
      await apiFetch(`/exercicios/${id}/toggle`, { method: "POST" });
      await refreshProgresso();
    } catch (err) { console.error(err); }
  };

  const addDiaryEntry = async (text, mood) => {
    try {
      await apiFetch("/diario", { method: "POST", body: JSON.stringify({ text, mood }) });
      await refreshProgresso();
    } catch (err) { console.error(err); }
  };

  return (
    <AuthContext.Provider value={{
      currentUser, loading, apiOnline,
      register, login, logout, updateUser,
      toggleMeditationDone, toggleWorkoutDone, addDiaryEntry,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook de catálogo (meditações / exercícios) ──────────────
function useCatalog(endpoint, fallback, mapFn) {
  const [items, setItems] = useState(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch(`/${endpoint}`);
        setItems(mapFn ? data.map(mapFn) : data);
      } catch {
        setItems(fallback); // offline: usa dados estáticos
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, loading };
}

// ── Componentes de UI ──────────────────────────────────────
function Logo({ size = 28 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(109,40,217,0.35)"
      }}>
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
          <path d="M12 2C12 2 6 8 6 13a6 6 0 0012 0c0-5-6-11-6-11z" fill="white" opacity="0.9"/>
        </svg>
      </div>
      <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: size * 0.6, color: "#1E1B2E" }}>
        Soul Space
      </span>
    </div>
  );
}

function OfflineBanner() {
  return (
    <div style={{
      background: "#FEF3C7", color: "#92400E", fontSize: 13, textAlign: "center",
      padding: "8px 16px", borderBottom: "1px solid #FDE68A",
    }}>
      Modo offline — a API em <code>{API_URL}</code> não respondeu. Exibindo dados de demonstração sem persistência.
      Rode o back-end (<code>npm start</code> na pasta da API) para habilitar cadastro, login e progresso reais.
    </div>
  );
}

function Navbar({ page, setPage }) {
  const { currentUser, logout } = useAuth();
  const links = [
    { id: "home", label: "Home" },
    { id: "meditacoes", label: "Meditação" },
    { id: "treinos", label: "Exercícios" },
    { id: "blog", label: "Blog" },
    { id: "contato", label: "Contato" },
  ];
  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 32px", borderBottom: "1px solid #ECE9F8",
      background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <div onClick={() => setPage("home")} style={{ cursor: "pointer" }}>
        <Logo />
      </div>
      <div style={{ display: "flex", gap: 28 }}>
        {links.map(l => (
          <span key={l.id} onClick={() => setPage(l.id)}
            style={{
              cursor: "pointer", fontSize: 14, fontWeight: 500,
              color: page === l.id ? "#6D28D9" : "#555568",
              borderBottom: page === l.id ? "2px solid #6D28D9" : "2px solid transparent",
              paddingBottom: 4, transition: "all 0.15s",
            }}>
            {l.label}
          </span>
        ))}
      </div>
      <div>
        {currentUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span onClick={() => setPage("perfil")} style={{
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              fontSize: 14, color: "#1E1B2E", fontWeight: 500,
            }}>
              <span style={{
                width: 30, height: 30, borderRadius: "50%", background: "#EDE9FE",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#6D28D9", fontWeight: 700, fontSize: 13,
              }}>{currentUser.Nome?.[0]?.toUpperCase()}</span>
              {currentUser.Nome?.split(" ")[0]}
            </span>
            <button onClick={() => { logout(); setPage("home"); }} style={btnGhost}>Sair</button>
          </div>
        ) : (
          <button onClick={() => setPage("login")} style={btnPrimary}>Entrar</button>
        )}
      </div>
    </nav>
  );
}

const btnPrimary = {
  background: "linear-gradient(135deg, #8B5CF6, #6D28D9)", color: "#fff",
  border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 14,
  fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(109,40,217,0.25)",
};
const btnGhost = {
  background: "transparent", color: "#6D28D9", border: "1px solid #DDD6FE",
  borderRadius: 10, padding: "9px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const card = {
  background: "#fff", borderRadius: 16, padding: 24,
  border: "1px solid #ECE9F8", boxShadow: "0 2px 12px rgba(109,40,217,0.04)",
};
const pageWrap = { maxWidth: 1080, margin: "0 auto", padding: "48px 32px" };
const inputStyle = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1px solid #DDD6FE", fontSize: 14, outline: "none",
  marginBottom: 14, boxSizing: "border-box", fontFamily: "inherit",
};
const label = { fontSize: 13, fontWeight: 600, color: "#1E1B2E", display: "block", marginBottom: 6 };

// ── Páginas ─────────────────────────────────────────────────

function HomePage({ setPage }) {
  const { currentUser } = useAuth();
  return (
    <div>
      <div style={{
        background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
        padding: "80px 32px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -80, right: -80, width: 300, height: 300,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)"
        }} />
        <p style={{ color: "#8B5CF6", fontWeight: 700, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
          {currentUser ? `Bem-vindo de volta, ${currentUser.Nome?.split(" ")[0]}` : "Bem-vindo ao seu espaço de paz"}
        </p>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 48, color: "#1E1B2E", margin: "0 0 16px", lineHeight: 1.15 }}>
          Encontre sua <span style={{ color: "#8B5CF6" }}>paz interior</span>
        </h1>
        <p style={{ fontSize: 17, color: "#6B6B80", maxWidth: 540, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Um espaço digital dedicado à meditação, mindfulness e bem-estar.
          Comece sua jornada de autoconhecimento hoje.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button onClick={() => setPage("meditacoes")} style={{ ...btnPrimary, padding: "14px 28px", fontSize: 15 }}>
            Começar a meditar
          </button>
          <button onClick={() => setPage("treinos")} style={{ ...btnGhost, padding: "14px 28px", fontSize: 15, background: "#fff" }}>
            Explorar práticas
          </button>
        </div>
        <p style={{ marginTop: 48, fontStyle: "italic", color: "#8B7FA8", fontSize: 15, maxWidth: 480, margin: "48px auto 0" }}>
          "Respire. Deixe ir. E lembre-se de que este momento é o único que você tem com certeza."
          <br /><span style={{ fontSize: 13, opacity: 0.8 }}>— Oprah Winfrey</span>
        </p>
      </div>

      <div style={pageWrap}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, color: "#1E1B2E", margin: "0 0 10px" }}>
            O que oferecemos
          </h2>
          <p style={{ color: "#6B6B80", fontSize: 15 }}>
            Ferramentas e práticas para cultivar uma vida mais equilibrada e consciente
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            { icon: "🌬️", title: "Respiração Consciente", desc: "Técnicas de respiração para acalmar a mente e relaxar o corpo" },
            { icon: "🧘", title: "Mindfulness", desc: "Práticas de atenção plena para viver o momento presente" },
            { icon: "🎧", title: "Sessões guiadas", desc: "Sessões guiadas para todos os níveis de experiência" },
          ].map((f, i) => (
            <div key={i} style={card}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: "#F5F3FF",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, marginBottom: 16,
              }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E1B2E", margin: "0 0 8px" }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#6B6B80", margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthPage({ mode, setMode, setPage }) {
  const { register, login, apiOnline } = useAuth();
  const [form, setForm] = useState({ nome: "", cpf: "", email: "", senha: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!apiOnline) {
      setError("API offline. Inicie o back-end (npm start) para cadastrar ou entrar.");
      return;
    }

    setSubmitting(true);
    let res;
    if (mode === "cadastro") {
      if (!form.nome || !form.email || !form.senha || !form.cpf) {
        setError("Preencha todos os campos."); setSubmitting(false); return;
      }
      res = await register(form);
    } else {
      res = await login(form.email, form.senha);
    }
    setSubmitting(false);
    if (!res.ok) { setError(res.error); return; }
    setPage("home");
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 73px)", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)", padding: 32,
    }}>
      <div style={{ ...card, width: 380, padding: 32 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Logo size={36} />
          <p style={{ color: "#6B6B80", fontSize: 14, marginTop: 8 }}>Bem-vindo!</p>
        </div>
        <div style={{ display: "flex", borderRadius: 10, background: "#F5F3FF", padding: 4, marginBottom: 24 }}>
          {["login", "cadastro"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 14,
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#6D28D9" : "#8B7FA8",
                boxShadow: mode === m ? "0 2px 6px rgba(109,40,217,0.12)" : "none",
                transition: "all 0.15s",
              }}>
              {m === "login" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          {mode === "cadastro" && (
            <>
              <label style={label}>Nome completo</label>
              <input style={inputStyle} placeholder="Seu Nome Completo" value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })} />
              <label style={label}>CPF</label>
              <input style={inputStyle} placeholder="111.222.333-44" value={form.cpf}
                onChange={e => setForm({ ...form, cpf: e.target.value })} />
            </>
          )}
          <label style={label}>E-mail</label>
          <input style={inputStyle} type="email" placeholder="seu@email.com" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} />
          <label style={label}>Senha</label>
          <input style={inputStyle} type="password" placeholder="Sua senha" value={form.senha}
            onChange={e => setForm({ ...form, senha: e.target.value })} />

          {error && <p style={{ color: "#DC2626", fontSize: 13, marginTop: -6, marginBottom: 12 }}>{error}</p>}

          <button type="submit" disabled={submitting} style={{ ...btnPrimary, width: "100%", padding: "12px 0", fontSize: 15, marginTop: 4, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Aguarde..." : (mode === "login" ? "Entrar" : "Cadastrar")}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "#A8A0C0", textAlign: "center", marginTop: 18, lineHeight: 1.5 }}>
          Ao continuar, você concorda com nossos<br />
          <span style={{ color: "#8B5CF6", cursor: "pointer" }}>Termos de Uso</span> e{" "}
          <span style={{ color: "#8B5CF6", cursor: "pointer" }}>Política de Privacidade</span>
        </p>
      </div>
    </div>
  );
}

function MeditationsPage() {
  const { currentUser, toggleMeditationDone, apiOnline } = useAuth();
  const { items: meditations, loading } = useCatalog("meditacoes", FALLBACK_MEDITATIONS);
  const [filter, setFilter] = useState("Todos");
  const levels = ["Todos", "Iniciante", "Intermediário", "Todos os níveis"];

  const filtered = filter === "Todos" ? meditations : meditations.filter(m => m.nivel === filter);
  const done = currentUser?.progresso?.meditacoesConcluidas || [];

  if (loading) return <div style={pageWrap}><p>Carregando meditações...</p></div>;

  return (
    <div style={pageWrap}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, color: "#1E1B2E", margin: "0 0 8px" }}>
        Meditação Guiada
      </h1>
      <p style={{ color: "#6B6B80", fontSize: 15, marginBottom: 28 }}>
        Escolha uma sessão e deixe-a guiar para um estado de paz interior
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {levels.map(l => (
          <button key={l} onClick={() => setFilter(l)}
            style={{
              padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: filter === l ? "none" : "1px solid #DDD6FE",
              background: filter === l ? "#6D28D9" : "#fff",
              color: filter === l ? "#fff" : "#6D28D9",
            }}>{l}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {filtered.map(m => {
          const id = m.id_meditacao;
          const isDone = done.includes(id);
          return (
            <div key={id} style={{ ...card, display: "flex", flexDirection: "column", gap: 8, opacity: isDone ? 0.7 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E1B2E", margin: 0 }}>{m.titulo}</h3>
                <span style={{ fontSize: 12, color: "#8B5CF6", fontWeight: 700, whiteSpace: "nowrap", marginLeft: 8 }}>{m.duracao}</span>
              </div>
              <p style={{ fontSize: 13.5, color: "#6B6B80", margin: 0, lineHeight: 1.5, flex: 1 }}>{m.descricao}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "#7C3AED", background: "#F5F3FF",
                  padding: "4px 10px", borderRadius: 20,
                }}>{m.nivel}</span>
                {currentUser ? (
                  <button onClick={() => toggleMeditationDone(id)}
                    style={{
                      fontSize: 12, fontWeight: 700, border: "none", borderRadius: 8, cursor: "pointer",
                      padding: "7px 14px",
                      background: isDone ? "#DCFCE7" : "#6D28D9",
                      color: isDone ? "#16A34A" : "#fff",
                    }}>
                    {isDone ? "✓ Concluída" : "Iniciar sessão"}
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: "#A8A0C0" }}>
                    {apiOnline ? "Faça login para iniciar" : "Login indisponível offline"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkoutsPage() {
  const { currentUser, toggleWorkoutDone } = useAuth();
  const { items: workouts, loading } = useCatalog("exercicios", FALLBACK_WORKOUTS);
  const [filter, setFilter] = useState("Todos");
  const cats = ["Todos", "Cardio", "Yoga", "Força", "Alongamento"];
  const filtered = filter === "Todos" ? workouts : workouts.filter(w => w.categoria === filter);
  const done = currentUser?.progresso?.treinosConcluidos || [];

  if (loading) return <div style={pageWrap}><p>Carregando treinos...</p></div>;

  return (
    <div style={pageWrap}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, color: "#1E1B2E", margin: "0 0 8px" }}>
        Catálogo de Treinos
      </h1>
      <p style={{ color: "#6B6B80", fontSize: 15, marginBottom: 28 }}>
        Encontre o treino perfeito para seus objetivos e condicionamento
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            style={{
              padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
              border: filter === c ? "none" : "1px solid #DDD6FE",
              background: filter === c ? "#6D28D9" : "#fff",
              color: filter === c ? "#fff" : "#6D28D9",
            }}>{c}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map(w => {
          const id = w.id_exercicio;
          const isDone = done.includes(id);
          return (
            <div key={id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: isDone ? 0.7 : 1 }}>
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E1B2E", margin: 0 }}>{w.titulo}</h3>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: "#0F766E", background: "#F0FDFA",
                    padding: "3px 10px", borderRadius: 20,
                  }}>{w.categoria}</span>
                </div>
                <p style={{ fontSize: 13.5, color: "#6B6B80", margin: 0, maxWidth: 520, lineHeight: 1.5 }}>{w.descricao}</p>
              </div>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#8B5CF6" }}>{w.duracao}</span>
                {currentUser ? (
                  <button onClick={() => toggleWorkoutDone(id)}
                    style={{
                      fontSize: 12, fontWeight: 700, border: "none", borderRadius: 8, cursor: "pointer",
                      padding: "7px 14px", whiteSpace: "nowrap",
                      background: isDone ? "#DCFCE7" : "#6D28D9",
                      color: isDone ? "#16A34A" : "#fff",
                    }}>
                    {isDone ? "✓ Concluído" : "Marcar feito"}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlogPage() {
  return (
    <div style={pageWrap}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, color: "#1E1B2E", margin: "0 0 8px" }}>
        Soul Blog
      </h1>
      <p style={{ color: "#6B6B80", fontSize: 15, marginBottom: 28 }}>
        Artigos, dicas e inspirações sobre meditação e bem-estar
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
        {BLOG_POSTS.map(p => (
          <div key={p.id} style={card}>
            <div style={{
              height: 120, borderRadius: 12, marginBottom: 16,
              background: "linear-gradient(135deg, #DDD6FE, #C4B5FD)",
            }} />
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1E1B2E", margin: "0 0 8px", lineHeight: 1.3 }}>{p.title}</h3>
            <p style={{ fontSize: 13.5, color: "#6B6B80", margin: "0 0 12px", lineHeight: 1.5 }}>{p.excerpt}</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#A8A0C0" }}>{p.date} · {p.read}</span>
              <span style={{ fontSize: 13, color: "#8B5CF6", fontWeight: 700, cursor: "pointer" }}>Ler mais →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ nome: "", email: "", assunto: "", mensagem: "" });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiFetch("/contato", { method: "POST", body: JSON.stringify(form) });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      setForm({ nome: "", email: "", assunto: "", mensagem: "" });
    } catch (err) {
      setError("Não foi possível enviar agora. " + err.message);
    }
  };

  return (
    <div style={pageWrap}>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, color: "#1E1B2E", margin: "0 0 8px" }}>
        Fale Conosco
      </h1>
      <p style={{ color: "#6B6B80", fontSize: 15, marginBottom: 28, maxWidth: 600 }}>
        Estamos aqui para ajudar você em sua jornada de bem-estar. Entre em contato
        conosco e descubra como o Soul Space pode transformar sua vida.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        <div style={card}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1E1B2E", margin: "0 0 4px" }}>Envie sua mensagem</h3>
          <p style={{ fontSize: 13.5, color: "#6B6B80", margin: "0 0 20px" }}>
            Preencha o formulário e entraremos em contato em breve
          </p>
          <form onSubmit={submit}>
            <label style={label}>Nome</label>
            <input style={inputStyle} placeholder="Seu nome completo" value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })} required />
            <label style={label}>E-mail</label>
            <input style={inputStyle} type="email" placeholder="Seu e-mail" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} required />
            <label style={label}>Assunto</label>
            <select style={inputStyle} value={form.assunto}
              onChange={e => setForm({ ...form, assunto: e.target.value })}>
              <option value="">Selecione um assunto</option>
              <option>Dúvidas sobre a plataforma</option>
              <option>Sugestões</option>
              <option>Suporte técnico</option>
              <option>Parcerias</option>
            </select>
            <label style={label}>Mensagem</label>
            <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
              placeholder="Como podemos ajudar você?" value={form.mensagem}
              onChange={e => setForm({ ...form, mensagem: e.target.value })} required />
            <button type="submit" style={{ ...btnPrimary, width: "100%", padding: "12px 0", fontSize: 15 }}>
              Enviar mensagem
            </button>
            {sent && <p style={{ color: "#16A34A", fontSize: 13, marginTop: 10, textAlign: "center" }}>Mensagem enviada com sucesso! ✓</p>}
            {error && <p style={{ color: "#DC2626", fontSize: 13, marginTop: 10, textAlign: "center" }}>{error}</p>}
          </form>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { icon: "📞", title: "Telefone", text: "+55 (11) 9999-9999\nSegunda à Sexta: 9h às 18h" },
            { icon: "📍", title: "Endereço", text: "Rua da Paz, 123\nSão Paulo - SP, 01234-567" },
            { icon: "✉️", title: "E-mail", text: "contato@soulspace.com" },
          ].map((c, i) => (
            <div key={i} style={card}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{
                  fontSize: 18, width: 40, height: 40, borderRadius: 10, background: "#F5F3FF",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>{c.icon}</span>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: "#1E1B2E", margin: "0 0 4px" }}>{c.title}</h4>
                  <p style={{ fontSize: 13, color: "#6B6B80", margin: 0, whiteSpace: "pre-line", lineHeight: 1.5 }}>{c.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ setPage }) {
  const { currentUser, updateUser, logout, addDiaryEntry } = useAuth();
  const [form, setForm] = useState({
    Nome: currentUser?.Nome || "", contato: currentUser?.contato || "",
    email: currentUser?.email || "", endereco: currentUser?.endereco || "",
  });
  const [saved, setSaved] = useState(false);
  const [diaryText, setDiaryText] = useState("");
  const [mood, setMood] = useState("Calmo");

  if (!currentUser) {
    return (
      <div style={{ ...pageWrap, textAlign: "center", paddingTop: 100 }}>
        <p style={{ color: "#6B6B80", marginBottom: 16 }}>Você precisa entrar para ver seu perfil.</p>
        <button onClick={() => setPage("login")} style={btnPrimary}>Entrar</button>
      </div>
    );
  }

  const save = async (e) => {
    e.preventDefault();
    const res = await updateUser(form);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const doneM = currentUser.progresso?.meditacoesConcluidas || [];
  const doneW = currentUser.progresso?.treinosConcluidos || [];

  const submitDiary = async (e) => {
    e.preventDefault();
    if (!diaryText.trim()) return;
    await addDiaryEntry(diaryText, mood);
    setDiaryText("");
  };

  return (
    <div style={pageWrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 32, color: "#1E1B2E", margin: 0 }}>
            {currentUser.Nome}
          </h1>
          <p style={{ color: "#6B6B80", fontSize: 14, margin: "4px 0 0" }}>{currentUser.email}</p>
        </div>
        <button onClick={() => { logout(); setPage("home"); }} style={btnGhost}>Sair</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <div style={{ ...card, textAlign: "center" }}>
          <p style={{ fontSize: 32, fontWeight: 800, color: "#6D28D9", margin: 0 }}>{doneM.length}</p>
          <p style={{ fontSize: 13, color: "#6B6B80", margin: "4px 0 0" }}>Meditações concluídas</p>
        </div>
        <div style={{ ...card, textAlign: "center" }}>
          <p style={{ fontSize: 32, fontWeight: 800, color: "#0F766E", margin: 0 }}>{doneW.length}</p>
          <p style={{ fontSize: 13, color: "#6B6B80", margin: "4px 0 0" }}>Treinos concluídos</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E1B2E", margin: "0 0 16px" }}>Dados pessoais</h3>
          <form onSubmit={save}>
            <label style={label}>Nome completo</label>
            <input style={inputStyle} value={form.Nome} onChange={e => setForm({ ...form, Nome: e.target.value })} />
            <label style={label}>Telefone de contato</label>
            <input style={inputStyle} value={form.contato} onChange={e => setForm({ ...form, contato: e.target.value })} placeholder="11 22446 6880" />
            <label style={label}>E-mail</label>
            <input style={inputStyle} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <label style={label}>Endereço</label>
            <input style={inputStyle} value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} placeholder="Insira seu endereço" />
            <button type="submit" style={{ ...btnPrimary, width: "100%", padding: "11px 0" }}>Salvar alterações</button>
            {saved && <p style={{ color: "#16A34A", fontSize: 13, marginTop: 10, textAlign: "center" }}>Dados atualizados ✓</p>}
          </form>
        </div>

        <div style={card}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E1B2E", margin: "0 0 16px" }}>Meu Diário</h3>
          <form onSubmit={submitDiary} style={{ marginBottom: 14 }}>
            <label style={label}>Como você está se sentindo?</label>
            <select style={inputStyle} value={mood} onChange={e => setMood(e.target.value)}>
              <option>Feliz</option><option>Calmo</option><option>Ansioso</option>
              <option>Cansado</option><option>Motivado</option>
            </select>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
              placeholder="Escreva sobre o seu dia..." value={diaryText}
              onChange={e => setDiaryText(e.target.value)} />
            <button type="submit" style={{ ...btnGhost, width: "100%", padding: "10px 0" }}>Adicionar anotação</button>
          </form>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
            {(currentUser.progresso?.diario || []).length === 0 && (
              <p style={{ fontSize: 13, color: "#A8A0C0", textAlign: "center" }}>Nenhuma anotação ainda.</p>
            )}
            {(currentUser.progresso?.diario || []).map(d => (
              <div key={d.id} style={{ background: "#F8F7FF", borderRadius: 10, padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED" }}>{d.mood}</span>
                  <span style={{ fontSize: 11, color: "#A8A0C0" }}>{new Date(d.date).toLocaleString("pt-BR")}</span>
                </div>
                <p style={{ fontSize: 13, color: "#1E1B2E", margin: 0, lineHeight: 1.5 }}>{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #ECE9F8", padding: "32px", textAlign: "center", marginTop: 40 }}>
      <Logo size={24} />
      <p style={{ fontSize: 12, color: "#A8A0C0", marginTop: 12 }}>
        © 2026 Soul Space — Protótipo acadêmico · InovaTec 2026/1
      </p>
    </footer>
  );
}

// ── App raiz ────────────────────────────────────────────────
function AppContent() {
  const [page, setPage] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const { currentUser, loading, apiOnline } = useAuth();

  useEffect(() => {
    if ((page === "login") && currentUser) setPage("home");
  }, [currentUser, page]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#6B6B80" }}>
        Carregando...
      </div>
    );
  }

  let content;
  switch (page) {
    case "meditacoes": content = <MeditationsPage />; break;
    case "treinos": content = <WorkoutsPage />; break;
    case "blog": content = <BlogPage />; break;
    case "contato": content = <ContactPage />; break;
    case "perfil": content = <ProfilePage setPage={setPage} />; break;
    case "login": content = <AuthPage mode={authMode} setMode={setAuthMode} setPage={setPage} />; break;
    default: content = <HomePage setPage={setPage} />;
  }

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#FAFAFC", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        select { appearance: none; background: #fff; }
        input:focus, textarea:focus, select:focus { border-color: #8B5CF6 !important; }
      `}</style>
      {!apiOnline && <OfflineBanner />}
      <Navbar page={page} setPage={setPage} />
      {content}
      {page !== "login" && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
