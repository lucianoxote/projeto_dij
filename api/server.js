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
  console.error('\n❌ CRÍTICO: MONGODB_URI não está definida! O banco de dados não funcionará.');
  console.error('Certifique-se de configurar a variável de ambiente no Vercel ou no arquivo .env local.\n');
} else {
  console.log('⏳ Tentando conectar ao MongoDB...');
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Conectado ao MongoDB com sucesso!'))
    .catch(err => {
      console.error('❌ ERRO AO CONECTAR AO MONGO:', err.message);
      console.error('Dica: Verifique se o seu IP está liberado no MongoDB Atlas (Network Access).');
    });
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
  type: { type: String, default: 'image' }, // 'image' ou 'video'
  id: { type: Number, required: true, unique: true }
}, { versionKey: false });

const Galeria = mongoose.model('Galeria', galeriaSchema);

const frequenciaSchema = new mongoose.Schema({
  matriculaId: Number,
  data: String, // YYYY-MM-DD
  presenca: Boolean,
  id: { type: Number, required: true, unique: true }
}, { versionKey: false });

const Frequencia = mongoose.model('Frequencia', frequenciaSchema);

const acompanhamentoSchema = new mongoose.Schema({
  matriculaId: Number,
  data: String,
  notaDesempenho: String,
  metas: String,
  atividades: String,
  observacoes: String,
  id: { type: Number, required: true, unique: true }
}, { versionKey: false });

const Acompanhamento = mongoose.model('Acompanhamento', acompanhamentoSchema);



// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
    console.error('❌ ERRO AO BUSCAR FINANCEIRO:', error);
    res.status(500).json({ ok: false, error: 'Erro interno no servidor: ' + error.message });
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

// ── Rotas Frequência ─────────────────────────────────────────


app.get('/api/frequencia', async (req, res) => {
  try {
    const { data } = req.query;
    const query = data ? { data } : {};
    const dados = await Frequencia.find(query);
    res.json(dados);
  } catch (error) {
    res.status(500).json({ ok: false });
  }
});

app.get('/api/frequencia/datas', async (req, res) => {
  try {
    const datas = await Frequencia.distinct('data');
    res.json(datas.sort().reverse());
  } catch (error) {
    res.status(500).json({ ok: false });
  }
});


/**
 * POST /api/frequencia
 * Salva presença de vários alunos para uma data específica.
 */
app.post('/api/frequencia', async (req, res) => {
  try {
    const { data, presencas } = req.body;
    if (!data || !Array.isArray(presencas)) {
      return res.status(400).json({ ok: false, error: 'Dados inválidos' });
    }

    const updates = presencas.map(p => ({
      updateOne: {
        filter: { matriculaId: p.matriculaId, data },
        update: { $set: { matriculaId: p.matriculaId, data, presenca: p.presenca, id: Date.now() + Math.random() } },
        upsert: true
      }
    }));

    await Frequencia.bulkWrite(updates);
    res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Erro ao salvar frequência:', error);
    res.status(500).json({ ok: false });
  }
});

app.delete('/api/frequencia/dia/:data', async (req, res) => {
  try {
    await Frequencia.deleteMany({ data: req.params.data });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false });
  }
});

app.delete('/api/frequencia/:id', async (req, res) => {
  try {
    await Frequencia.findOneAndDelete({ id: Number(req.params.id) });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false });
  }
});

// ── Rotas Acompanhamento ──────────────────────────────────────

app.get('/api/acompanhamento', async (req, res) => {
  try {
    const { matriculaId } = req.query;
    const query = matriculaId ? { matriculaId: Number(matriculaId) } : {};
    const dados = await Acompanhamento.find(query).sort({ id: -1 });
    res.json(dados);
  } catch (error) {
    console.error('Erro em GET /api/acompanhamento:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/acompanhamento', async (req, res) => {
  try {
    console.log('Salvando acompanhamento:', req.body);
    const data = { ...req.body, id: req.body.id || Date.now() + Math.random() };
    const query = { matriculaId: Number(data.matriculaId) };
    
    // Pequeno ajuste para garantir que matriculaId seja número no banco também
    data.matriculaId = Number(data.matriculaId);

    const atualizado = await Acompanhamento.findOneAndUpdate(query, data, { upsert: true, new: true });
    res.status(201).json({ ok: true, dados: atualizado });
  } catch (error) {
    console.error('Erro em POST /api/acompanhamento:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.delete('/api/acompanhamento/:matriculaId', async (req, res) => {
  try {
    const matriculaId = Number(req.params.matriculaId);
    const excluido = await Acompanhamento.findOneAndDelete({ matriculaId });
    if (!excluido) return res.status(404).json({ ok: false, msg: 'Registro não encontrado' });
    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao excluir acompanhamento:', error);
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
