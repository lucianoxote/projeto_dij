const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// O arquivo de dados ficará na raíz do projeto
const DB = path.join(process.cwd(), 'matriculas.json');

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Helpers de banco de dados ────────────────────────────────
function lerDados() {
  if (!fs.existsSync(DB)) return [];
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
  catch { return []; }
}

function salvarDados(dados) {
  // Nota: Isso funcionará localmente, mas não persistirá na Vercel (read-only)
  try {
    fs.writeFileSync(DB, JSON.stringify(dados, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar dados (esperado em produção Vercel):', err);
  }
}

// ── Rotas ────────────────────────────────────────────────────

// GET /api/matriculas — retorna todas as matrículas
app.get('/api/matriculas', (req, res) => {
  res.json(lerDados());
});

// POST /api/matriculas — salva nova matrícula
app.post('/api/matriculas', (req, res) => {
  const dados = lerDados();
  const nova = { id: Date.now(), dataMatricula: new Date().toLocaleString('pt-BR'), ...req.body };
  dados.push(nova);
  salvarDados(dados);
  res.status(201).json({ ok: true, id: nova.id });
});

// UPDATE /api/matriculas/:id — atualiza uma matrícula
app.put('/api/matriculas/:id', (req, res) => {
  const id = Number(req.params.id);
  const dados = lerDados();
  const index = dados.findIndex(r => r.id === id);
  if (index === -1) return res.status(404).json({ ok: false, msg: 'Não encontrado' });

  dados[index] = { ...dados[index], ...req.body, id }; // garante que o ID não mude
  salvarDados(dados);
  res.json({ ok: true });
});

// DELETE /api/matriculas/:id — exclui uma matrícula
app.delete('/api/matriculas/:id', (req, res) => {
  const id = Number(req.params.id);
  const dados = lerDados().filter(r => r.id !== id);
  salvarDados(dados);
  res.json({ ok: true });
});

// ── Export/Start ─────────────────────────────────────────────
if (require.main === module || process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n  🌿 Servidor rodando em: http://localhost:${PORT}\n`);
  });
}

module.exports = app;
