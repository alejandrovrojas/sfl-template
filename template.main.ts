enum ParseError {
	OutOfMemory         = "OutOfMemory",
	InvalidSyntax       = "InvalidSyntax",
	UnknownToken        = "UnknownToken",
	UnexpectedToken     = "UnexpectedToken",
	UnexpectedEndOfFile = "UnexpectedEndOfFile"
}

enum TokenType {
	eof            = "eof",
	comment        = "comment",
	text           = "text",
	text_css       = "text_css",
	text_js        = "text_js",
	expr_start     = "expr_start",
	expr_end       = "expr_end",
	js_start       = "js_start",
	js_end         = "js_end",
	css_start      = "css_start",
	css_end        = "css_end",
	for_start      = "for_start",
	for_end        = "for_end",
	for_in         = "for_in",
	if_start       = "if_start",
	if_end         = "if_end",
	else_start     = "else_start",
	switch_start   = "switch_start",
	switch_end     = "switch_end",
	case_start     = "case_start",
	default_start  = "default_start",
	plus           = "plus",
	minus          = "minus",
	multiplication = "multiplication",
	division       = "division",
	equal          = "equal",
	not_equal      = "not_equal",
	less_than      = "less_than",
	greater_than   = "greater_than",
	less_equal     = "less_equal",
	greater_equal  = "greater_equal",
	logical_and    = "logical_and",
	logical_or     = "logical_or",
	l_paren        = "l_paren",
	r_paren        = "r_paren",
	l_bracket      = "l_bracket",
	r_bracket      = "r_bracket",
	underscore     = "underscore",
	comma          = "comma",
	period         = "period",
	colon          = "colon",
	exclamation    = "exclamation",
	question_mark  = "question_mark",
	boolean        = "boolean",
	string         = "string",
	integer        = "integer",
	float          = "float",
	identifier     = "identifier",
	null           = "null",
	undefined      = "undefined"
}

interface TokenPosition {
	line:   number;
	column: number;
}

interface Token {
	type:     TokenType;
	position: TokenPosition;
	value:    string;
}

enum LexerMode {
	comment = "comment",
	text    = "text",
	js      = "js",
	css     = "css",
	expr    = "expr"
}

class Lexer {
	input:     string;
	cursor:    number;
	line:      number;
	column:    number;
	type:      TokenType;
	mode:      LexerMode;
	prev_mode: LexerMode;

	constructor(input: string) {
		this.input     = input;
		this.cursor    = 0;
		this.line      = 1;
		this.column    = 1;
		this.type      = TokenType.text;
		this.mode      = LexerMode.text;
		this.prev_mode = LexerMode.text;
	}

	is_whitespace(ch: string): boolean {
		return (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r');
	}

	is_keyword_boundary(ch: string): boolean {
		return this.is_whitespace(ch) || ch === '}'; // kind of flaky
	}

	is_alpha(ch: string): boolean {
		return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_'; // allow dash?
	}

	is_numeric(ch: string): boolean {
		return ch >= '0' && ch <= '9';
	}

	is_alphanumeric(ch: string): boolean {
		return this.is_alpha(ch) || this.is_numeric(ch);
	}

	current_ch(): string | null {
		if (this.cursor >= this.input.length) {
			return null;
		}

		return this.input[this.cursor];
	}

	advance_ch(): void {
		const ch = this.current_ch();

		if (ch === null) {
			return;
		}

		this.cursor += 1;

		if (ch === '\n') {
			this.line += 1;
			this.column = 1;
		} else {
			this.column += 1;
		}
	}

	tokenize_lexeme(): Token {
		while (true) {
			const ch = this.current_ch();

			if (!ch || !this.is_whitespace(ch)) {
				break;
			}

			this.advance_ch();
		}

		const start_position: TokenPosition = {
			line:   this.line,
			column: this.column,
		};

		if (this.cursor >= this.input.length) {
			return {
				type: TokenType.eof,
				value: "",
				position: start_position
			};
		}

		const start_cursor = this.cursor;

		while (this.cursor < this.input.length) {
			const ch = this.input[this.cursor];

			if (ch === '\n' || ch === '\r') {
				break;
			}

			if (ch === '/') {
				if (this.cursor + 1 <= this.input.length && this.input[this.cursor + 1] === '/') {
					this.mode = LexerMode.comment;
				}
			}

			if (this.mode === LexerMode.comment) {
				this.type = TokenType.comment;

				while (true) {
					const c = this.current_ch();

					if (!c || c === '\n' || c === '\r') {
						break;
					}

					this.advance_ch();
				}

				this.mode = LexerMode.text;
				break;
			}

			if (this.mode === LexerMode.text) {
				this.type = TokenType.text;

				if (ch === '<') {
					// <script>
					if (
						this.cursor + 8 <= this.input.length &&
						this.input[this.cursor + 1] === 's' &&
						this.input[this.cursor + 2] === 'c' &&
						this.input[this.cursor + 3] === 'r' &&
						this.input[this.cursor + 4] === 'i' &&
						this.input[this.cursor + 5] === 'p' &&
						this.input[this.cursor + 6] === 't' &&
						this.input[this.cursor + 7] === '>'
					) {
						if (this.cursor > start_cursor) {
							break;
						}

						this.type = TokenType.js_start;

						for (let i = 0; i < 8; i++) {
							this.advance_ch();
						}

						this.mode = LexerMode.js;

						break;
					}

					// <style>
					if (
						this.cursor + 7 <= this.input.length &&
						this.input[this.cursor + 1] === 's' &&
						this.input[this.cursor + 2] === 't' &&
						this.input[this.cursor + 3] === 'y' &&
						this.input[this.cursor + 4] === 'l' &&
						this.input[this.cursor + 5] === 'e' &&
						this.input[this.cursor + 6] === '>'
					) {
						if (this.cursor > start_cursor) {
							break;
						}

						this.type = TokenType.css_start;

						for (let i = 0; i < 7; i++) {
							this.advance_ch();
						}

						this.mode = LexerMode.css;

						break;
					}
				}

				if (ch === '{') {
					if (this.cursor > start_cursor) {
						break;
					}

					this.prev_mode = this.mode;
					this.mode = LexerMode.expr;

					break;
				}
			}

			if (this.mode === LexerMode.css) {
				this.type = TokenType.text_css;

				// </style>
				if (
					this.cursor + 8 <= this.input.length &&
					this.input[this.cursor + 1] === '/' &&
					this.input[this.cursor + 2] === 's' &&
					this.input[this.cursor + 3] === 't' &&
					this.input[this.cursor + 4] === 'y' &&
					this.input[this.cursor + 5] === 'l' &&
					this.input[this.cursor + 6] === 'e' &&
					this.input[this.cursor + 7] === '>'
				) {
					if (this.cursor > start_cursor) {
						break;
					}

					this.type = TokenType.css_end;

					for (let i = 0; i < 8; i++) {
						this.advance_ch();
					}

					this.mode = LexerMode.text;

					break;
				}

				// @{}
				if (ch === '@') {
					if (this.cursor + 1 <= this.input.length && this.input[this.cursor + 1] === '{') {
						if (this.cursor > start_cursor) {
							break;
						}

						this.prev_mode = this.mode;
						this.mode = LexerMode.expr;

						break;
					}
				}
			}

			if (this.mode === LexerMode.js) {
				this.type = TokenType.text_js;

				// </script>
				if (
					this.cursor + 9 <= this.input.length &&
					this.input[this.cursor + 1] === '/' &&
					this.input[this.cursor + 2] === 's' &&
					this.input[this.cursor + 3] === 'c' &&
					this.input[this.cursor + 4] === 'r' &&
					this.input[this.cursor + 5] === 'i' &&
					this.input[this.cursor + 6] === 'p' &&
					this.input[this.cursor + 7] === 't' &&
					this.input[this.cursor + 8] === '>'
				)
				{
					if (this.cursor > start_cursor) {
						break;
					}

					this.type = TokenType.js_end;

					for (let i = 0; i < 9; i++) {
						this.advance_ch();
					}

					this.mode = LexerMode.text;

					break;
				}

				// @{}
				if (ch === '@') {
					if (this.cursor + 1 <= this.input.length && this.input[this.cursor + 1] === '{') {
						if (this.cursor > start_cursor) {
							break;
						}

						this.prev_mode = this.mode;
						this.mode = LexerMode.expr;

						break;
					}
				}
			}

			if (this.mode === LexerMode.expr) {
				if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
					return this.tokenize_lexeme();
				}

				switch (ch) {
					case '@': {
						if (this.cursor + 1 <= this.input.length && this.input[this.cursor + 1] === '{') {
							this.advance_ch();
							this.advance_ch();
							this.type = TokenType.expr_start;
							return this.create_token(start_cursor, start_position);
						}

						break;
					}

					case '{': {
						this.advance_ch();
						this.type = TokenType.expr_start;
						return this.create_token(start_cursor, start_position);
					}

					case '}': {
						this.advance_ch();
						this.type = TokenType.expr_end;
						this.mode = this.prev_mode;
						return this.create_token(start_cursor, start_position);
					}

					case '+': {
						this.advance_ch();
						this.type = TokenType.plus;
						return this.create_token(start_cursor, start_position);
					}

					case '-': {
						this.advance_ch();
						this.type = TokenType.minus;
						return this.create_token(start_cursor, start_position);
					}

					case '*': {
						this.advance_ch();
						this.type = TokenType.multiplication;
						return this.create_token(start_cursor, start_position);
					}

					case '/': {
						// {/for}
						if (
							this.cursor + 4 <= this.input.length &&
							this.input[this.cursor + 1] === 'f' &&
							this.input[this.cursor + 2] === 'o' &&
							this.input[this.cursor + 3] === 'r'
						) {
							for (let i = 0; i < 4; i++) {
								this.advance_ch();
							}

							this.type = TokenType.for_end;
							return this.create_token(start_cursor, start_position);
						}

						// {/if}
						if (
							this.cursor + 3 <= this.input.length &&
							this.input[this.cursor + 1] === 'i' &&
							this.input[this.cursor + 2] === 'f'
						) {
							for (let i = 0; i < 3; i++) {
								this.advance_ch();
							}

							this.type = TokenType.if_end;
							return this.create_token(start_cursor, start_position);
						}

						// {/switch}
						if (
							this.cursor + 7 <= this.input.length &&
							this.input[this.cursor + 1] === 's' &&
							this.input[this.cursor + 2] === 'w' &&
							this.input[this.cursor + 3] === 'i' &&
							this.input[this.cursor + 4] === 't' &&
							this.input[this.cursor + 5] === 'c' &&
							this.input[this.cursor + 6] === 'h'
						) {
							for (let i = 0; i < 7; i++) {
								this.advance_ch();
							}

							this.type = TokenType.switch_end;
							return this.create_token(start_cursor, start_position);
						}

						this.advance_ch();
						this.type = TokenType.division;

						return this.create_token(start_cursor, start_position);
					}

					case '=': {
						if (this.cursor + 2 <= this.input.length && this.input[this.cursor + 1] === '=') {
							this.advance_ch();
							this.advance_ch();
							this.type = TokenType.equal;

							return this.create_token(start_cursor, start_position);
						}

						this.advance_ch();
						this.type = TokenType.equal;

						return this.create_token(start_cursor, start_position);
					}

					case '!': {
						if (this.cursor + 2 <= this.input.length && this.input[this.cursor + 1] === '=') {
							this.advance_ch();
							this.advance_ch();
							this.type = TokenType.not_equal;

							return this.create_token(start_cursor, start_position);
						}

						this.advance_ch();
						this.type = TokenType.exclamation;

						return this.create_token(start_cursor, start_position);
					}

					case '>': {
						if (this.cursor + 2 <= this.input.length && this.input[this.cursor + 1] === '=') {
							this.advance_ch();
							this.advance_ch();
							this.type = TokenType.greater_equal;

							return this.create_token(start_cursor, start_position);
						}

						this.advance_ch();
						this.type = TokenType.greater_than;

						return this.create_token(start_cursor, start_position);
					}

					case '<': {
						if (this.cursor + 2 <= this.input.length && this.input[this.cursor + 1] === '=') {
							this.advance_ch();
							this.advance_ch();
							this.type = TokenType.less_equal;

							return this.create_token(start_cursor, start_position);
						}

						this.advance_ch();
						this.type = TokenType.less_than;

						return this.create_token(start_cursor, start_position);
					}

					case '|': {
						// use "or"?
						this.advance_ch();
						this.type = TokenType.logical_or;
						return this.create_token(start_cursor, start_position);
					}

					case '&': {
						// use "and"?
						this.advance_ch();
						this.type = TokenType.logical_and;
						return this.create_token(start_cursor, start_position);
					}

					case '(': {
						this.advance_ch();
						this.type = TokenType.l_paren;
						return this.create_token(start_cursor, start_position);
					}

					case ')': {
						this.advance_ch();
						this.type = TokenType.r_paren;
						return this.create_token(start_cursor, start_position);
					}

					case '[': {
						this.advance_ch();
						this.type = TokenType.l_bracket;
						return this.create_token(start_cursor, start_position);
					}

					case ']': {
						this.advance_ch();
						this.type = TokenType.r_bracket;
						return this.create_token(start_cursor, start_position);
					}

					case '_': {
						this.advance_ch();
						this.type = TokenType.underscore;
						return this.create_token(start_cursor, start_position);
					}

					case ',': {
						this.advance_ch();
						this.type = TokenType.comma;
						return this.create_token(start_cursor, start_position);
					}

					case '.': {
						this.advance_ch();
						this.type = TokenType.period;
						return this.create_token(start_cursor, start_position);
					}

					case ':': {
						this.advance_ch();
						this.type = TokenType.colon;
						return this.create_token(start_cursor, start_position);
					}

					case '?': {
						this.advance_ch();
						this.type = TokenType.question_mark;
						return this.create_token(start_cursor, start_position);
					}

					default: {
						// undefined
						if (
							this.cursor + 10 <= this.input.length &&
							this.input[this.cursor] === 'u' &&
							this.input[this.cursor + 1] === 'n' &&
							this.input[this.cursor + 2] === 'd' &&
							this.input[this.cursor + 3] === 'e' &&
							this.input[this.cursor + 4] === 'f' &&
							this.input[this.cursor + 5] === 'i' &&
							this.input[this.cursor + 6] === 'n' &&
							this.input[this.cursor + 7] === 'e' &&
							this.input[this.cursor + 8] === 'd' &&
							this.is_keyword_boundary(this.input[this.cursor + 9])
						) {
							for (let i = 0; i < 9; i++) {
								this.advance_ch();
							}

							this.type = TokenType.undefined;
							return this.create_token(start_cursor, start_position);
						}

						// null
						if (
							this.cursor + 5 <= this.input.length &&
							this.input[this.cursor] === 'n' &&
							this.input[this.cursor + 1] === 'u' &&
							this.input[this.cursor + 2] === 'l' &&
							this.input[this.cursor + 3] === 'l' &&
							this.is_keyword_boundary(this.input[this.cursor + 4])
						) {
							for (let i = 0; i < 4; i++) {
								this.advance_ch();
							}

							this.type = TokenType.null;
							return this.create_token(start_cursor, start_position);
						}

						// true
						if (
							this.cursor + 5 <= this.input.length &&
							this.input[this.cursor] === 't' &&
							this.input[this.cursor + 1] === 'r' &&
							this.input[this.cursor + 2] === 'u' &&
							this.input[this.cursor + 3] === 'e' &&
							this.is_keyword_boundary(this.input[this.cursor + 4])
						) {
							for (let i = 0; i < 4; i++) {
								this.advance_ch();
							}

							this.type = TokenType.boolean;
							return this.create_token(start_cursor, start_position);
						}

						// false
						if (
							this.cursor + 6 <= this.input.length &&
							this.input[this.cursor] === 'f' &&
							this.input[this.cursor + 1] === 'a' &&
							this.input[this.cursor + 2] === 'l' &&
							this.input[this.cursor + 3] === 's' &&
							this.input[this.cursor + 4] === 'e' &&
							this.is_keyword_boundary(this.input[this.cursor + 5])
						) {
							for (let i = 0; i < 5; i++) {
								this.advance_ch();
							}

							this.type = TokenType.boolean;
							return this.create_token(start_cursor, start_position);
						}

						// for
						if (
							this.cursor + 4 <= this.input.length &&
							this.input[this.cursor] === 'f' &&
							this.input[this.cursor + 1] === 'o' &&
							this.input[this.cursor + 2] === 'r' &&
							this.is_keyword_boundary(this.input[this.cursor + 3])
						) {
							for (let i = 0; i < 3; i++) {
								this.advance_ch();
							}

							this.type = TokenType.for_start;
							return this.create_token(start_cursor, start_position);
						}

						// in
						if (
							this.cursor + 3 <= this.input.length &&
							this.input[this.cursor] === 'i' &&
							this.input[this.cursor + 1] === 'n' &&
							this.is_keyword_boundary(this.input[this.cursor + 2])
						) {
							for (let i = 0; i < 2; i++) {
								this.advance_ch();
							}

							this.type = TokenType.for_in;
							return this.create_token(start_cursor, start_position);
						}

						// if
						if (
							this.cursor + 3 <= this.input.length &&
							this.input[this.cursor] === 'i' &&
							this.input[this.cursor + 1] === 'f' &&
							this.is_keyword_boundary(this.input[this.cursor + 2])
						) {
							for (let i = 0; i < 2; i++) {
								this.advance_ch();
							}

							this.type = TokenType.if_start;
							return this.create_token(start_cursor, start_position);
						}

						// {else}
						if (
							this.cursor + 5 <= this.input.length &&
							this.input[this.cursor] === 'e' &&
							this.input[this.cursor + 1] === 'l' &&
							this.input[this.cursor + 2] === 's' &&
							this.input[this.cursor + 3] === 'e' &&
							this.is_keyword_boundary(this.input[this.cursor + 4])
						) {
							for (let i = 0; i < 4; i++) {
								this.advance_ch();
							}

							this.type = TokenType.else_start;
							return this.create_token(start_cursor, start_position);
						}

						// switch
						if (
							this.cursor + 7 <= this.input.length &&
							this.input[this.cursor] === 's' &&
							this.input[this.cursor + 1] === 'w' &&
							this.input[this.cursor + 2] === 'i' &&
							this.input[this.cursor + 3] === 't' &&
							this.input[this.cursor + 4] === 'c' &&
							this.input[this.cursor + 5] === 'h' &&
							this.is_keyword_boundary(this.input[this.cursor + 6])
						) {
							for (let i = 0; i < 6; i++) {
								this.advance_ch();
							}

							this.type = TokenType.switch_start;
							return this.create_token(start_cursor, start_position);
						}

						// case
						if (
							this.cursor + 5 <= this.input.length &&
							this.input[this.cursor] === 'c' &&
							this.input[this.cursor + 1] === 'a' &&
							this.input[this.cursor + 2] === 's' &&
							this.input[this.cursor + 3] === 'e' &&
							this.is_keyword_boundary(this.input[this.cursor + 4])
						) {
							for (let i = 0; i < 4; i++) {
								this.advance_ch();
							}

							this.type = TokenType.case_start;
							return this.create_token(start_cursor, start_position);
						}

						// default
						if (
							this.cursor + 8 <= this.input.length &&
							this.input[this.cursor] === 'd' &&
							this.input[this.cursor + 1] === 'e' &&
							this.input[this.cursor + 2] === 'f' &&
							this.input[this.cursor + 3] === 'a' &&
							this.input[this.cursor + 4] === 'u' &&
							this.input[this.cursor + 5] === 'l' &&
							this.input[this.cursor + 6] === 't' &&
							this.is_keyword_boundary(this.input[this.cursor + 7])
						) {
							for (let i = 0; i < 7; i++) {
								this.advance_ch();
							}

							this.type = TokenType.default_start;
							return this.create_token(start_cursor, start_position);
						}

						// identifiers
						if (this.is_alpha(ch)) {
							while (true) {
								const c = this.current_ch();
								if (!c || !this.is_alphanumeric(c)) {
									break;
								}
								this.advance_ch();
							}

							this.type = TokenType.identifier;
							return this.create_token(start_cursor, start_position);
						}

						// numbers
						if (this.is_numeric(ch)) {
							this.type = TokenType.integer;

							while (true) {
								const c = this.current_ch();
								if (!c) break;

								if (this.is_numeric(c)) {
									this.advance_ch();
								} else if (c === '.' && this.type === TokenType.integer) {
									if (this.cursor + 1 < this.input.length && this.is_numeric(this.input[this.cursor + 1])) {
										this.type = TokenType.float;
										this.advance_ch();
									} else {
										break;
									}
								} else {
									break;
								}
							}

							return this.create_token(start_cursor, start_position);
						}

						// strings
						if (ch === '\'' || ch === '"') {
							const quote = ch;

							this.advance_ch();

							while (true) {
								const c = this.current_ch();
								if (!c) break;

								if (c === quote) {
									this.advance_ch();
									break;
								}

								if (c === '\\') {
									this.advance_ch();

									if (this.cursor < this.input.length) {
										this.advance_ch();
									}
								} else {
									this.advance_ch();
								}
							}

							this.type = TokenType.string;
							return this.create_token(start_cursor, start_position);
						}

						// throw an error for invalid token?
						break;
					}
				}
			}

			this.advance_ch();
		}

		let token_value = this.input.slice(start_cursor, this.cursor);

		if (token_value.length === 0) {
			return this.tokenize_lexeme();
		}

		return this.create_token(start_cursor, start_position);
	}

	private create_token(start_cursor: number, start_position: TokenPosition): Token {
		let token_value = this.input.slice(start_cursor, this.cursor);

		if (this.type === TokenType.string) {
			token_value = this.input.slice(start_cursor + 1, this.cursor - 1);
		}

		return {
			type: this.type,
			value: token_value,
			position: start_position,
		};
	}

	tokenize(): Token[] {
		const tokens: Token[] = [];

		while (this.current_ch() !== null) {
			const token = this.tokenize_lexeme();
			tokens.push(token);
		}

		return tokens;
	}

	print_token(token: Token): void {
		console.log(`${token.position.line.toString().padStart(2)}:${token.position.column.toString().padEnd(5)} ${token.type.padEnd(15)} ${token.value}`);
	}
}

const input = `
// expression
<style>
    html {
        color: @{value};
    }
</style>

// expression
<script>
    if (true) {
        const test = @{value};
    }
</script>

// expressions
<div>{true}</div>
<div>{2 + 2}</div>
<div>{2 + 2 == 4 ? 'yes' : 'no'}</div>
<div>{item}</div>

// member access
//<div>{item.id}</div>
//<div>{item[var].id}</div>

// loop
{for item, index in items}
    <!-- ... -->
{/for}

// if block
{if condition}
    <!-- ... -->
{else if condition_2}
    <!-- ... -->
{else}
    <!-- ... -->
{/if}

// switch block
{switch var}
    {case 2 + 2}
        <!-- ... -->

    {case 'test_1', 'test_2'}
        <!-- ... -->

    {default}
        <!-- ... -->
{/switch}`;

const lexer = new Lexer(input);
const tokens = lexer.tokenize();

for (const token of tokens) {
	lexer.print_token(token);
}
