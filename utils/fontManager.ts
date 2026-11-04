import { CustomFontItem } from '../types';

export interface FontPresetOption {
  label: string;
  description: string;
  value: string;
  category: 'serif' | 'sans' | 'script';
  sampleText: string;
}

/**
 * Fontes clássicas, solenes e corporativas mais usadas em Títulos e Corpo de Certificados e Diplomas.
 */
export const CERTIFICATE_STANDARD_FONTS: FontPresetOption[] = [
  {
    label: 'Playfair Display (Padrão Clássico)',
    description: 'Serifada clássica elegante e solene para diplomas',
    value: "'Playfair Display', serif",
    category: 'serif',
    sampleText: 'CERTIFICADO DE CONCLUSÃO',
  },
  {
    label: 'Cinzel (Imperial Romana / Diploma)',
    description: 'Tipografia epigráfica maiúscula tradicional de universidades',
    value: "'Cinzel', serif",
    category: 'serif',
    sampleText: 'CERTIFICADO DE HONRA',
  },
  {
    label: 'Cormorant Garamond (Acadêmica Tradicional)',
    description: 'Garamond refinada de alta legibilidade em textos formais',
    value: "'Cormorant Garamond', serif",
    category: 'serif',
    sampleText: 'Certificamos que concluiu com êxito',
  },
  {
    label: 'EB Garamond (Clássica Universitária)',
    description: 'Fonte histórica clássica usada em documentos oficiais',
    value: "'EB Garamond', serif",
    category: 'serif',
    sampleText: 'Certificado Oficial de Capacitação',
  },
  {
    label: 'Libre Baskerville (Editorial Formal)',
    description: 'Serifada encorpada com excelente leitura em impressos',
    value: "'Libre Baskerville', serif",
    category: 'serif',
    sampleText: 'Certificado de Treinamento Técnico',
  },
  {
    label: 'Lora (Caligráfica Contemporânea)',
    description: 'Serifada moderna com curvas suaves e formais',
    value: "'Lora', serif",
    category: 'serif',
    sampleText: 'Certificado de Participação',
  },
  {
    label: 'Montserrat (Geométrica Corporativa)',
    description: 'Sans-serif moderna muito usada em empresas e NR/SST',
    value: "'Montserrat', sans-serif",
    category: 'sans',
    sampleText: 'CERTIFICADO CORPORATIVO',
  },
  {
    label: 'Inter (Técnica Limpa / Moderna)',
    description: 'Sans-serif neutra de altíssima nitidez para textos longos',
    value: "'Inter', sans-serif",
    category: 'sans',
    sampleText: 'Certificado Técnico Profissional',
  },
];

/**
 * Fontes caligráficas e manuscritas mais usadas no Nome de Destaque do Aluno em Certificados.
 */
export const CERTIFICATE_SCRIPT_FONTS: FontPresetOption[] = [
  {
    label: 'Alex Brush (Padrão Caligráfico Clássico)',
    description: 'Caligrafia fluida clássica com excelente legibilidade',
    value: "'Alex Brush', cursive",
    category: 'script',
    sampleText: 'Nome de Destaque do Aluno',
  },
  {
    label: 'Great Vibes (Caligrafia Imperial de Diploma)',
    description: 'A fonte manuscrita mais famosa em certificados solenes',
    value: "'Great Vibes', cursive",
    category: 'script',
    sampleText: 'Nome de Destaque do Aluno',
  },
  {
    label: 'Pinyon Script (Manuscrita Aristocrática)',
    description: 'Traço inclinado nobre estilo pena clássica',
    value: "'Pinyon Script', cursive",
    category: 'script',
    sampleText: 'Nome de Destaque do Aluno',
  },
  {
    label: 'Allura (Cursiva Limpa e Suave)',
    description: 'Caligrafia limpa, moderna e fácil de ler em qualquer tamanho',
    value: "'Allura', cursive",
    category: 'script',
    sampleText: 'Nome de Destaque do Aluno',
  },
  {
    label: 'Parisienne (Cursiva Francesa Elegante)',
    description: 'Estilo caligráfico leve inspirado em documentos históricos',
    value: "'Parisienne', cursive",
    category: 'script',
    sampleText: 'Nome de Destaque do Aluno',
  },
  {
    label: 'Dancing Script (Manuscrita Contemporânea)',
    description: 'Cursiva dinâmica e moderna para cursos livres',
    value: "'Dancing Script', cursive",
    category: 'script',
    sampleText: 'Nome de Destaque do Aluno',
  },
  {
    label: 'Tangerine (Chancelaria Renascentista)',
    description: 'Caligrafia fina e alta de estilo chancelaria italiana',
    value: "'Tangerine', cursive",
    category: 'script',
    sampleText: 'Nome de Destaque do Aluno',
  },
];

const MAX_FONT_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

export function detectFontFormat(filename: string): 'truetype' | 'opentype' | 'woff' | 'woff2' | null {
  const lower = filename.trim().toLowerCase();
  if (lower.endsWith('.ttf')) return 'truetype';
  if (lower.endsWith('.otf')) return 'opentype';
  if (lower.endsWith('.woff2')) return 'woff2';
  if (lower.endsWith('.woff')) return 'woff';
  return null;
}

export function getFontMimeType(format: 'truetype' | 'opentype' | 'woff' | 'woff2'): string {
  switch (format) {
    case 'truetype':
      return 'font/ttf';
    case 'opentype':
      return 'font/otf';
    case 'woff2':
      return 'font/woff2';
    case 'woff':
      return 'font/woff';
  }
}

/**
 * Converte um arquivo de fonte (.ttf, .otf, .woff, .woff2) enviado pelo usuário
 * em um item CustomFontItem com Data URL Base64 pronto para uso e persistência.
 */
export async function parseFontFileToCustomFont(file: File): Promise<CustomFontItem> {
  const format = detectFontFormat(file.name);
  if (!format) {
    throw new Error('Formato de fonte inválido. Envie um arquivo .TTF, .OTF, .WOFF ou .WOFF2.');
  }

  if (file.size > MAX_FONT_FILE_SIZE_BYTES) {
    throw new Error('O arquivo de fonte excede o limite máximo de 8 MB.');
  }

  const cleanBaseName = file.name
    .replace(/\.(ttf|otf|woff2?)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-zA-Z0-9À-ÿ\s]/g, '')
    .trim() || 'Fonte Personalizada';

  const uniqueId = `custom-font-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const safeFamilyName = `CertFont_${cleanBaseName.replace(/[^a-zA-Z0-9]/g, '')}_${uniqueId.slice(-4)}`;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      if (!result.startsWith('data:')) {
        reject(new Error('Falha ao ler arquivo de fonte.'));
        return;
      }
      // Garante o MIME type correto no Data URL para compatibilidade com @font-face e html2canvas
      const commaIdx = result.indexOf(',');
      const base64Part = commaIdx >= 0 ? result.slice(commaIdx + 1) : '';
      const mime = getFontMimeType(format);
      resolve(`data:${mime};base64,${base64Part}`);
    };
    reader.onerror = () => reject(new Error('Erro na leitura do arquivo de fonte.'));
    reader.readAsDataURL(file);
  });

  return {
    id: uniqueId,
    name: cleanBaseName,
    fontFamily: `'${safeFamilyName}'`,
    dataUrl,
    format,
  };
}

const CUSTOM_FONTS_STYLE_ID = 'certificamaster-custom-fonts-stylesheet';

/**
 * Injeta e sincroniza todas as fontes personalizadas enviadas pelo usuário no DOM
 * via <style>@font-face</style> e FontFace API para que tanto o Preview ao vivo
 * quanto a exportação em PDF (html2canvas) renderizem a fonte com fidelidade total.
 */
export function syncCustomFontsStylesheet(customFonts: CustomFontItem[] = []): void {
  if (typeof document === 'undefined') return;

  let styleEl = document.getElementById(CUSTOM_FONTS_STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = CUSTOM_FONTS_STYLE_ID;
    document.head.appendChild(styleEl);
  }

  if (!customFonts || customFonts.length === 0) {
    styleEl.textContent = '';
    return;
  }

  const rules = customFonts
    .map((font) => {
      const rawFamily = font.fontFamily.replace(/^['"]|['"]$/g, '');
      return `
@font-face {
  font-family: '${rawFamily}';
  src: url('${font.dataUrl}') format('${font.format}');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`;
    })
    .join('\n');

  styleEl.textContent = rules;

  // Também registra na FontFace API do navegador quando suportado para carregamento imediato
  if (typeof window !== 'undefined' && 'FontFace' in window && document.fonts) {
    customFonts.forEach((font) => {
      const rawFamily = font.fontFamily.replace(/^['"]|['"]$/g, '');
      try {
        const alreadyLoaded = Array.from(document.fonts).some(
          (f) => f.family.replace(/^['"]|['"]$/g, '') === rawFamily
        );
        if (!alreadyLoaded) {
          const face = new FontFace(rawFamily, `url(${font.dataUrl})`);
          face.load().then((loadedFace) => {
            document.fonts.add(loadedFace);
          }).catch(() => {});
        }
      } catch {
        // Fallback silencioso para o @font-face CSS já injetado
      }
    });
  }
}

