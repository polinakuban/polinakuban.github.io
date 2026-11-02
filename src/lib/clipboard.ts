type ClipboardLike = { writeText(text: string): Promise<void> };

export async function copyText(text: string, clipboard: ClipboardLike | undefined): Promise<boolean> {
  try {
    if (!clipboard) return false;
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
