export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml'
];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  sizeBytes?: number;
  type?: string;
}

/**
 * Valida o conteúdo de um arquivo SVG contra scripts e elementos executáveis perigosos (XSS via SVG).
 */
export function validateSvgContent(svgContent: string): { valid: boolean; error?: string } {
  if (!svgContent) {
    return { valid: false, error: 'Arquivo SVG vazio.' };
  }

  // Padrões de risco em SVG
  const dangerousPatterns = [
    /<script[\s>]/i,
    /<\/script>/i,
    /javascript:/i,
    /\bon\w+\s*=/i, // onload, onerror, onclick, etc.
    /<foreignobject[\s>]/i,
    /<iframe[\s>]/i,
    /<object[\s>]/i,
    /<embed[\s>]/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(svgContent)) {
      return {
        valid: false,
        error: 'Arquivo SVG rejeitado: contém scripts executáveis ou tags não autorizadas por segurança.'
      };
    }
  }

  return { valid: true };
}

/**
 * Valida tipo e tamanho de arquivos de imagem antes do processamento (CM-ALTO-008 / G06-J).
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: 'Nenhum arquivo fornecido.' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Formato de imagem não suportado (${file.type || 'desconhecido'}). Formatos aceitos: PNG, JPEG, WebP e SVG.`,
      sizeBytes: file.size,
      type: file.type
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `O arquivo selecionado (${sizeMb} MB) excede o limite máximo permitido de 5 MB.`,
      sizeBytes: file.size,
      type: file.type
    };
  }

  return {
    valid: true,
    sizeBytes: file.size,
    type: file.type
  };
}

/**
 * Converte arquivo de imagem validado para Base64 preservando canal alfa e proporções.
 * Para SVGs, realiza leitura de texto e validação estrita contra scripts maliciosos.
 */
export function readImageAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error));
      return;
    }

    // Se for SVG, valida o conteúdo do texto antes de gerar o base64
    if (file.type.toLowerCase() === 'image/svg+xml') {
      const textReader = new FileReader();
      textReader.onload = () => {
        const svgContent = typeof textReader.result === 'string' ? textReader.result : '';
        const svgCheck = validateSvgContent(svgContent);
        if (!svgCheck.valid) {
          reject(new Error(svgCheck.error));
          return;
        }

        // Se o SVG for válido, converte para Data URL segura
        const safeBase64 = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
        resolve(safeBase64);
      };
      textReader.onerror = () => reject(new Error('Erro durante a leitura do arquivo SVG.'));
      textReader.readAsText(file);
      return;
    }

    // Para PNG, JPEG, WebP
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Falha ao converter imagem para base64.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro durante a leitura do arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}
