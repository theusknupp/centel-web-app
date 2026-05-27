const fs = require('fs');

// Caminho onde o Angular espera encontrar o arquivo
const targetPath = './src/environments/environment.ts';

// Lê as variáveis de ambiente que vamos configurar no painel do Vercel
const envConfigFile = `
export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseKey: '${process.env.SUPABASE_KEY}',
  PERMISSION_REFRESH_INTERVAL_MS: 3600000
};
`;

console.log('Gerando arquivo environment.ts dinamicamente...');

// Cria a pasta environments caso ela não exista no Vercel
fs.mkdirSync('./src/environments', { recursive: true });

// Escreve o arquivo com as chaves reais
fs.writeFileSync(targetPath, envConfigFile);

console.log('Arquivo environment.ts gerado com sucesso!');