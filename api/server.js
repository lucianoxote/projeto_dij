const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

// Carrega variáveis ambiente apenas no desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
const PORT = process.env.PORT || 3000;

// ── Conexão MongoDB ─────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('Aviso: MONGODB_URI não definida no ambiente. O servidor pode falhar ao conectar ao banco.');
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Conectado ao MongoDB'))
    .catch(err => console.error('❌ Erro de conexão com MongoDB:', err));
}

// ── Schema e Modelo Mongoose ─────────────────────────────────
// Usamos { strict: false } para aceitar campos dinâmicos que possam vir do formulário
const matriculaSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, // Preservando o ID customizado baseado em Date.now()
  dataMatricula: String,
  nome: String,
  responsavel: String,
  dataNasc: String,
  faixa: String,
  endereco: String,
  celResp: String,
  celCrianca: String,
  email: String,
  podeComer: String,
  naoPodeComer: String,
  diagnostico: String,
  alergia: String,
  confirmacao: String,
  imagens: String
}, { strict: false, versionKey: false });

const Matricula = mongoose.model('Matricula', matriculaSchema);

const financeiroSchema = new mongoose.Schema({
  data: String,
  descricao: String,
  valor: Number,
  tipo: { type: String, enum: ['entrada', 'saida'] },
  categoria: String, // Doação, Vaquinha, Rifa, etc.
  id: { type: Number, required: true, unique: true }
}, { versionKey: false });

const Financeiro = mongoose.model('Financeiro', financeiroSchema);

const recadoSchema = new mongoose.Schema({
  data: String,
  texto: String,
  id: { type: Number, required: true, unique: true }
}, { versionKey: false });

const Recado = mongoose.model('Recado', recadoSchema);

const galeriaSchema = new mongoose.Schema({
  url: String,
  legenda: String,
  id: { type: Number, required: true, unique: true }
}, { versionKey: false });

const Galeria = mongoose.model('Galeria', galeriaSchema);

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve arquivos estáticos da pasta 'public'
// No Vercel, process.cwd() aponta para a raíz do projeto
app.use(express.static(path.join(process.cwd(), 'public')));

// Rota para a página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// ── Rotas ────────────────────────────────────────────────────

// GET /api/matriculas — retorna todas as matrículas
app.get('/api/matriculas', async (req, res) => {
  try {
    // Busca todas as matrículas e ordena pelo ID (data de criação) de forma ascendente
    const dados = await Matricula.find({}).sort({ id: 1 });
    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar matrículas:', error);
    res.status(500).json({ ok: false, error: 'Erro interno no servidor' });
  }
});

// POST /api/matriculas — salva nova matrícula
app.post('/api/matriculas', async (req, res) => {
  try {
    // Cria o documento com um ID baseado em timestamp + aleatório para evitar colisões em loops rápidos
    const novoId = Date.now() + Math.floor(Math.random() * 1000);
    const dataMatriculaFormatada = new Date().toLocaleString('pt-BR');

    // Cria o documento
    const novaMatricula = new Matricula({
      id: novoId,
      dataMatricula: dataMatriculaFormatada,
      ...req.body
    });

    await novaMatricula.save();
    res.status(201).json({ ok: true, id: novoId });
  } catch (error) {
    console.error('Erro ao salvar matrícula:', error);
    res.status(500).json({ ok: false, error: 'Erro ao salvar matrícula' });
  }
});

// UPDATE /api/matriculas/:id — atualiza uma matrícula
app.put('/api/matriculas/:id', async (req, res) => {
  try {
    // Tenta buscar pelo _id do MongoDB (hexadecimal) ou pelo id customizado (número)
    const query = mongoose.Types.ObjectId.isValid(req.params.id) 
      ? { _id: req.params.id } 
      : { id: Number(req.params.id) };

    const atualizado = await Matricula.findOneAndUpdate(query, req.body, { new: true });

    if (!atualizado) {
      return res.status(404).json({ ok: false, msg: 'Não encontrado' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao atualizar matrícula:', error);
    res.status(500).json({ ok: false, error: 'Erro interno no servidor' });
  }
});

// DELETE /api/matriculas/:id — exclui uma matrícula
app.delete('/api/matriculas/:id', async (req, res) => {
  try {
    // Tenta excluir pelo _id do MongoDB ou pelo id customizado
    const query = mongoose.Types.ObjectId.isValid(req.params.id) 
      ? { _id: req.params.id } 
      : { id: Number(req.params.id) };

    const excluido = await Matricula.findOneAndDelete(query);

    if (!excluido) {
      return res.status(404).json({ ok: false, msg: 'Não encontrado' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao excluir matrícula:', error);
    res.status(500).json({ ok: false, error: 'Erro interno no servidor' });
  }
});

// ── Rotas Financeiro ──────────────────────────────────────────

// GET /api/financeiro
app.get('/api/financeiro', async (req, res) => {
  try {
    const dados = await Financeiro.find({}).sort({ id: -1 });
    res.json(dados);
  } catch (error) {
    console.error('Erro ao buscar financeiro:', error);
    res.status(500).json({ ok: false, error: 'Erro interno no servidor' });
  }
});

// POST /api/financeiro
app.post('/api/financeiro', async (req, res) => {
  try {
    const novoId = Date.now();
    const novaEntrada = new Financeiro({
      id: novoId,
      ...req.body
    });
    await novaEntrada.save();
    res.status(201).json({ ok: true, id: novoId });
  } catch (error) {
    console.error('Erro ao salvar financeiro:', error);
    res.status(500).json({ ok: false, error: 'Erro ao salvar registro financeiro' });
  }
});

// DELETE /api/financeiro/:id
app.delete('/api/financeiro/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const excluido = await Financeiro.findOneAndDelete({ id });
    if (!excluido) return res.status(404).json({ ok: false, msg: 'Não encontrado' });
    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao excluir financeiro:', error);
    res.status(500).json({ ok: false, error: 'Erro interno no servidor' });
  }
});

// UPDATE /api/financeiro/:id
app.put('/api/financeiro/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const atualizado = await Financeiro.findOneAndUpdate({ id }, req.body, { new: true });
    if (!atualizado) return res.status(404).json({ ok: false, msg: 'Não encontrado' });
    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao atualizar financeiro:', error);
    res.status(500).json({ ok: false, error: 'Erro interno no servidor' });
  }
});

// ── Rotas Recados ─────────────────────────────────────────────

app.get('/api/recados', async (req, res) => {
  try {
    const dados = await Recado.find({}).sort({ id: -1 });
    res.json(dados);
  } catch (error) {
    res.status(500).json({ ok: false });
  }
});

app.post('/api/recados', async (req, res) => {
  try {
    const novo = new Recado({ id: Date.now() + Math.random(), ...req.body });
    await novo.save();
    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false });
  }
});

app.delete('/api/recados/:id', async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { _id: req.params.id } : { id: Number(req.params.id) };
    await Recado.findOneAndDelete(query);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false });
  }
});

// ── Rotas Galeria ─────────────────────────────────────────────

app.get('/api/galeria', async (req, res) => {
  try {
    const dados = await Galeria.find({}).sort({ id: -1 });
    res.json(dados);
  } catch (error) {
    res.status(500).json({ ok: false });
  }
});

app.post('/api/galeria', async (req, res) => {
  try {
    const novo = new Galeria({ id: Date.now() + Math.random(), ...req.body });
    await novo.save();
    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false });
  }
});

app.delete('/api/galeria/:id', async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { _id: req.params.id } : { id: Number(req.params.id) };
    await Galeria.findOneAndDelete(query);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false });
  }
});

// ── Export/Start ─────────────────────────────────────────────
if (require.main === module || process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n  🌿 Servidor rodando em: http://localhost:${PORT}\n`);
  });
}

module.exports = app;
