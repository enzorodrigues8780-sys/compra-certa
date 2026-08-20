const path = require('path');
const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_URL_LENGTH = 2048;

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Aceita URLs sem protocolo e devolve uma URL HTTP/HTTPS válida.
function normalizeUrl(value) {
  if (typeof value !== 'string') return null;

  const cleanValue = value.trim();
  if (!cleanValue || cleanValue.length > MAX_URL_LENGTH) return null;

  const valueWithProtocol = /^https?:\/\//i.test(cleanValue)
    ? cleanValue
    : `https://${cleanValue}`;

  try {
    const url = new URL(valueWithProtocol);

    // Não aceitamos credenciais embutidas no endereço (usuario:senha@site.com).
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function mapThreatType(type) {
  const labels = {
    1: 'Malware',
    2: 'Phishing / Engenharia social',
    3: 'Software indesejado'
  };

  return labels[type] || 'Tipo de ameaça não especificado.';
}

// A API v5 retorna Protocol Buffers. Estas funções pequenas leem somente os
// campos necessários do SearchUrlsResponse, sem adicionar outra dependência.
function readVarint(bytes, offset) {
  let value = 0;
  let shift = 0;

  while (offset < bytes.length && shift < 53) {
    const byte = bytes[offset++];
    value += (byte & 0x7f) * (2 ** shift);
    if ((byte & 0x80) === 0) return { value, offset };
    shift += 7;
  }

  throw new Error('Protocol Buffer inválido');
}

function readLengthDelimited(bytes, offset) {
  const lengthInfo = readVarint(bytes, offset);
  const end = lengthInfo.offset + lengthInfo.value;

  if (end > bytes.length) throw new Error('Protocol Buffer inválido');
  return { value: bytes.slice(lengthInfo.offset, end), offset: end };
}

function skipField(bytes, wireType, offset) {
  if (wireType === 0) return readVarint(bytes, offset).offset;
  if (wireType === 1) return offset + 8;
  if (wireType === 2) return readLengthDelimited(bytes, offset).offset;
  if (wireType === 5) return offset + 4;
  throw new Error('Tipo de campo não suportado');
}

function parseThreatUrl(bytes) {
  const decoder = new TextDecoder();
  const threat = { url: '', threatTypes: [] };
  let offset = 0;

  while (offset < bytes.length) {
    const tag = readVarint(bytes, offset);
    offset = tag.offset;
    const fieldNumber = tag.value >> 3;
    const wireType = tag.value & 7;

    if (fieldNumber === 1 && wireType === 2) {
      const urlField = readLengthDelimited(bytes, offset);
      threat.url = decoder.decode(urlField.value);
      offset = urlField.offset;
    } else if (fieldNumber === 2 && wireType === 0) {
      const type = readVarint(bytes, offset);
      threat.threatTypes.push(type.value);
      offset = type.offset;
    } else if (fieldNumber === 2 && wireType === 2) {
      const packedTypes = readLengthDelimited(bytes, offset);
      let packedOffset = 0;
      while (packedOffset < packedTypes.value.length) {
        const type = readVarint(packedTypes.value, packedOffset);
        threat.threatTypes.push(type.value);
        packedOffset = type.offset;
      }
      offset = packedTypes.offset;
    } else {
      offset = skipField(bytes, wireType, offset);
    }
  }

  return threat;
}

function parseSearchUrlsResponse(bytes) {
  const threats = [];
  let offset = 0;

  while (offset < bytes.length) {
    const tag = readVarint(bytes, offset);
    offset = tag.offset;
    const fieldNumber = tag.value >> 3;
    const wireType = tag.value & 7;

    if (fieldNumber === 1 && wireType === 2) {
      const threatField = readLengthDelimited(bytes, offset);
      threats.push(parseThreatUrl(threatField.value));
      offset = threatField.offset;
    } else {
      offset = skipField(bytes, wireType, offset);
    }
  }

  return { threats };
}

function urlToVirusTotalId(url) {
  return Buffer.from(url).toString('base64url');
}

function translateVirusTotalCategory(category) {
  const labels = {
    malicious: 'Malicioso',
    phishing: 'Phishing',
    malware: 'Malware',
    suspicious: 'Suspeito'
  };

  return labels[String(category).toLowerCase()] || 'Detecção de segurança';
}

// Consulta o relatório já existente. Se não houver relatório, solicita uma
// análise de URL ao VirusTotal e aguarda brevemente o resultado inicial.
async function checkVirusTotal(url) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return null;

  const headers = { Accept: 'application/json', 'x-apikey': apiKey };
  const reportUrl = `https://www.virustotal.com/api/v3/urls/${urlToVirusTotalId(url)}`;

  let response = await fetch(reportUrl, { headers, signal: AbortSignal.timeout(10000) });

  if (response.status === 404) {
    const form = new URLSearchParams({ url });
    const submitted = await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(10000)
    });

    if (!submitted.ok) return { available: false };

    // O serviço pode precisar de alguns instantes para concluir a primeira análise.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    response = await fetch(reportUrl, { headers, signal: AbortSignal.timeout(10000) });
  }

  if (!response.ok) return { available: false };

  const report = await response.json();
  const attributes = report?.data?.attributes || {};
  const stats = attributes.last_analysis_stats || {};
  const results = Object.values(attributes.last_analysis_results || {});
  const categories = [...new Set(
    results
      .filter((result) => ['malicious', 'suspicious'].includes(result.category))
      .map((result) => translateVirusTotalCategory(result.result || result.category))
  )];

  return {
    available: true,
    malicious: Number(stats.malicious || 0),
    suspicious: Number(stats.suspicious || 0),
    harmless: Number(stats.harmless || 0),
    undetected: Number(stats.undetected || 0),
    categories
  };
}

app.post('/api/check-url', async (req, res) => {
  const normalizedUrl = normalizeUrl(req.body?.url);

  if (!normalizedUrl) {
    return res.status(400).json({
      error: 'Digite uma URL válida.'
    });
  }

  // O Google Safe Browsing é a opção simples, sem faturamento obrigatório.
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey || apiKey === 'sua_chave_aqui') {
    return res.status(503).json({
      status: 'UNKNOWN',
      url: normalizedUrl,
      message: 'Não foi possível determinar o risco desta URL neste momento.',
      error: 'O serviço de segurança está temporariamente indisponível.'
    });
  }

  try {
    const query = new URLSearchParams({ key: apiKey });
    query.append('urls', normalizedUrl);

    const googleResponse = await fetch(
      `https://safebrowsing.googleapis.com/v5/urls:search?${query.toString()}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'compra-certa/1.0'
        },
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!googleResponse.ok) {
      // Não repassamos detalhes da resposta do Google para o navegador.
      return res.status(503).json({
        status: 'UNKNOWN',
        url: normalizedUrl,
        message: 'Não foi possível determinar o risco desta URL neste momento.',
        error: googleResponse.status === 403
          ? 'A Web Risk precisa estar com o faturamento ativo no projeto Google Cloud.'
          : 'O serviço de segurança está temporariamente indisponível.'
      });
    }

    const responseBytes = new Uint8Array(await googleResponse.arrayBuffer());
    const data = parseSearchUrlsResponse(responseBytes);
    const threats = Array.isArray(data.threats) ? data.threats : [];
    let virusTotal = null;

    try {
      virusTotal = await checkVirusTotal(normalizedUrl);
    } catch (error) {
      // A consulta principal continua funcionando se o serviço complementar falhar.
      console.error('Falha ao consultar o VirusTotal:', error.name);
    }

    const vtDetected = virusTotal && (virusTotal.malicious > 0 || virusTotal.suspicious > 0);

    if (threats.length === 0 && !vtDetected) {
      return res.json({
        status: 'SAFE',
        url: normalizedUrl,
        message: 'Não foram encontradas ameaças conhecidas associadas a esta URL.',
        virusTotal
      });
    }

    const threatTypes = [...new Set(
      threats.flatMap((threat) => Array.isArray(threat.threatTypes) ? threat.threatTypes : [])
    )].map(mapThreatType);

    if (virusTotal?.categories?.length) {
      threatTypes.push(...virusTotal.categories);
    }

    return res.json({
      status: 'DANGER',
      url: normalizedUrl,
      message: 'Esta URL foi identificada como potencialmente perigosa.',
      threatTypes: [...new Set(threatTypes)],
      virusTotal
    });
  } catch (error) {
    // Não registramos a chave da API. O erro técnico fica somente no servidor.
    console.error('Falha ao consultar o Google Safe Browsing:', error.name);
    return res.status(503).json({
      status: 'UNKNOWN',
      url: normalizedUrl,
      message: 'Não foi possível determinar o risco desta URL neste momento.',
      error: 'Não foi possível realizar a verificação agora.'
    });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Dados inválidos enviados para o servidor.' });
  }

  next(error);
});

app.listen(PORT, () => {
  console.log(`Compra Certa disponível em http://localhost:${PORT}`);
});
