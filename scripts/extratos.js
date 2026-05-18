const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ============================================================
// PROJETO ANCORAGEM - Extrator de Palavras
// Extrai palavras de fontes públicas e monta JSON em 3 camadas
// Gerador pelo Claude Sonnet 4.6 free
// ============================================================

// --- Utilitários ---

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseBasicHtml(html, tag, className) {
  const regex = new RegExp(`<${tag}[^>]*class="[^"]*${className}[^"]*"[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const match = regex.exec(html);
  return match ? match[1].replace(/<[^>]+>/g, '').trim() : null;
}

// --- Camada 1: Índice UUID ---

function criarIndice(uuid, word) {
  return {
    uuid,
    word,
    created_at: new Date().toISOString()
  };
}

// --- Camada 2: Traduções ---

function criarTraducoes(uuidReference, traducoes) {
  return {
    uuid_reference: uuidReference,
    PT_BR: traducoes.PT_BR || '',
    EN: traducoes.EN || '',
    ES: traducoes.ES || '',
    IT: traducoes.IT || '',
    ZH: traducoes.ZH || '',
    KO: traducoes.KO || '',
    JA: traducoes.JA || '',
    urls: traducoes.urls || []
  };
}

// --- Camada 3: Fonética ---

function criarFonetica(uuidReference, fonetica) {
  return {
    uuid_reference: uuidReference,
    silabas: fonetica.silabas || '',
    fonema_informal: fonetica.fonema_informal || '',
    fonema_ipa: fonetica.fonema_ipa || '',
    definicao: fonetica.definicao || ''
  };
}

// --- Extrator Dicio.com.br ---

async function extrairDicio(palavra) {
  try {
    console.log(`[Dicio] Buscando: ${palavra}`);
    const html = await fetchUrl(`https://www.dicio.com.br/${palavra.toLowerCase()}/`);

    const silabas = (() => {
      const m = html.match(/Separação silábica:\s*<[^>]+>([^<]+)<\/[^>]+>/i);
      return m ? m[1].trim() : '';
    })();

    const definicao = (() => {
      const m = html.match(/<p class="[^"]*significado[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
      return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
    })();

    return { silabas, definicao };
  } catch (err) {
    console.error(`[Dicio] Erro: ${err.message}`);
    return { silabas: '', definicao: '' };
  }
}

// --- Extrator Blogspot ---

async function extrairBlogspot(url) {
  try {
    console.log(`[Blogspot] Buscando: ${url}`);
    const html = await fetchUrl(url);
    const palavras = [];

    // Extrai blocos de post
    const postRegex = /<div class='post-body[^']*'[^>]*>([\s\S]*?)<\/div>/gi;
    let match;
    while ((match = postRegex.exec(html)) !== null) {
      const texto = match[1].replace(/<[^>]+>/g, '').trim();
      const parsed = parsearPostPadrao(texto);
      if (parsed) palavras.push(parsed);
    }

    return palavras;
  } catch (err) {
    console.error(`[Blogspot] Erro: ${err.message}`);
    return [];
  }
}

// Parseia o formato padrão dos posts do Blogspot
// Formato esperado:
// uuid: hello_world
// word: hello
// PT_BR: olá
// EN: hello
// ES: hola
// fonema_informal: relou
function parsearPostPadrao(texto) {
  const get = (chave) => {
    const m = new RegExp(`^${chave}:\\s*(.+)$`, 'mi').exec(texto);
    return m ? m[1].trim() : null;
  };

  const uuid = get('uuid');
  const word = get('word');
  if (!uuid || !word) return null;

  return {
    uuid,
    word,
    PT_BR: get('PT_BR'),
    EN: get('EN'),
    ES: get('ES'),
    IT: get('IT'),
    ZH: get('ZH'),
    KO: get('KO'),
    JA: get('JA'),
    fonema_informal: get('fonema_informal'),
    fonema_ipa: get('fonema_ipa'),
    urls: []
  };
}

// --- Montador principal ---

async function processarPalavra(dados) {
  const { uuid, word, fonema_informal, fonema_ipa, ...rest } = dados;

  // Camada 1
  const indice = criarIndice(uuid, word);

  // Camada 2
  const traducoes = criarTraducoes(uuid, {
    PT_BR: rest.PT_BR,
    EN: rest.EN,
    ES: rest.ES,
    IT: rest.IT,
    ZH: rest.ZH,
    KO: rest.KO,
    JA: rest.JA,
    urls: rest.urls || []
  });

  // Camada 3 — busca fonética no Dicio se não tiver
  let foneticaExtra = { silabas: '', definicao: '' };
  if (rest.PT_BR) {
    foneticaExtra = await extrairDicio(rest.PT_BR);
  }

  const fonetica = criarFonetica(uuid, {
    silabas: foneticaExtra.silabas,
    fonema_informal: fonema_informal || '',
    fonema_ipa: fonema_ipa || '',
    definicao: foneticaExtra.definicao
  });

  return { indice, traducoes, fonetica };
}

async function salvarJSON(dados, arquivo) {
  const dir = path.dirname(arquivo);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(arquivo, JSON.stringify(dados, null, 2), 'utf8');
  console.log(`[Salvo] ${arquivo}`);
}

// --- Exemplo de uso manual (sem Blogspot) ---

async function exemploManual() {
  const exemplos = [
    {
      uuid: 'hello_world',
      word: 'hello',
      PT_BR: 'olá',
      EN: 'hello',
      ES: 'hola',
      IT: 'ciao',
      ZH: '你好',
      KO: '안녕하세요',
      JA: 'こんにちは',
      fonema_informal: 'relou',
      fonema_ipa: 'hɛˈloʊ'
    },
    {
      uuid: 'goodbye_world',
      word: 'goodbye',
      PT_BR: 'adeus',
      EN: 'goodbye',
      ES: 'adiós',
      IT: 'arrivederci',
      ZH: '再见',
      KO: '안녕히 가세요',
      JA: 'さようなら',
      fonema_informal: 'gud-bai',
      fonema_ipa: 'ɡʊdˈbaɪ'
    }
  ];

  const db = {
    config: { config_version: '1', type_crypto: 'ancoragem', generated_at: new Date().toISOString() },
    indices: [],
    traducoes: [],
    fonetica: []
  };

  for (const exemplo of exemplos) {
    console.log(`\nProcessando: ${exemplo.word}`);
    const resultado = await processarPalavra(exemplo);
    db.indices.push(resultado.indice);
    db.traducoes.push(resultado.traducoes);
    db.fonetica.push(resultado.fonetica);
  }

  await salvarJSON(db, './data/ancoragem_db.json');
  console.log('\n✅ Base gerada com sucesso!');
  return db;
}

// --- Servidor HTTP simples ---

async function iniciarServidor(porta = 8888) {
  // Gera a base antes de servir
  const db = await exemploManual();

  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.url === '/') {
      res.end(JSON.stringify({ status: 'Projeto Ancoragem API', endpoints: ['/db', '/indices', '/traducoes', '/fonetica'] }));
    } else if (req.url === '/db') {
      res.end(JSON.stringify(db));
    } else if (req.url === '/indices') {
      res.end(JSON.stringify(db.indices));
    } else if (req.url === '/traducoes') {
      res.end(JSON.stringify(db.traducoes));
    } else if (req.url === '/fonetica') {
      res.end(JSON.stringify(db.fonetica));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
    }
  });

  server.listen(porta, () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${porta}`);
    console.log(`📦 Endpoints disponíveis:`);
    console.log(`   http://localhost:${porta}/db`);
    console.log(`   http://localhost:${porta}/indices`);
    console.log(`   http://localhost:${porta}/traducoes`);
    console.log(`   http://localhost:${porta}/fonetica`);
  });
}

// Inicia
iniciarServidor(8888);
