require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI não encontrada no .env');
  process.exit(1);
}

const matriculaSchema = new mongoose.Schema({}, { strict: false, versionKey: false });
const Matricula = mongoose.model('Matricula', matriculaSchema);

async function migrar() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    const dbPath = path.join(__dirname, 'matriculas.json');
    if (!fs.existsSync(dbPath)) {
        console.error('❌ Arquivo matriculas.json não encontrado na raiz do projeto');
        process.exit(1);
    }
    
    const dados = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    console.log(`Encontrados ${dados.length} registros no JSON.`);
    
    for (const item of dados) {
        const existe = await Matricula.findOne({ id: item.id });
        if (!existe) {
            await Matricula.create(item);
            console.log(`Inserido: ${item.nome}`);
        } else {
            console.log(`Pulando: ${item.nome} (já existe)`);
        }
    }
    
    console.log('🎉 Migração concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro durante a migração:', err);
  } finally {
    mongoose.disconnect();
  }
}

migrar();
