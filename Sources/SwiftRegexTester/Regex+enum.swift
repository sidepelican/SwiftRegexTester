import JavaScriptKit

@JS enum MatchingSemantics: String {
    case graphemeCluster
    case unicodeScalar
}

@JS enum RepetitionBehavior: String {
    case eager
    case possessive
    case reluctant
}

@JS enum WordBoundaryKind: String {
    case simple
    case defaultBoundaries = "default"
}

extension Regex {
     func matchingSemantics(enum enumSemanticLevel: MatchingSemantics) -> Regex<Regex<Output>.RegexOutput> {
        switch enumSemanticLevel {
        case .graphemeCluster: return self.matchingSemantics(.graphemeCluster)
        case .unicodeScalar:   return self.matchingSemantics(.unicodeScalar)
        }
     }

     func repetitionBehavior(enum enumRepetitionBehavior: RepetitionBehavior) -> Regex<Regex<Output>.RegexOutput> {
        switch enumRepetitionBehavior {
        case .eager:      return self.repetitionBehavior(.eager)
        case .possessive: return self.repetitionBehavior(.possessive)
        case .reluctant:  return self.repetitionBehavior(.reluctant)
        }
     }

     func wordBoundaryKind(enum enumWordBoundaryKind: WordBoundaryKind) -> Regex<Regex<Output>.RegexOutput> {
        switch enumWordBoundaryKind {
        case .simple:            return self.wordBoundaryKind(.simple)
        case .defaultBoundaries: return self.wordBoundaryKind(.default)
        }
     }
}
