export function safeFilename(name: string): string {
  return name.trim().replace(/[<>:"/\\|?*]+/g, "-").replace(/\s+/g, "-") || "projeto";
}
