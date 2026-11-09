import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

/** 운영자가 등록한 PDF의 실제 페이지 텍스트를 브라우저에서 추출한다. */
export async function extractMaterialPdf(
  file: File,
  limits: { maxBytes: number; maxPages: number },
  onProgress: (page: number, total: number) => void
) {
  if (file.size > limits.maxBytes)
    throw new Error(
      `PDF는 ${limits.maxBytes / 1024 / 1024}MB 이하로 등록해 주세요.`
    );
  const engine = await import('pdfjs-dist');

  engine.GlobalWorkerOptions.workerSrc = workerUrl;

  const task = engine.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    useSystemFonts: true,
  });

  const document = await task.promise;

  try {
    if (document.numPages > limits.maxPages)
      throw new Error(`PDF는 ${limits.maxPages}페이지 이하로 등록해 주세요.`);
    const pages: string[] = [];
    let totalCharacters = 0;

    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const content = await page.getTextContent();

      const text = content.items
        .map((item) =>
          'str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : ''
        )
        .join('')
        .trim();

      if (text.length > 50_000)
        throw new Error(
          `${number}페이지의 텍스트가 너무 많습니다. 자료를 나누어 주세요.`
        );
      totalCharacters += text.length;
      if (totalCharacters > 2_000_000)
        throw new Error('전체 텍스트는 200만 자 이하로 등록해 주세요.');
      pages.push(text);
      onProgress(number, document.numPages);
    }

    return pages;
  } finally {
    await task.destroy();
  }
}

/** PDF 원본을 문자 손상 없이 JSON 요청에 넣을 수 있게 변환한다. */
export function encodeMaterialPdf(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result.slice(reader.result.indexOf(',') + 1))
        : reject(new Error('PDF 원본을 읽지 못했습니다.'));

    reader.onerror = () => reject(new Error('PDF 원본을 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });
}
