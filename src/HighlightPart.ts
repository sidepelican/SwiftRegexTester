import { RegexMatch } from "../.build/plugins/PackageToJS/outputs/Package/bridge-js";

export type HighlightPart = { text: string; marked: boolean }

export function buildHighlightParts(input: string, matches: RegexMatch[]): HighlightPart[] {
  const chars = [...input]
  const parts: HighlightPart[] = []
  let pos = 0

  for (const match of matches) {
    if (match.start > pos) {
      parts.push({ text: chars.slice(pos, match.start).join(''), marked: false })
    }
    parts.push({ text: chars.slice(match.start, match.end).join(''), marked: true })
    pos = match.end
  }

  if (pos < chars.length) {
    parts.push({ text: chars.slice(pos).join(''), marked: false })
  }

  return parts
}
