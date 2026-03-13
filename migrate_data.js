const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const matriculaSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
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

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    const filePath = path.join(__dirname, 'matriculas.json');
    if (!fs.existsSync(filePath)) {
      console.log('❌ Arquivo matriculas.json não encontrado.');
      return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`⏳ Migrando ${data.length} registros...`);

    let success = 0;
    let errors = 0;

    for (const record of data) {
      try {
        await Matricula.findOneAndUpdate({ id: record.id }, record, { upsert: true });
        success++;
      } catch (err) {
        errors++;
        console.error(`❌ Erro ao migrar ID ${record.id}:`, err.message);
      }
    }

    console.log(`✅ Migração concluída: ${success} sucessos, ${errors} erros.`);
  } catch (err) {
    console.error('❌ Erro fatal:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

migrate();
