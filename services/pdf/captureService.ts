/**
 * CertificaMaster - Serviço de Captura e Renderização de Páginas (DOM to Canvas)
 * Gate 03: Captura controlada sob demanda e liberação de recursos (CM-CRIT-004)
 */

import html2canvas from 'html2canvas';

/**
 * Aguarda o carregamento de todas as imagens presentes em um elemento HTML.
 */
export const waitForImages = (element: HTMLElement, timeoutMs = 3000): Promise<void> => {
  const imgs = Array.from(element.querySelectorAll('img'));
  if (imgs.length === 0) return Promise.resolve();

  const promises = imgs.map(img => {
    if (img.complete && img.naturalHeight !== 0) {
      return Promise.resolve();
    }
    return new Promise<void>(resolve => {
      let resolved = false;
      const onDone = () => {
        if (!resolved) {
          resolved = true;
          img.removeEventListener('load', onDone);
          img.removeEventListener('error', onDone);
          resolve();
        }
      };
      img.addEventListener('load', onDone);
      img.addEventListener('error', onDone);
      setTimeout(onDone, timeoutMs);
    });
  });

  return Promise.all(promises).then(() => undefined);
};

/**
 * Aguarda o carregamento e ativação de fontes do documento via FontFaceSet API.
 */
export const waitForFonts = async (timeoutMs = 2000): Promise<void> => {
  if (typeof document !== 'undefined' && 'fonts' in document && document.fonts?.ready) {
    try {
      const fontTimeout = new Promise(r => setTimeout(r, timeoutMs));
      await Promise.race([document.fonts.ready, fontTimeout]);
    } catch {
      // Ignora falhas de API em browsers mais antigos ou ambientes de teste
    }
  }
};

/**
 * Aguarda um ciclo completo de renderização do navegador (animationFrame + microtask).
 */
export const waitForNextFrame = (): Promise<void> => {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        setTimeout(resolve, 20);
      });
    } else {
      setTimeout(resolve, 20);
    }
  });
};

/**
 * Captura um elemento DOM especificado em escala 2x para garantir nitidez de impressão (300 DPI equivalente).
 */
export const captureElementToCanvas = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  await waitForImages(element);
  await waitForFonts();
  await waitForNextFrame();

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: 1123,
    height: 794,
  });

  return canvas;
};
