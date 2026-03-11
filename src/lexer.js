/**
 * Vibe Language Lexer
 * Tokenizes Vibe source code
 */

const TokenType = {
  // Literals
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  IDENTIFIER: 'IDENTIFIER',

  // Keywords
  FN: 'FN',
  STRUCT: 'STRUCT',
  ENUM: 'ENUM',
  IF: 'IF',
  ELSE: 'ELSE',
  MATCH: 'MATCH',
  ASYNC: 'ASYNC',
  AWAIT: 'AWAIT',
  SPAWN: 'SPAWN',
  MUT: 'MUT',
  PROTOCOL: 'PROTOCOL',
  TRAIT: 'TRAIT',
  IMPL: 'IMPL',
  USE: 'USE',
  RETURN: 'RETURN',
  BREAK: 'BREAK',
  CONTINUE: 'CONTINUE',
  FOR: 'FOR',
  WHILE: 'WHILE',
  LOOP: 'LOOP',
  PRINTLN: 'PRINTLN',
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  NIL: 'NIL',
  NONE: 'NONE',
  SOME: 'SOME',
  OPTION: 'OPTION',
  RESULT: 'RESULT',
  LET: 'LET',
  CONST: 'CONST',

  // AI-specific
  AI: 'AI',
  RAG: 'RAG',
  EMBED: 'EMBED',
  AGENT: 'AGENT',
  SWARM: 'SWARM',
  SKILL: 'SKILL',
  SECURE: 'SECURE',
  UNTIL: 'UNTIL',
  GOAL: 'GOAL',
  CALL_TOOL: 'CALL_TOOL',
  PROMPT: 'PROMPT', // %%
  VOICE: 'VOICE',   // [voice: ...]

  // Operators
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  STAR: 'STAR',
  SLASH: 'SLASH',
  PERCENT: 'PERCENT',
  EQ: 'EQ',           // ==
  NE: 'NE',           // !=
  LT: 'LT',
  LE: 'LE',           // <=
  GT: 'GT',
  GE: 'GE',           // >=
  ASSIGN: 'ASSIGN',   // =
  PIPE: 'PIPE',       // |>
  ARROW: 'ARROW',     // ->
  FAT_ARROW: 'FAT_ARROW', // =>
  AND: 'AND',         // &&
  OR: 'OR',           // ||
  NOT: 'NOT',         // !
  AMPERSAND: 'AMPERSAND', // &
  COLON: 'COLON',
  DOUBLE_COLON: 'DOUBLE_COLON', // ::
  SEMICOLON: 'SEMICOLON',
  COMMA: 'COMMA',
  DOT: 'DOT',
  QUESTION: 'QUESTION',

  // Delimiters
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',

  // Special
  EOF: 'EOF',
  NEWLINE: 'NEWLINE',
  COMMENT: 'COMMENT',
};

class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }

  toString() {
    return `Token(${this.type}, ${this.value}, ${this.line}:${this.column})`;
  }
}

class Lexer {
  constructor(source) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokenLine = 1;
    this.tokenColumn = 1;
    this.tokens = [];
  }

  current() {
    return this.source[this.pos];
  }

  peek(offset = 1) {
    return this.source[this.pos + offset];
  }

  advance() {
    if (this.current() === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.pos++;
  }

  skipWhitespace() {
    while (this.current() && /\s/.test(this.current())) {
      this.advance();
    }
  }

  readNumber() {
    const start = this.pos;
    while (this.current() && /\d/.test(this.current())) {
      this.advance();
    }
    if (this.current() === '.' && /\d/.test(this.peek())) {
      this.advance();
      while (this.current() && /\d/.test(this.current())) {
        this.advance();
      }
    }
    return this.source.substring(start, this.pos);
  }

  readString(quote) {
    this.advance(); // skip opening quote
    const chars = [];
    while (this.pos < this.source.length && this.current() !== quote) {
      if (this.current() === '\\') {
        this.advance();
        const escaped = {
          n: '\n',
          t: '\t',
          r: '\r',
          '\\': '\\',
          '"': '"',
          "'": "'",
        }[this.current()];
        chars.push(escaped || this.current());
        this.advance();
      } else {
        chars.push(this.current());
        this.advance();
      }
    }
    if (this.current() === quote) {
      this.advance(); // skip closing quote
    }
    return chars.join('');
  }

  readIdentifier() {
    const start = this.pos;
    while (this.current() && /[a-zA-Z0-9_]/.test(this.current())) {
      this.advance();
    }
    return this.source.substring(start, this.pos);
  }

  readComment() {
    const start = this.pos;
    if (this.current() === '-' && this.peek() === '-') {
      this.advance();
      this.advance();
      while (this.current() && this.current() !== '\n') {
        this.advance();
      }
      return this.source.substring(start, this.pos);
    }
  }

  readPrompt() {
    // %% ... (prompt marker)
    this.advance(); // skip %
    this.advance(); // skip %
    
    const start = this.pos;
    let endOfLine = this.pos;
    while (this.source[endOfLine] && this.source[endOfLine] !== '\n') {
      endOfLine++;
    }
    
    const lineContent = this.source.substring(this.pos, endOfLine);
    const nextPromptIdx = lineContent.indexOf('%%');
    
    if (nextPromptIdx !== -1) {
      // Prompt ends at the next %%
      const content = lineContent.substring(0, nextPromptIdx).trim();
      this.pos += nextPromptIdx + 2;
      this.column += nextPromptIdx + 2;
      return content;
    } else {
      // Prompt takes the rest of the line
      const content = lineContent.trim();
      this.pos = endOfLine;
      this.column += lineContent.length;
      return content;
    }
  }

  readVoicePrompt() {
    // [voice: "..."]
    this.advance(); // skip [
    let text = '';
    while (this.current() && this.current() !== ']') {
      text += this.current();
      this.advance();
    }
    this.advance(); // skip ]
    return text;
  }

  keywords = {
    fn: TokenType.FN,
    struct: TokenType.STRUCT,
    enum: TokenType.ENUM,
    if: TokenType.IF,
    else: TokenType.ELSE,
    match: TokenType.MATCH,
    async: TokenType.ASYNC,
    await: TokenType.AWAIT,
    spawn: TokenType.SPAWN,
    mut: TokenType.MUT,
    protocol: TokenType.PROTOCOL,
    trait: TokenType.TRAIT,
    impl: TokenType.IMPL,
    use: TokenType.USE,
    return: TokenType.RETURN,
    break: TokenType.BREAK,
    continue: TokenType.CONTINUE,
    for: TokenType.FOR,
    while: TokenType.WHILE,
    loop: TokenType.LOOP,
    println: TokenType.PRINTLN,
    true: TokenType.TRUE,
    false: TokenType.FALSE,
    nil: TokenType.NIL,
    none: TokenType.NONE,
    some: TokenType.SOME,
    let: TokenType.LET,
    const: TokenType.CONST,
    ai: TokenType.AI,
    rag: TokenType.RAG,
    embed: TokenType.EMBED,
    agent: TokenType.AGENT,
    swarm: TokenType.SWARM,
    skill: TokenType.SKILL,
    secure: TokenType.SECURE,
    until: TokenType.UNTIL,
    goal: TokenType.GOAL,
    call_tool: TokenType.CALL_TOOL,
  };

  addToken(type, value = null) {
    const token = new Token(type, value, this.tokenLine, this.tokenColumn);
    this.tokens.push(token);
  }

  tokenize() {
    while (this.pos < this.source.length) {
      this.skipWhitespace();

      if (this.pos >= this.source.length) break;

      this.tokenLine = this.line;
      this.tokenColumn = this.column;
      const char = this.current();

      // Comments
      if (char === '-' && this.peek() === '-') {
        this.readComment();
        continue;
      }

      // Prompt
      if (char === '%' && this.peek() === '%') {
        const prompt = this.readPrompt();
        this.addToken(TokenType.PROMPT, prompt);
        continue;
      }

      // Voice prompts
      if (char === '[' && this.source.substring(this.pos, this.pos + 6) === '[voice') {
        const voice = this.readVoicePrompt();
        this.addToken(TokenType.VOICE, voice);
        continue;
      }

      // Numbers
      if (/\d/.test(char)) {
        const num = this.readNumber();
        this.addToken(TokenType.NUMBER, num);
        continue;
      }

      // Strings
      if (char === '"' || char === "'") {
        const str = this.readString(char);
        this.addToken(TokenType.STRING, str);
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(char)) {
        const ident = this.readIdentifier();
        const type = this.keywords[ident] || TokenType.IDENTIFIER;
        this.addToken(type, ident);
        continue;
      }

      // Operators and delimiters
      if (char === '+') {
        this.addToken(TokenType.PLUS, '+');
        this.advance();
      } else if (char === '-') {
        if (this.peek() === '>') {
          this.addToken(TokenType.ARROW, '->');
          this.advance();
          this.advance();
        } else {
          this.addToken(TokenType.MINUS, '-');
          this.advance();
        }
      } else if (char === '*') {
        this.addToken(TokenType.STAR, '*');
        this.advance();
      } else if (char === '/') {
        this.addToken(TokenType.SLASH, '/');
        this.advance();
      } else if (char === '%') {
        this.addToken(TokenType.PERCENT, '%');
        this.advance();
      } else if (char === '=') {
        if (this.peek() === '=') {
          this.addToken(TokenType.EQ, '==');
          this.advance();
          this.advance();
        } else if (this.peek() === '>') {
          this.addToken(TokenType.FAT_ARROW, '=>');
          this.advance();
          this.advance();
        } else {
          this.addToken(TokenType.ASSIGN, '=');
          this.advance();
        }
      } else if (char === '!') {
        if (this.peek() === '=') {
          this.addToken(TokenType.NE, '!=');
          this.advance();
          this.advance();
        } else {
          this.addToken(TokenType.NOT, '!');
          this.advance();
        }
      } else if (char === '<') {
        if (this.peek() === '=') {
          this.addToken(TokenType.LE, '<=');
          this.advance();
          this.advance();
        } else {
          this.addToken(TokenType.LT, '<');
          this.advance();
        }
      } else if (char === '>') {
        if (this.peek() === '=') {
          this.addToken(TokenType.GE, '>=');
          this.advance();
          this.advance();
        } else {
          this.addToken(TokenType.GT, '>');
          this.advance();
        }
      } else if (char === '&') {
        if (this.peek() === '&') {
          this.addToken(TokenType.AND, '&&');
          this.advance();
          this.advance();
        } else {
          this.addToken(TokenType.AMPERSAND, '&');
          this.advance();
        }
      } else if (char === '|') {
        if (this.peek() === '>') {
          this.addToken(TokenType.PIPE, '|>');
          this.advance();
          this.advance();
        } else if (this.peek() === '|') {
          this.addToken(TokenType.OR, '||');
          this.advance();
          this.advance();
        } else {
          this.advance();
        }
      } else if (char === ':') {
        if (this.peek() === ':') {
          this.addToken(TokenType.DOUBLE_COLON, '::');
          this.advance();
          this.advance();
        } else {
          this.addToken(TokenType.COLON, ':');
          this.advance();
        }
      } else if (char === ';') {
        this.addToken(TokenType.SEMICOLON, ';');
        this.advance();
      } else if (char === ',') {
        this.addToken(TokenType.COMMA, ',');
        this.advance();
      } else if (char === '.') {
        this.addToken(TokenType.DOT, '.');
        this.advance();
      } else if (char === '?') {
        this.addToken(TokenType.QUESTION, '?');
        this.advance();
      } else if (char === '(') {
        this.addToken(TokenType.LPAREN, '(');
        this.advance();
      } else if (char === ')') {
        this.addToken(TokenType.RPAREN, ')');
        this.advance();
      } else if (char === '{') {
        this.addToken(TokenType.LBRACE, '{');
        this.advance();
      } else if (char === '}') {
        this.addToken(TokenType.RBRACE, '}');
        this.advance();
      } else if (char === '[') {
        this.addToken(TokenType.LBRACKET, '[');
        this.advance();
      } else if (char === ']') {
        this.addToken(TokenType.RBRACKET, ']');
        this.advance();
      } else {
        throw new Error(`Unexpected character: ${char} at ${this.line}:${this.column}`);
      }
    }

    this.addToken(TokenType.EOF, null);
    return this.tokens;
  }
}

export { Lexer, TokenType, Token };
