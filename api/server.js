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
    const novoId = Date.now();
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
    const id = Number(req.params.id);
    
    // findOneAndUpdate busca pelo campo "id" customizado
    const atualizado = await Matricula.findOneAndUpdate({ id }, req.body, { new: true });
    
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
    const id = Number(req.params.id);
    const excluido = await Matricula.findOneAndDelete({ id });
    
    if (!excluido) {
      return res.status(404).json({ ok: false, msg: 'Não encontrado' });
    }
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao excluir matrícula:', error);
    res.status(500).json({ ok: false, error: 'Erro interno no servidor' });
  }
});

// ── Export/Start ─────────────────────────────────────────────
if (require.main === module || process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n  🌿 Servidor rodando em: http://localhost:${PORT}\n`);
  });
}

module.exports = app;
