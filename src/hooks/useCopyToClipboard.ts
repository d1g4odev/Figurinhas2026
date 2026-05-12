import { useState } from 'react';

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard bloqueada (permissão negada ou contexto inseguro)
    }
  }

  return { copied, copy };
}
