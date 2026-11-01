import { describe, it, expect } from 'vitest';
import { validateImageFile, validateSvgContent, readImageAsBase64, MAX_IMAGE_SIZE_BYTES } from '../utils/imageManager';

describe('G04-F / G06-J: Otimização, Validação e Segurança de Recursos Gráficos (CM-ALTO-008)', () => {
  it('deve aceitar formatos de imagem suportados (PNG, JPEG, WebP, SVG)', () => {
    const pngFile = new File(['fake-png-data'], 'assinatura.png', { type: 'image/png' });
    const jpegFile = new File(['fake-jpg-data'], 'fundo.jpg', { type: 'image/jpeg' });
    const webpFile = new File(['fake-webp-data'], 'selo.webp', { type: 'image/webp' });
    const svgFile = new File(['<svg></svg>'], 'logo.svg', { type: 'image/svg+xml' });

    expect(validateImageFile(pngFile).valid).toBe(true);
    expect(validateImageFile(jpegFile).valid).toBe(true);
    expect(validateImageFile(webpFile).valid).toBe(true);
    expect(validateImageFile(svgFile).valid).toBe(true);
  });

  it('deve rejeitar formatos de arquivo não suportados', () => {
    const pdfFile = new File(['fake-pdf'], 'documento.pdf', { type: 'application/pdf' });
    const exeFile = new File(['malware'], 'setup.exe', { type: 'application/x-msdownload' });
    const txtFile = new File(['hello'], 'notas.txt', { type: 'text/plain' });

    const pdfRes = validateImageFile(pdfFile);
    expect(pdfRes.valid).toBe(false);
    expect(pdfRes.error).toContain('Formato de imagem não suportado');

    expect(validateImageFile(exeFile).valid).toBe(false);
    expect(validateImageFile(txtFile).valid).toBe(false);
  });

  it('deve rejeitar imagens que excedam o limite máximo de 5 MB', () => {
    const largeBuffer = new Uint8Array(MAX_IMAGE_SIZE_BYTES + 1024);
    const hugeFile = new File([largeBuffer], 'foto_gigante.png', { type: 'image/png' });

    const res = validateImageFile(hugeFile);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('excede o limite máximo permitido de 5 MB');
  });

  it('G06-J: deve rejeitar SVGs contendo tags <script> maliciosas', () => {
    const maliciousSvg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script></svg>';
    const check = validateSvgContent(maliciousSvg);
    expect(check.valid).toBe(false);
    expect(check.error).toContain('contém scripts executáveis');
  });

  it('G06-J: deve rejeitar SVGs contendo manipuladores de evento inline (onload, onerror)', () => {
    const onloadSvg = '<svg onload="alert(1)"></svg>';
    const onerrorSvg = '<svg><image href="x" onerror="alert(1)" /></svg>';
    const jsHrefSvg = '<svg><a href="javascript:alert(1)"><text>Click</text></a></svg>';

    expect(validateSvgContent(onloadSvg).valid).toBe(false);
    expect(validateSvgContent(onerrorSvg).valid).toBe(false);
    expect(validateSvgContent(jsHrefSvg).valid).toBe(false);
  });

  it('G06-J: deve aceitar SVGs seguros com elementos vetoriais padrão', () => {
    const safeSvg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue" /><path d="M10 10 H 90 V 90 H 10 Z" /></svg>';
    const check = validateSvgContent(safeSvg);
    expect(check.valid).toBe(true);
  });
});
