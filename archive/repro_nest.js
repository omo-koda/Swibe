import { Lexer, TokenType } from './src/lexer.js';

const source = `
%% prompt 1 %% 1 + 2 %% prompt 2 %%
`;

try {
  const lexer = new Lexer(source);
  const tokens = lexer.tokenize();
  console.log(JSON.stringify(tokens, null, 2));
} catch (e) {
  console.error(e);
}
