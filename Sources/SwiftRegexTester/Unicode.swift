extension StringProtocol {
    var isAllInvisible: Bool {
        return self.unicodeScalars.allSatisfy { 
            $0.properties.generalCategory == .format
            || $0.properties.generalCategory == .control
            || $0.properties.generalCategory == .spaceSeparator
            || $0.properties.generalCategory == .nonspacingMark
        }
    }

    var unicodeScalarNames: [String] {
        return self.unicodeScalars.map { $0.properties.name ?? $0.codePointString }
    }
}

extension Unicode.Scalar {
    var codePointString: String {
        var hex = String(self.value, radix: 16, uppercase: true)
        if hex.count < 4 {
            hex = String(repeating: "0", count: 4 - hex.count) + hex
        }
        return "U+\(hex)"
    }
}

extension StringProtocol {
    var unicodeScalarNamesWhenInvisible: String? {
        if isAllInvisible {
            return self.unicodeScalarNames.joined(separator: ", ")
        } else {
            return nil
        }
    }
}
