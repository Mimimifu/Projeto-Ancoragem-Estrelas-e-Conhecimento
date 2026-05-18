# Projeto Ancoragem — Extrator de Palavras

Extrator Node.js que coleta palavras de fontes públicas e monta uma base de dados em 3 camadas para o método de aprendizado poliglota **Projeto Ancoragem**.

## Como funciona

### 3 Camadas de dados

**Camada 1 — Índice**
```json
{"uuid": "hello_world", "word": "hello", "created_at": "..."}
```

**Camada 2 — Traduções**
```json
{"uuid_reference": "hello_world", "PT_BR": "olá", "EN": "hello", "ES": "hola", "IT": "ciao", "ZH": "你好", "KO": "안녕하세요", "JA": "こんにちは"}
```

**Camada 3 — Fonética**
```json
{"uuid_reference": "hello_world", "silabas": "hel-lo", "fonema_informal": "relou", "fonema_ipa": "hɛˈloʊ", "definicao": "..."}
```

---

## Instalação

```bash
# Nenhuma dependência externa necessária — usa apenas módulos nativos do Node.js
node extractor.js
```

## Uso

### Servidor HTTP

```bash
node extractor.js
```

Sobe em `http://localhost:8888` com os endpoints:

| Endpoint | Descrição |
|----------|-----------|
| `/db` | Base completa |
| `/indices` | Apenas índices UUID |
| `/traducoes` | Apenas traduções |
| `/fonetica` | Apenas fonética |

---

## Formato padrão para posts no Blogspot

Para que o extrator reconheça automaticamente suas postagens, use este formato nos posts:

```
uuid: hello_world
word: hello
PT_BR: olá
EN: hello
ES: hola
IT: ciao
ZH: 你好
KO: 안녕하세요
JA: こんにちは
fonema_informal: relou
fonema_ipa: hɛˈloʊ
```

---

## Fontes suportadas

- **Blogspot** — posts padronizados do autor
- **Dicio.com.br** — separação silábica e definição em PT-BR (automático)
- Outras fontes podem ser adicionadas via módulos

---

## Sobre o Projeto Ancoragem

O método Ancoragem usa uma matriz narrativa repetida em múltiplos idiomas para reduzir a carga cognitiva no aprendizado poliglota. O cérebro aprende por contexto e reconhecimento de padrões — sem tradução consciente.

Repositório principal: [github.com/Mimimifu/Projeto-Ancoragem-Estrelas-e-Conhecimento](https://github.com/Mimimifu/Projeto-Ancoragem-Estrelas-e-Conhecimento)

---

## Licença

MIT — livre para usar, modificar e distribuir.
