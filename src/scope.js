function generateScopeId(str) {
    const hash = require('crypto')
        .createHash('md5')
        .update(str)
        .digest('hex')
        .substring(0, 6);
    return 't' + hash;
}

function scopeCSS(css, scopeId) {
    const scopeAttr = `[data-tom="${scopeId}"]`;

    const lines = css.split('\n');
    const result = [];
    let inAtRule = false;
    let inKeyframes = false;
    let atRuleBuffer = [];
    let braceCount = 0;

    for (const line of lines) {
        for (const char of line) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
        }

        const trimmed = line.trim();

        if (trimmed.startsWith('@keyframes')) {
            inKeyframes = true;
            inAtRule = true;
            atRuleBuffer.push(line);
            continue;
        }

        if (trimmed.startsWith('@media') ||
            trimmed.startsWith('@supports') ||
            trimmed.startsWith('@container') ||
            trimmed.startsWith('@font-face') ||
            trimmed.startsWith('@layer')) {
            inAtRule = true;
            atRuleBuffer.push(line);
            continue;
        }

        if (inAtRule) {
            if (inKeyframes) {
                atRuleBuffer.push(line);
            } else if (line.includes('{') && !trimmed.startsWith('@')) {
                const scopedLine = line.replace(
                    /([^{]+)(\{)/,
                    (match, selector, brace) => {
                        const scopedSel = selector
                            .split(',')
                            .map(s => s.trim() ? `${scopeAttr} ${s.trim()}` : s)
                            .join(', ');
                        return scopedSel + brace;
                    }
                );
                atRuleBuffer.push(scopedLine);
            } else {
                atRuleBuffer.push(line);
            }

            if (braceCount === 0 && atRuleBuffer.length > 0) {
                result.push(...atRuleBuffer);
                atRuleBuffer = [];
                inAtRule = false;
                inKeyframes = false;
            }
            continue;
        }

        if (line.includes('{') && !trimmed.startsWith('@')) {
            const scopedLine = line.replace(
                /([^{]+)(\{)/,
                (match, selector, brace) => {
                    const scopedSel = selector
                        .split(',')
                        .map(s => {
                            s = s.trim();
                            if (!s) return s;
                            if (s.startsWith(':')) {
                                return `${scopeAttr}${s}`;
                            }
                            return `${scopeAttr} ${s}`;
                        })
                        .join(', ');
                    return scopedSel + brace;
                }
            );
            result.push(scopedLine);
        } else {
            result.push(line);
        }
    }

    return result.join('\n');
}

module.exports = { generateScopeId, scopeCSS };
