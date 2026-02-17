enum ParseError {
	InvalidSyntax          = "InvalidSyntax",
	UnknownToken           = "UnknownToken",
	UnexpectedToken        = "UnexpectedToken",
	UnexpectedEndOfFile    = "UnexpectedEndOfFile"
}

enum TokenType {
	eof                    = "eof",
	comment                = "comment",
	text                   = "text",
	text_css               = "text_css",
	text_js                = "text_js",
	expr_start             = "expr_start",
	expr_end               = "expr_end",
	js_start               = "js_start",
	js_end                 = "js_end",
	css_start              = "css_start",
	css_end                = "css_end",
	for_start              = "for_start",
	for_end                = "for_end",
	for_in                 = "for_in",
	if_start               = "if_start",
	if_end                 = "if_end",
	else_start             = "else_start",
	switch_start           = "switch_start",
	switch_end             = "switch_end",
	case_start             = "case_start",
	default_start          = "default_start",
	import_start           = "import_start",
	plus                   = "plus",
	minus                  = "minus",
	multiplication         = "multiplication",
	division               = "division",
	equal                  = "equal",
	not_equal              = "not_equal",
	less_than              = "less_than",
	greater_than           = "greater_than",
	less_equal             = "less_equal",
	greater_equal          = "greater_equal",
	logical_and            = "logical_and",
	logical_or             = "logical_or",
	l_paren                = "l_paren",
	r_paren                = "r_paren",
	l_bracket              = "l_bracket",
	r_bracket              = "r_bracket",
	underscore             = "underscore",
	comma                  = "comma",
	period                 = "period",
	colon                  = "colon",
	exclamation            = "exclamation",
	question_mark          = "question_mark",
	boolean                = "boolean",
	string                 = "string",
	integer                = "integer",
	float                  = "float",
	identifier             = "identifier",
	null                   = "null",
	undefined              = "undefined"
}

enum NodeType {
	program                = "program",
	text                   = "text",
	comment                = "comment",
	block_if               = "block_if",
	block_switch           = "block_switch",
	block_case             = "block_case",
	block_default          = "block_default",
	block_for              = "block_for",
	import                 = "import",
	literal_null           = "literal_null",
	literal_int            = "literal_int",
	literal_float          = "literal_float",
	literal_string         = "literal_string",
	literal_boolean        = "literal_boolean",
	expression             = "expression",
	expression_conditional = "expression_conditional",
	expression_binary      = "expression_binary",
	expression_unary       = "expression_unary",
	expression_member      = "expression_member",
	identifier             = "identifier",
	function_call          = "function_call",
	argument_list          = "argument_list",
}

enum LexerMode {
	comment                = "comment",
	text                   = "text",
	js                     = "js",
	css                    = "css",
	expr                   = "expr"
}

type Node =
	| Template
	| PlainText
	| TextComment
	| If
	| Switch
	| Case
	| Default
	| For
	| Import
	| LiteralNull
	| LiteralInt
	| LiteralFloat
	| LiteralString
	| LiteralBoolean
	| Expression
	| ExpressionConditional
	| ExpressionBinary
	| ExpressionUnary
	| ExpressionMember
	| Identifier
	| FunctionCall
	| ArgumentList;

type Token = {
	type:       TokenType;
	position:   TokenPosition;
	value:      string;
}

type TokenPosition = {
	line:       number;
	column:     number;
}

type BaseNode = {
	type:       NodeType;
}

type Template = BaseNode & {
	type:       NodeType.program;
	body:       Node[];
}

type TextComment = BaseNode & {
	type:       NodeType.comment;
	value:      string;
}

type PlainText = BaseNode & {
	type:       NodeType.text;
	value:      string;
}

type FunctionCall = BaseNode & {
	type:       NodeType.function_call;
	identifier: Node;
	args:       Node;
}

type ArgumentList = BaseNode & {
	type:       NodeType.argument_list;
	args:       Node[];
}

type If = BaseNode & {
	type:       NodeType.block_if;
	condition:  Node;
	consequent: Node[];
	alternate:  Node | null;
}

type Switch = BaseNode & {
	type:       NodeType.block_switch;
	test:       Node;
	cases:      Node[];
}

type Case = BaseNode & {
	type:       NodeType.block_case;
	values:     Node;
	body:       Node[];
}

type Default = BaseNode & {
	type:       NodeType.block_default;
	body:       Node[];
}

type For = BaseNode & {
	type:       NodeType.block_for;
	iterator:   string;
	index:      string | null;
	iterable:   Node;
	body:       Node[];
}

type Import = BaseNode & {
	type:       NodeType.import;
	value:      string;
}

type Expression = BaseNode & {
	type:       NodeType.expression;
	value:      Node;
}

type ExpressionConditional = BaseNode & {
	type:       NodeType.expression_conditional;
	condition:  Node;
	consequent: Node;
	alternate:  Node;
}

type ExpressionBinary = BaseNode & {
	type:       NodeType.expression_binary;
	left:       Node;
	operator:   TokenType;
	right:      Node;
}

type ExpressionUnary = BaseNode & {
	type:       NodeType.expression_unary;
	operator:   TokenType;
	operand:    Node;
}

type ExpressionMember = BaseNode & {
	type:       NodeType.expression_member,
	object:     Node;
	property:   Node;
}

type Identifier = BaseNode & {
	type:       NodeType.identifier;
	name:       string;
}

type LiteralInt = BaseNode & {
	type:       NodeType.literal_int;
	value:      number;
}

type LiteralFloat = BaseNode & {
	type:       NodeType.literal_float;
	value:      number;
}

type LiteralString = BaseNode & {
	type:       NodeType.literal_string;
	value:      string;
}

type LiteralBoolean = BaseNode & {
	type:       NodeType.literal_boolean;
	value:      boolean;
}

type LiteralNull = BaseNode & {
	type:       NodeType.literal_null;
	value:      null;
}

export class Lexer {
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

	private is_whitespace(ch: string): boolean {
		return (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r');
	}

	private is_keyword_boundary(ch: string): boolean {
		return this.is_whitespace(ch) || ch === '}'; // kind of flaky
	}

	private is_alpha(ch: string): boolean {
		return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_'; // allow dash?
	}

	private is_numeric(ch: string): boolean {
		return ch >= '0' && ch <= '9';
	}

	private is_alphanumeric(ch: string): boolean {
		return this.is_alpha(ch) || this.is_numeric(ch);
	}

	private current_ch(): string | null {
		if (this.cursor >= this.input.length) {
			return null;
		}

		return this.input[this.cursor];
	}

	private advance_ch(): void {
		const ch = this.input[this.cursor];

		this.cursor += 1;

		if (ch === '\n') {
			this.line += 1;
			this.column = 1;
		} else {
			this.column += 1;
		}
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
				if (this.cursor + 1 < this.input.length && this.input[this.cursor + 1] === '/') {
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
					if (this.cursor + 1 < this.input.length && this.input[this.cursor + 1] === '{') {
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
				) {
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
					if (this.cursor + 1 < this.input.length && this.input[this.cursor + 1] === '{') {
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
						if (this.cursor + 1 < this.input.length && this.input[this.cursor + 1] === '{') {
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

						// import
						if (
							this.cursor + 8 <= this.input.length &&
							this.input[this.cursor] === 'i' &&
							this.input[this.cursor + 1] === 'm' &&
							this.input[this.cursor + 2] === 'p' &&
							this.input[this.cursor + 3] === 'o' &&
							this.input[this.cursor + 4] === 'r' &&
							this.input[this.cursor + 5] === 't' &&
							this.is_keyword_boundary(this.input[this.cursor + 6])
						) {
							for (let i = 0; i < 7; i++) {
								this.advance_ch();
							}

							this.type = TokenType.import_start;
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
								const ch = this.current_ch();

								if (!ch) {
									break;
								}

								if (this.is_numeric(ch)) {
									this.advance_ch();
								} else if (ch === '.' && this.type === TokenType.integer) {
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
								const ch = this.current_ch();

								if (!ch) {
									break;
								}

								if (ch === quote) {
									this.advance_ch();
									break;
								}

								if (ch === '\\') {
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

						// invalid lexeme?
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

	tokenize(): Token[] {
		const tokens: Token[] = [];

		while (true) {
			const token = this.tokenize_lexeme();
			tokens.push(token);

			if (token.type === TokenType.eof) {
				break;
			}
		}

		return tokens;
	}

	print_token(token: Token): void {
		console.log(`${token.position.line.toString().padStart(2)}:${token.position.column.toString().padEnd(5)} ${token.type.padEnd(15)} ${token.value}`);
	}
}

export class Parser {
	tokens: Token[];
	cursor: number;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
		this.cursor = 0;
	}

	current_token(): Token {
		if (this.cursor >= this.tokens.length) {
			return this.tokens[this.tokens.length - 1];
		}

		return this.tokens[this.cursor];
	}

	private peek_token(): Token | null {
		if (this.cursor + 1 >= this.tokens.length) {
			return null;
		}

		return this.tokens[this.cursor + 1];
	}

	private advance_token(): Token {
		const current_token = this.current_token();

		this.cursor += 1;

		return current_token;
	}

	private expect_token(expected_type: TokenType): Token {
		const current_token = this.current_token();

		if (current_token.type !== expected_type) {
			throw new SyntaxError(`${ParseError.UnexpectedToken} "${current_token.value}" (${current_token.position.line}:${current_token.position.column})`);
		}

		this.cursor += 1;

		return current_token;
	}

	private is_current_token(token_type: TokenType): boolean {
		const current_token = this.current_token();
		return current_token.type === token_type;
	}

	private is_current_token_any(token_types: TokenType[]): boolean {
		const token = this.current_token();

		for (const token_type of token_types) {
			if (token.type === token_type) {
				return true;
			}
		}

		return false;
	}

	private parse_until(end_tokens: TokenType[]): Node[] {
		const nodes: Node[] = [];

		while (true) {
			const next = this.peek_token();

			if (next) {
				for (const end_token of end_tokens) {
					if (next.type === end_token) {
						return nodes;
					}
				}
			}

			const node = this.parse_statement();
			nodes.push(node);
		}
	}

	private parse_text(): Node {
		const token = this.advance_token();

		return {
			type:  NodeType.text,
			value: token.value,
		};
	}

	private parse_comment(): Node {
		const token = this.advance_token();

		return {
			type:  NodeType.comment,
			value: token.value,
		};
	}

	private parse_if_block(): Node {
		return this.parse_if_sequence(false);
	}

	private parse_if_sequence(is_nested: boolean): Node {
		this.expect_token(TokenType.if_start);

		const condition = this.parse_expression();

		this.expect_token(TokenType.expr_end);

		const consequent = this.parse_until([
			TokenType.else_start,
			TokenType.if_end
		]);

		let alternate: Node | null = null;

		if (this.is_current_token(TokenType.expr_start)) {
			const next = this.peek_token();

			if (next && next.type === TokenType.else_start) {
				this.advance_token();
				alternate = this.parse_else_block();
			}
		}

		if (!is_nested) {
			this.expect_token(TokenType.expr_start);
			this.expect_token(TokenType.if_end);
			this.expect_token(TokenType.expr_end);
		}

		return {
			type:       NodeType.block_if,
			condition:  condition,
			consequent: consequent,
			alternate:  alternate,
		};
	}

	private parse_else_block(): Node {
		this.expect_token(TokenType.else_start);

		if (this.is_current_token(TokenType.if_start)) {
			return this.parse_if_sequence(true);
		}

		this.expect_token(TokenType.expr_end);

		const body_nodes = this.parse_until([TokenType.if_end]);

		return {
			type: NodeType.program,
			body: body_nodes,
		};
	}

	private parse_switch_block(): Node {
		this.expect_token(TokenType.switch_start);

		const test = this.parse_expression();

		this.expect_token(TokenType.expr_end);

		const case_nodes: Node[] = [];

		while (true) {
			const current = this.current_token();

			if (current.type === TokenType.expr_start) {
				this.advance_token();

				const keyword = this.current_token();

				if (keyword.type === TokenType.case_start) {
					case_nodes.push(this.parse_case_block());
					continue;
				}

				if (keyword.type === TokenType.default_start) {
					case_nodes.push(this.parse_default_block());
					continue;
				}

				if (keyword.type === TokenType.switch_end) {
					this.expect_token(TokenType.switch_end);
					this.expect_token(TokenType.expr_end);
					break;
				}
			} else {
				this.advance_token();
			}
		}

		return {
			type:  NodeType.block_switch,
			test:  test,
			cases: case_nodes,
		};
	}

	private parse_case_block(): Node {
		this.expect_token(TokenType.case_start);

		const case_values = this.parse_argument_list(TokenType.expr_end, false);

		this.expect_token(TokenType.expr_end);

		const body_nodes = this.parse_until([
			TokenType.case_start,
			TokenType.default_start,
			TokenType.switch_end,
		]);

		return {
			type:   NodeType.block_case,
			values: case_values,
			body:   body_nodes,
		};
	}

	private parse_default_block(): Node {
		this.expect_token(TokenType.default_start);
		this.expect_token(TokenType.expr_end);

		const body_nodes = this.parse_until([TokenType.switch_end]);

		return {
			type: NodeType.block_default,
			body: body_nodes,
		};
	}

	private parse_for_block(): Node {
		this.expect_token(TokenType.for_start);

		const iterator = this.expect_token(TokenType.identifier).value;

		let index: string | null = null;

		if (this.is_current_token(TokenType.comma)) {
			this.advance_token();
			index = this.expect_token(TokenType.identifier).value;
		}

		this.expect_token(TokenType.for_in);

		const iterable = this.parse_expression();

		this.expect_token(TokenType.expr_end);

		const body_nodes = this.parse_until([
			TokenType.for_end
		]);

		this.expect_token(TokenType.expr_start);
		this.expect_token(TokenType.for_end);
		this.expect_token(TokenType.expr_end);

		return {
			type:     NodeType.block_for,
			iterator: iterator,
			index:    index,
			iterable: iterable,
			body:     body_nodes,
		};
	}

	private parse_expression(): Node {
		return this.parse_conditional_expression();
	}

	private parse_expression_block(): Node {
		const token = this.current_token();

		if (token.type === TokenType.expr_end) {
			this.advance_token();

			return {
				type:  NodeType.expression,
				value: {
					type:  NodeType.literal_null,
					value: null,
				}
			};
		}

		const expression = this.parse_expression();
		this.expect_token(TokenType.expr_end);

		return {
			type:  NodeType.expression,
			value: expression,
		};
	}

	private parse_conditional_expression(): Node {
		const left = this.parse_logical_or();

		if (this.is_current_token(TokenType.question_mark)) {
			this.advance_token();

			const consequent = this.parse_expression();

			this.expect_token(TokenType.colon);

			const alternate = this.parse_expression();

			return {
				type:       NodeType.expression_conditional,
				condition:  left,
				consequent: consequent,
				alternate:  alternate,
			};
		}

		return left;
	}

	private parse_binary_expression(operators: TokenType[], subexpression: () => Node): Node {
		let left = subexpression.call(this);

		while (this.is_current_token_any(operators)) {
			const token = this.current_token();
			const operator = token.type;

			this.advance_token();

			const right = subexpression.call(this);

			left = {
				type:     NodeType.expression_binary,
				left:     left,
				operator: operator,
				right:    right,
			};
		}

		return left;
	}

	private parse_logical_or(): Node {
		const operators = [TokenType.logical_or];
		return this.parse_binary_expression(operators, this.parse_logical_and);
	}

	private parse_logical_and(): Node {
		const operators = [TokenType.logical_and];
		return this.parse_binary_expression(operators, this.parse_equality);
	}

	private parse_equality(): Node {
		const operators = [TokenType.equal, TokenType.not_equal];
		return this.parse_binary_expression(operators, this.parse_relational);
	}

	private parse_relational(): Node {
		const operators = [
			TokenType.less_than,
			TokenType.greater_than,
			TokenType.less_equal,
			TokenType.greater_equal
		];

		return this.parse_binary_expression(operators, this.parse_additive);
	}

	private parse_additive(): Node {
		const operators = [TokenType.plus, TokenType.minus];
		return this.parse_binary_expression(operators, this.parse_multiplicative);
	}

	private parse_multiplicative(): Node {
		const operators = [TokenType.multiplication, TokenType.division];
		return this.parse_binary_expression(operators, this.parse_unary);
	}

	private parse_unary(): Node {
		const token = this.current_token();

		if (token.type === TokenType.minus || token.type === TokenType.exclamation) {
			const operator = token.type;

			this.advance_token();

			const operand = this.parse_unary();

			return {
				type:     NodeType.expression_unary,
				operator: operator,
				operand:  operand,
			};
		}

		return this.parse_primary();
	}

	private parse_parenthesis(): Node {
		this.advance_token();

		const expression = this.parse_expression();
		this.expect_token(TokenType.r_paren);

		return expression;
	}

	private parse_integer(): Node {
		const token = this.advance_token();

		return {
			type:  NodeType.literal_int,
			value: parseInt(token.value, 10),
		};
	}

	private parse_float(): Node {
		const token = this.advance_token();

		return {
			type:  NodeType.literal_float,
			value: parseFloat(token.value),
		};
	}

	private parse_boolean(): Node {
		const token = this.advance_token();

		return {
			type:  NodeType.literal_boolean,
			value: token.value === "true",
		};
	}

	private parse_string(): Node {
		const token = this.advance_token();

		return {
			type:  NodeType.literal_string,
			value: token.value,
		};
	}

	private parse_null(): Node {
		this.advance_token();

		return {
			type:  NodeType.literal_null,
			value: null,
		};
	}

	private parse_identifier(): Node {
		const token = this.current_token();

		let left: Node = {
			type: NodeType.identifier,
			name: token.value
		};

		this.advance_token();

		while (true) {
			if (this.is_current_token(TokenType.period)) {
				this.advance_token();

				const property = this.parse_identifier();

				left = {
					type:     NodeType.expression_member,
					object:   left,
					property: property,
				};
			} else if (this.is_current_token(TokenType.l_bracket)) {
				this.advance_token();

				const property = this.parse_expression();

				this.expect_token(TokenType.r_bracket);

				left = {
					type:     NodeType.expression_member,
					object:   left,
					property: property,
				};
			} else if (this.is_current_token(TokenType.l_paren)) {
				this.advance_token();

				const argument_list = this.parse_argument_list(TokenType.r_paren);

				this.expect_token(TokenType.r_paren);

				left = {
					type:       NodeType.function_call,
					identifier: left,
					args:       argument_list,
				};
			} else {
				break;
			}
		}

		return left;
	}

	private parse_import_block(): Node {
		this.advance_token();

		const path = this.expect_token(TokenType.string);

		this.expect_token(TokenType.expr_end);

		return {
			type: NodeType.import,
			value: path.value
		}
	}

	private parse_primary(): Node {
		const token = this.current_token();

		switch (token.type) {
			case TokenType.l_paren: {
				return this.parse_parenthesis();
			}

			case TokenType.integer: {
				return this.parse_integer();
			}

			case TokenType.float: {
				return this.parse_float();
			}

			case TokenType.string: {
				return this.parse_string();
			}

			case TokenType.boolean: {
				return this.parse_boolean();
			}

			case TokenType.null:
				case TokenType.undefined: {
				return this.parse_null();
			}

			case TokenType.identifier:
			case TokenType.import_start:
			case TokenType.for_start:
			case TokenType.for_in:
			case TokenType.if_start:
			case TokenType.else_start:
			case TokenType.switch_start:
			case TokenType.case_start: {
				return this.parse_identifier()
			}

			default: {
				throw new SyntaxError(`${ParseError.UnexpectedToken} ${token.value} (${token.position.line}:${token.position.column})`);
			}
		}
	}

	private parse_argument_list(end_token_type: TokenType, allow_empty = true): Node {
		const argument_list: Node[] = [];

		if (allow_empty && this.current_token().type === end_token_type) {
			return {
				type: NodeType.argument_list,
				args: argument_list,
			};
		}

		const first_arg = this.parse_expression();
		argument_list.push(first_arg);

		while (this.is_current_token(TokenType.comma)) {
			this.advance_token();
			const value = this.parse_expression();
			argument_list.push(value);
		}

		return {
			type: NodeType.argument_list,
			args: argument_list,
		};
	}

	private parse_statement(): Node {
		switch (this.current_token().type) {
			case TokenType.comment: {
				return this.parse_comment();
			}

			case TokenType.text: {
				return this.parse_text();
			}

			case TokenType.text_css: {
				return this.parse_text();
			}

			case TokenType.text_js: {
				return this.parse_text();
			}

			case TokenType.css_start: {
				return this.parse_text();
			}

			case TokenType.css_end: {
				return this.parse_text();
			}

			case TokenType.js_start: {
				return this.parse_text();
			}

			case TokenType.js_end: {
				return this.parse_text();
			}

			case TokenType.expr_start: {
				const next = this.peek_token();

				this.advance_token();

				if (next) {
					switch (next.type) {
						case TokenType.if_start: {
							return this.parse_if_block();
						}

						case TokenType.else_start: {
							return this.parse_else_block();
						}

						case TokenType.switch_start: {
							return this.parse_switch_block();
						}

						case TokenType.for_start: {
							return this.parse_for_block();
						}

						case TokenType.import_start: {
							return this.parse_import_block();
						}

						default: {
							return this.parse_expression_block();
						}
					}
				} else {
					throw new Error(ParseError.UnexpectedEndOfFile);
				}
			}

			default: {
				console.log(this.current_token());
				throw new Error(ParseError.UnknownToken);
			}
		}
	}

	parse(): Node {
		const nodes: Node[] = [];

		while (!this.is_current_token(TokenType.eof)) {
			const node = this.parse_statement();
			nodes.push(node);
		}

		return {
			type: NodeType.program,
			body: nodes,
		};
	}

	print_node(node: Node): void {
		console.log(JSON.stringify(node, null, 4));
	}
}

export function debug(input: string): void {
	const lexer = new Lexer(input);
	const tokens = lexer.tokenize();

	const parser = new Parser(tokens);

	for (const token of tokens) {
		lexer.print_token(token);
	}

	const ast = parser.parse();

	parser.print_node(ast);
}

export function compile(input: string): Template {
	const lexer = new Lexer(input);
	const parser = new Parser(lexer.tokenize());
	return parser.parse() as Template;
}

try {
	console.time('e')
	const ast = compile(`
		{import "thing.html"}

		// expressions
		<div>{2 + 2}</div>
		<div>{2 + 2 == 4 ? 'yes' : 'no'}</div>
		<div>{item}</div>
		<div>{item.id}</div>
		<div>{item[var].id}</div>

		// loop
		{for item, index in items}
			{if condition}
				<!-- ... -->
			{else if condition_2}
				<!-- ... -->
			{else}
				<!-- ... -->
			{/if}
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
		{/switch}

		// expression inside css
		<style>
			html {
				color: @{value};
			}
		</style>

		// expression inside js
		<script>
			if (true) {
				const test = [
					@{for n in nn}
						@{n}
					@{/for}
				];
			}
		</script>
	`);

	console.log(ast);
	console.timeEnd('e')
} catch(error: any) {
	console.error(error.message);
}
