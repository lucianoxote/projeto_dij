/**
 * Servidor DIJ – Matrículas 2026
 * Execução: node server.js
 * Acesse: http://localhost:3000
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB = path.join(__dirname, 'matriculas.json');

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve os arquivos estáticos (html, css, etc.)

// ── Helpers de banco de dados ────────────────────────────────
function lerDados() {
  if (!fs.existsSync(DB)) return [];
  try { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
  catch { return []; }
}

function salvarDados(dados) {
  fs.writeFileSync(DB, JSON.stringify(dados, null, 2), 'utf8');
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

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  🌿 DIJ – Sistema de Matrículas 2026');
  console.log('  ─────────────────────────────────────────');
  console.log(`  Servidor rodando em: http://localhost:${PORT}`);
  console.log('  Pressione Ctrl+C para encerrar.');
  console.log('');
});
