// sfl-template
// 0.1.0
//
// depdendency-free single-file library for rendering HTML-like templates.
// the syntax resembles most mustache-based template engines. all basic logic
// blocks supported. the parser allows out-of-order imports and throws
// on import cycles. imports paths and inline <style> or <script> content
// is extracted and returned separately during parsing.
//
//
// USAGE
//     import { TemplateEngine } from './template.ts';
//
//     const t = new TemplateEngine();
//
//     t.compile('first_template', `
//         {insert 'button' (title: "test")}
//     `)
//
//     t.compile('button', `
//         <button>{title}</button>
//     `)
//
//     t.render('first_template');
//
//
// SYNTAX
//     // import
//     {insert "template.html" (date: "now", other: 2 > 2)}
//
//     // import + slot
//     {use "button" (item: "other")}
//         default slot
//
//         {slot "title"}
//             {item}
//         {/slot}
//     {/use}
//
//     // slots
//     <div>
//         {slot "title"}
//             <div>default title</div>
//         {/slot}
//
//         <button>
//             {slot}
//                 // default slot
//             {/slot}
//         </button>
//     </div>
//
//     // expressions
//     <div>{2 + 2}</div>
//     <div>{a > b && c < d || e >= f}</div>
//     <div>{2 + 2 == 4 ? 'yes' : 'no'}</div>
//     <div>{item}</div>
//     <div>{item.id}</div>
//     <div>{item[var].id}</div>
//
//     // for block
//     {for n, i in 10}
//         {n}
//     {/for}
//
//     {for ch, i in "hello"}
//         {ch}
//     {/for}
//
//     {for k, v in obj.like}
//         {k}: {v}
//     {/for}
//
//     {for item, index in items}
//         {if condition}
//             //...
//         {else if condition_2}
//             //...
//         {else}
//             //...
//         {/if}
//     {/for}
//
//     // if block
//     {if condition}
//         //...
//     {else if condition_2 || condition_3}
//         //...
//     {else}
//         //...
//     {/if}
//
//     // switch block
//     {switch var}
//         {case 2 + 2}
//             //...
//
//         {case 'test_1', 'test_2'}
//             //...
//
//         {default}
//             //...
//     {/switch}
//
//     // expression inside css
//     <style>
//         html {
//             color: @{value};
//         }
//     </style>
//
//     // expression inside js
//     <script>
//         if (true) {
//             const test = [
//                 @{for n in nn}
//                     @{n}
//                 @{/for}
//             ];
//         }
//     </script>
//
//
// OUTPUT
//     t.compile('test', `
//         {insert "misc/button.html"}
//
//         <style>
//             .css { color: red; }
//         </style>
//
//         <script>
//             const test = 20;
//         </script>
//
//         <script>
//             const ignored = @{2 + 2};
//         </script>
//
//         <div></div>
//     `);
//
//     Template {
//     	    imports:  string[]  =  [ "misc/button.html" ],
//     	    js:       string;   =  ".css { color: red; }",
//     	    css:      string;   =  "const test = 20;",
//     	    ast:      Block;    =  { ... }
//     }


export enum TokenType {
	eof                    = "eof",
	comment                = "comment",
	text                   = "text",
	text_css               = "text_css",
	text_js                = "text_js",
	expr_start             = "expr_start",
	expr_end               = "expr_end",
	tag_start_js           = "tag_start_js",
	tag_start_css          = "tag_start_css",
	tag_start_end          = "tag_start_end",
	tag_end_js             = "tag_end_js",
	tag_end_css            = "tag_end_css",
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
	insert_start           = "insert_start",
	recurse_start          = "recurse_start",
	use_start              = "use_start",
	use_end                = "use_end",
	slot_start             = "slot_start",
	slot_end               = "slot_end",
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
	l_parenthesis          = "l_parenthesis",
	r_parenthesis          = "r_parenthesis",
	l_bracket              = "l_bracket",
	r_bracket              = "r_bracket",
	underscore             = "underscore",
	comma                  = "comma",
	period                 = "period",
	colon                  = "colon",
	exclamation_mark       = "exclamation_mark",
	question_mark          = "question_mark",
	modulo                 = "modulo",
	boolean                = "boolean",
	string                 = "string",
	integer                = "integer",
	float                  = "float",
	identifier             = "identifier",
	null                   = "null",
	undefined              = "undefined"
}

enum NodeType {
	skip                   = "skip",
	template               = "template",
	text                   = "text",
	css                    = "css",
	js                     = "js",
	comment                = "comment",
	block                  = "block",
	block_if               = "block_if",
	block_else             = "block_else",
	block_switch           = "block_switch",
	block_case             = "block_case",
	block_default          = "block_default",
	block_for              = "block_for",
	block_slot             = "block_slot",
	block_use              = "block_use",
	block_insert           = "block_insert",
	block_recurse          = "block_recurse",
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
	tag                    = "tag",
	expr                   = "expr"
}

type Literal =
	| LiteralString
	| LiteralFloat
	| LiteralInt
	| LiteralBoolean
	| LiteralNull;

type Expression =
	| ExpressionBinary
	| ExpressionConditional
	| ExpressionMember
	| ExpressionUnary
	| FunctionCall
	| Identifier
	| Literal;

type Statement =
	| Block
	| If
	| Switch
	| Case
	| For
	| Insert
	| Recurse
	| Use
	| Slot;

type Content =
	| Statement
	| Expression
	| Text
	| CSS
	| JS
	| Skip
	| Comment;

type Token = {
	type:       TokenType;
	position:   TokenPosition;
	value:      string;
}

type TokenPosition = {
	line:       number;
	column:     number;
}

type Skip = {
	type:       NodeType.skip;
}

type Block = {
	type:       NodeType.block;
	body:       Content[];
}

type Comment = {
	type:       NodeType.comment;
	value:      string;
}

type Text = {
	type:       NodeType.text;
	value:      string;
}

type CSS = {
	type:       NodeType.css;
	static:     boolean;
	attributes: Block;
	body:       Block;
}

type JS = {
	type:       NodeType.js;
	static:     boolean;
	attributes: Block;
	body:       Block;
};

type FunctionCall = {
	type:       NodeType.function_call;
	identifier: Identifier;
	args:       Expression[];
}

type KeyValue = {
	key:        string;
	value:      Expression;
}

type If = {
	type:       NodeType.block_if;
	condition:  Expression;
	consequent: Block;
	alternate:  Block | If | null;
}

type Switch = {
	type:       NodeType.block_switch;
	test:       Expression;
	cases:      Case[];
}

type Case = {
	type:       NodeType.block_case;
	tests:      Expression[] | null;
	body:       Block;
}

type For = {
	type:       NodeType.block_for;
	iterator:   string;
	index:      string | null;
	iterable:   Expression;
	body:       Block;
}

type Insert = {
	type:       NodeType.block_insert;
	template:   string;
	values:     KeyValue[];
}

type Recurse = {
	type:       NodeType.block_recurse;
	template:   string;
	values:     KeyValue[];
}

type Use = {
	type:       NodeType.block_use;
	template:   string;
	values:     KeyValue[];
	slots:      Slot[];
}

type Slot = {
	type:       NodeType.block_slot;
	name:       string | null;
	body:       Block;
}

type ExpressionConditional = {
	type:       NodeType.expression_conditional;
	condition:  Expression;
	consequent: Expression;
	alternate:  Expression;
}

type ExpressionBinary = {
	type:       NodeType.expression_binary;
	left:       Expression;
	operator:   TokenType;
	right:      Expression;
}

type ExpressionUnary = {
	type:       NodeType.expression_unary;
	operator:   TokenType;
	operand:    Expression;
}

type ExpressionMember = {
	type:       NodeType.expression_member;
	object:     Expression;
	property:   Expression;
	computed:   boolean;
}

type Identifier = {
	type:       NodeType.identifier;
	name:       string;
}

type LiteralInt = {
	type:       NodeType.literal_int;
	value:      number;
}

type LiteralFloat = {
	type:       NodeType.literal_float;
	value:      number;
}

type LiteralString = {
	type:       NodeType.literal_string;
	value:      string;
}

type LiteralBoolean = {
	type:       NodeType.literal_boolean;
	value:      boolean;
}

type LiteralNull = {
	type:       NodeType.literal_null;
	value:      null;
}

export type Template = {
	imports:    string[]
	js:         string;
	css:        string;
	ast:        Block;
}

export type TemplateEngineOptions = {
	debug:       boolean;
	skip_static: boolean;
	context:     Record<string, unknown>;
}

export class Lexer {
	input:         string;
	cursor:        number;
	line:          number;
	column:        number;
	type:          TokenType;
	mode:          LexerMode;
	prev_mode:     LexerMode;
	tag_prev_mode: LexerMode;

	constructor(input: string) {
		this.input         = input;
		this.cursor        = 0;
		this.line          = 1;
		this.column        = 1;
		this.type          = TokenType.eof;
		this.mode          = LexerMode.text;
		this.prev_mode     = LexerMode.text;
		this.tag_prev_mode = LexerMode.text;
	}

	private is_whitespace(ch: string): boolean {
		return (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r');
	}

	private is_keyword_boundary(ch: string): boolean {
		return this.is_whitespace(ch) || ch === '}' || ch == ']'; // kind of flaky?
	}

	private is_alpha(ch: string): boolean {
		return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$'; // allow dash?
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

			// @note -- probably too drastic for newlines inside text?
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
					// <script> or <script ...>
					if (
						this.cursor + 7 <= this.input.length &&
						this.input[this.cursor + 1] === 's' &&
						this.input[this.cursor + 2] === 'c' &&
						this.input[this.cursor + 3] === 'r' &&
						this.input[this.cursor + 4] === 'i' &&
						this.input[this.cursor + 5] === 'p' &&
						this.input[this.cursor + 6] === 't' &&
						(this.input[this.cursor + 7] === '>' || this.is_whitespace(this.input[this.cursor + 7]))
					) {
						if (this.cursor > start_cursor) {
							break;
						}

						for (let i = 0; i < 7; i++) {
							this.advance_ch();
						}

						this.type = TokenType.tag_start_js;
						this.mode = LexerMode.tag;
						this.tag_prev_mode = LexerMode.js;

						break;
					}

					// <style> or <style ...>
					if (
						this.cursor + 6 <= this.input.length &&
						this.input[this.cursor + 1] === 's' &&
						this.input[this.cursor + 2] === 't' &&
						this.input[this.cursor + 3] === 'y' &&
						this.input[this.cursor + 4] === 'l' &&
						this.input[this.cursor + 5] === 'e' &&
						(this.input[this.cursor + 6] === '>' || this.is_whitespace(this.input[this.cursor + 6]))
					) {
						if (this.cursor > start_cursor) {
							break;
						}

						for (let i = 0; i < 6; i++) {
							this.advance_ch();
						}

						this.type = TokenType.tag_start_css;
						this.mode = LexerMode.tag;
						this.tag_prev_mode = LexerMode.css;

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
					ch === '<' &&
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

					this.type = TokenType.tag_end_css;

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
					ch === '<' &&
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

					this.type = TokenType.tag_end_js;

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

			if (this.mode === LexerMode.tag) {
				this.type = TokenType.text;

				if (ch === '>') {
					if (this.cursor > start_cursor) {
						break;
					}

					this.advance_ch();

					this.type = TokenType.tag_start_end;
					this.mode = this.tag_prev_mode;

					return this.create_token(start_cursor, start_position);
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
						// {/use}
						if (
							this.cursor + 4 <= this.input.length &&
							this.input[this.cursor + 1] === 'u' &&
							this.input[this.cursor + 2] === 's' &&
							this.input[this.cursor + 3] === 'e'
						) {
							for (let i = 0; i < 4; i++) {
								this.advance_ch();
							}

							this.type = TokenType.use_end;
							return this.create_token(start_cursor, start_position);
						}

						// {/slot}
						if (
							this.cursor + 5 <= this.input.length &&
							this.input[this.cursor + 1] === 's' &&
							this.input[this.cursor + 2] === 'l' &&
							this.input[this.cursor + 3] === 'o' &&
							this.input[this.cursor + 4] === 't'
						) {
							for (let i = 0; i < 5; i++) {
								this.advance_ch();
							}

							this.type = TokenType.slot_end;
							return this.create_token(start_cursor, start_position);
						}

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
						this.type = TokenType.exclamation_mark;

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
						if (this.cursor + 2 <= this.input.length && this.input[this.cursor + 1] === '|') {
							this.advance_ch();
							this.advance_ch();
							this.type = TokenType.logical_or;
							return this.create_token(start_cursor, start_position);
						}
					}

					case '&': {
						if (this.cursor + 2 <= this.input.length && this.input[this.cursor + 1] === '&') {
							this.advance_ch();
							this.advance_ch();
							this.type = TokenType.logical_and;
							return this.create_token(start_cursor, start_position);
						}
					}

					case '(': {
						this.advance_ch();
						this.type = TokenType.l_parenthesis;
						return this.create_token(start_cursor, start_position);
					}

					case ')': {
						this.advance_ch();
						this.type = TokenType.r_parenthesis;
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

					case '%': {
						this.advance_ch();
						this.type = TokenType.modulo;
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
							this.input[this.cursor]     === 't' &&
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
							this.input[this.cursor]     === 'f' &&
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

						// use
						if (
							this.cursor + 4 <= this.input.length &&
							this.input[this.cursor]     === 'u' &&
							this.input[this.cursor + 1] === 's' &&
							this.input[this.cursor + 2] === 'e' &&
							this.is_keyword_boundary(this.input[this.cursor + 3])
						) {
							for (let i = 0; i < 4; i++) {
								this.advance_ch();
							}

							this.type = TokenType.use_start;
							return this.create_token(start_cursor, start_position);
						}

						// slot
						if (
							this.cursor + 5 <= this.input.length &&
							this.input[this.cursor]     === 's' &&
							this.input[this.cursor + 1] === 'l' &&
							this.input[this.cursor + 2] === 'o' &&
							this.input[this.cursor + 3] === 't' &&
							this.is_keyword_boundary(this.input[this.cursor + 4])
						) {
							for (let i = 0; i < 4; i++) {
								this.advance_ch();
							}

							this.type = TokenType.slot_start;
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

						// else
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

						// insert
						if (
							this.cursor + 8 <= this.input.length &&
							this.input[this.cursor] === 'i' &&
							this.input[this.cursor + 1] === 'n' &&
							this.input[this.cursor + 2] === 's' &&
							this.input[this.cursor + 3] === 'e' &&
							this.input[this.cursor + 4] === 'r' &&
							this.input[this.cursor + 5] === 't' &&
							this.is_keyword_boundary(this.input[this.cursor + 6])
						) {
							for (let i = 0; i < 7; i++) {
								this.advance_ch();
							}

							this.type = TokenType.insert_start;
							return this.create_token(start_cursor, start_position);
						}

						// recurse
						if (
							this.cursor + 8 <= this.input.length &&
							this.input[this.cursor]     === 'r' &&
							this.input[this.cursor + 1] === 'e' &&
							this.input[this.cursor + 2] === 'c' &&
							this.input[this.cursor + 3] === 'u' &&
							this.input[this.cursor + 4] === 'r' &&
							this.input[this.cursor + 5] === 's' &&
							this.input[this.cursor + 6] === 'e' &&
							this.is_keyword_boundary(this.input[this.cursor + 7])
						) {
							for (let i = 0; i < 7; i++) {
								this.advance_ch();
							}

							this.type = TokenType.recurse_start;
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

						const { line, column } = start_position;
						throw new Error(`Misplaced character ${ch} (${line}:${column})`);
					}
				}
			}

			this.advance_ch();
		}

		const token_value = this.input.slice(start_cursor, this.cursor);

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
	tokens:  Token[];
	cursor:  number;
	imports: string[]              = []; // collected imports of this template
	css:     string                = ""; // collected static css of this template
	js:      string                = ""; // collected static js of this template
	options: TemplateEngineOptions = {
		debug:       false,
		skip_static: false,
		context:     {}
	};

	constructor(tokens: Token[], options?: Partial<TemplateEngineOptions>) {
		this.tokens = tokens;
		this.cursor = 0;

		if (options) {
			this.options = Object.assign(this.options, options);
		}
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
		const current = this.current_token();

		if (current.type === TokenType.eof) {
			const { line, column } = current.position;
			throw new Error(`Unexpected end of file (${line}:${column})`);
		}

		if (current.type !== expected_type) {
			const { line, column } = current.position;
			throw new Error(`Unexpected token ${current.value} (${line}:${column})`);
		}

		this.cursor += 1;

		return current;
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

	private parse_until(end_tokens: TokenType[]): Content[] {
		const nodes: Content[] = [];

		while (true) {
			const next = this.peek_token();

			if (next) {
				for (const end_token of end_tokens) {
					if (next.type === end_token) {
						return nodes;
					}
				}
			}

			nodes.push(this.parse_content());
		}
	}

	private parse_text(): Text {
		const token = this.advance_token();

		return {
			type:  NodeType.text,
			value: token.value,
		};
	}

	private parse_css(): CSS | Skip {
		this.expect_token(TokenType.tag_start_css);

		const attributes: Block = {
			type: NodeType.block,
			body: []
		};

		while (!this.is_current_token(TokenType.tag_start_end)) {
			attributes.body.push(this.parse_content());
		}

		this.expect_token(TokenType.tag_start_end);

		let is_static = true;
		const body_nodes: Content[] = [];

		while (!this.is_current_token(TokenType.tag_end_css)) {
			const node = this.parse_content();
			is_static = is_static && node.type === NodeType.text;
			body_nodes.push(node);
		}

		this.expect_token(TokenType.tag_end_css);

		if (is_static) {
			for (const node of body_nodes) {
				this.css += (node as Text).value;
			}

			if (this.options.skip_static === true) {
				return {
					type: NodeType.skip
				}
			}
		}

		return {
			type: NodeType.css,
			attributes: attributes,
			static: is_static,
			body:   {
				type: NodeType.block,
				body: body_nodes
			}
		};
	}

	private parse_js(): JS | Skip {
		this.expect_token(TokenType.tag_start_js);

		const attributes: Block = {
			type: NodeType.block,
			body: []
		}

		while (!this.is_current_token(TokenType.tag_start_end)) {
			attributes.body.push(this.parse_content());
		}

		this.expect_token(TokenType.tag_start_end);

		let is_static = true;
		const body_nodes: Content[] = [];

		while (!this.is_current_token(TokenType.tag_end_js)) {
			const node = this.parse_content();
			is_static = is_static && node.type === NodeType.text;
			body_nodes.push(node);
		}

		this.expect_token(TokenType.tag_end_js);

		if (is_static) {
			for (const node of body_nodes) {
				this.js += (node as Text).value;
			}

			if (this.options.skip_static === true) {
				return {
					type: NodeType.skip
				}
			}
		}

		return {
			type: NodeType.js,
			attributes: attributes,
			static: is_static,
			body: {
				type: NodeType.block,
				body: body_nodes
			}
		};
	}

	private parse_comment(): Comment {
		const token = this.advance_token();

		return {
			type:  NodeType.comment,
			value: token.value,
		};
	}

	private parse_if_block(): If {
		return this.parse_if_sequence(false);
	}

	private parse_if_sequence(is_nested: boolean): If {
		this.expect_token(TokenType.if_start);

		const condition = this.parse_expression();

		this.expect_token(TokenType.expr_end);

		const consequent: Block = {
			type: NodeType.block,
			body: this.parse_until([
				TokenType.else_start,
				TokenType.if_end
			])
		};

		let alternate: If | Block | null = null;

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
			alternate:  alternate
		};
	}

	private parse_else_block(): If | Block {
		this.expect_token(TokenType.else_start);

		if (this.is_current_token(TokenType.if_start)) {
			return this.parse_if_sequence(true);
		}

		this.expect_token(TokenType.expr_end);

		const body_nodes = this.parse_until([TokenType.if_end]);

		return {
			type: NodeType.block,
			body: body_nodes
		};
	}

	private parse_switch_block(): Switch {
		this.expect_token(TokenType.switch_start);

		const test = this.parse_expression();

		this.expect_token(TokenType.expr_end);

		const case_nodes: Case[] = [];

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
			} else if (current.type === TokenType.eof) {
				const { line, column } = current.position;
				throw new Error(`Unexpected end of file (${line}:${column})`);
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

	private parse_case_block(): Case {
		this.expect_token(TokenType.case_start);

		const case_values = this.parse_argument_list(TokenType.expr_end, false);

		this.expect_token(TokenType.expr_end);

		const body_nodes = this.parse_until([
			TokenType.case_start,
			TokenType.default_start,
			TokenType.switch_end,
		]);

		const body: Block = {
			type: NodeType.block,
			body: body_nodes
		}

		return {
			type:  NodeType.block_case,
			tests: case_values,
			body:  body
		};
	}

	private parse_default_block(): Case {
		this.expect_token(TokenType.default_start);
		this.expect_token(TokenType.expr_end);

		const body_nodes = this.parse_until([TokenType.switch_end]);

		const body: Block = {
			type: NodeType.block,
			body: body_nodes
		}

		return {
			type:  NodeType.block_case,
			tests: null,
			body:  body
		};
	}

	private parse_insert_block(): Insert {
		this.advance_token();

		// @later -- this.options.static ? string : expr
		const template = this.expect_token(TokenType.string);

		this.imports.push(template.value);

		let values: KeyValue[] = [];

		if (this.current_token().type == TokenType.l_parenthesis) {
			this.advance_token();
			values = this.parse_key_value_list();
			this.expect_token(TokenType.r_parenthesis);
		}

		this.expect_token(TokenType.expr_end);

		return {
			type:     NodeType.block_insert,
			template: template.value,
			values:   values
		}
	}

	private parse_recurse_block(): Recurse {
		this.advance_token();

		const template = this.expect_token(TokenType.string);

		let values: KeyValue[] = [];

		if (this.current_token().type == TokenType.l_parenthesis) {
			this.advance_token();
			values = this.parse_key_value_list();
			this.expect_token(TokenType.r_parenthesis);
		}

		this.expect_token(TokenType.expr_end);

		return {
			type:     NodeType.block_recurse,
			template: template.value,
			values:   values
		}
	}

	private parse_use_block(): Use {
		this.advance_token();

		// @later -- this.options.static ? string : expr
		const template = this.expect_token(TokenType.string);

		this.imports.push(template.value);

		let values: KeyValue[] = [];

		if (this.current_token().type == TokenType.l_parenthesis) {
			this.advance_token();
			values = this.parse_key_value_list();
			this.expect_token(TokenType.r_parenthesis);
		}

		this.expect_token(TokenType.expr_end);

		const default_body_nodes = this.parse_until([
			TokenType.slot_start,
			TokenType.use_end
		]);

		const default_slot: Slot = {
			type: NodeType.block_slot,
			name: null,
			body: {
				type: NodeType.block,
				body: default_body_nodes
			}
		};

		const slot_nodes: Slot[] = [];

		if (default_body_nodes.length > 0) {
			slot_nodes.push(default_slot);
		}

		this.expect_token(TokenType.expr_start);

		while (true) {
			const current = this.current_token();

			if (current.type === TokenType.use_end) {
				this.expect_token(TokenType.use_end);
				this.expect_token(TokenType.expr_end);
				break;
			} else if (current.type === TokenType.slot_start) {
				slot_nodes.push(this.parse_slot_block());
			} else if (current.type === TokenType.eof) {
				const { line, column } = current.position;
				throw new Error(`Unexpected end of file (${line}:${column})`);
			} else {
				this.advance_token();
			}
		}

		return {
			type:     NodeType.block_use,
			template: template.value,
			values:   values,
			slots:    slot_nodes
		};
	}

	private parse_slot_block(): Slot {
		this.advance_token();

		let name: Token | null = null;

		if (this.current_token().type == TokenType.string) {
			name = this.advance_token();
		}

		this.expect_token(TokenType.expr_end);

		const body_nodes = this.parse_until([TokenType.slot_end]);

		this.expect_token(TokenType.expr_start);
		this.expect_token(TokenType.slot_end);
		this.expect_token(TokenType.expr_end);

		const slot_body: Block = {
			type: NodeType.block,
			body: body_nodes
		}

		return {
			type: NodeType.block_slot,
			name: name?.value || null,
			body: slot_body
		};
	}

	private parse_for_block(): For {
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

		const for_body: Block = {
			type: NodeType.block,
			body: body_nodes
		}

		return {
			type:     NodeType.block_for,
			iterator: iterator,
			index:    index,
			iterable: iterable,
			body:     for_body
		};
	}

	private parse_expression_block(): Expression {
		const token = this.current_token();

		if (token.type === TokenType.expr_end) {
			this.advance_token();

			return {
				type:  NodeType.literal_null,
				value: null,
			};
		}

		const expression = this.parse_conditional_expression();
		this.expect_token(TokenType.expr_end);

		return expression;
	}

	private parse_expression(): Expression {
		return this.parse_conditional_expression();
	}

	private parse_conditional_expression(): Expression {
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

	private parse_binary_expression(operators: TokenType[], subexpression: () => Expression): Expression {
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

	private parse_logical_or(): Expression {
		const operators = [TokenType.logical_or];
		return this.parse_binary_expression(operators, this.parse_logical_and);
	}

	private parse_logical_and(): Expression {
		const operators = [TokenType.logical_and];
		return this.parse_binary_expression(operators, this.parse_equality);
	}

	private parse_equality(): Expression {
		const operators = [TokenType.equal, TokenType.not_equal];
		return this.parse_binary_expression(operators, this.parse_relational);
	}

	private parse_relational(): Expression {
		const operators = [
			TokenType.less_than,
			TokenType.greater_than,
			TokenType.less_equal,
			TokenType.greater_equal
		];

		return this.parse_binary_expression(operators, this.parse_additive);
	}

	private parse_additive(): Expression {
		const operators = [TokenType.plus, TokenType.minus];
		return this.parse_binary_expression(operators, this.parse_multiplicative);
	}

	private parse_multiplicative(): Expression {
		const operators = [TokenType.multiplication, TokenType.division];
		return this.parse_binary_expression(operators, this.parse_modulo);
	}

	private parse_modulo(): Expression {
		const operators = [TokenType.modulo];
		return this.parse_binary_expression(operators, this.parse_unary);
	}

	private parse_unary(): Expression {
		const token = this.current_token();

		if (token.type === TokenType.minus || token.type === TokenType.exclamation_mark) {
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

	private parse_primary(): Expression {
		const current = this.current_token();

		switch (current.type) {
			case TokenType.l_parenthesis: {
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
			case TokenType.insert_start:
			case TokenType.use_start:
			case TokenType.slot_start:
			case TokenType.for_start:
			case TokenType.for_in:
			case TokenType.if_start:
			case TokenType.else_start:
			case TokenType.switch_start:
			case TokenType.case_start: {
				return this.parse_identifier()
			}

			default: {
				const { line, column } = current.position;
				throw new Error(`Unexpected token ${current.value} (${line}:${column})`);
			}
		}
	}

	private parse_parenthesis(): Expression {
		this.advance_token();

		const expression = this.parse_expression();
		this.expect_token(TokenType.r_parenthesis);

		return expression;
	}

	private parse_integer(): LiteralInt {
		const token = this.advance_token();

		return {
			type:  NodeType.literal_int,
			value: parseInt(token.value, 10),
		};
	}

	private parse_float(): LiteralFloat {
		const token = this.advance_token();

		return {
			type:  NodeType.literal_float,
			value: parseFloat(token.value),
		};
	}

	private parse_string(): LiteralString {
		const token = this.advance_token();

		return {
			type:  NodeType.literal_string,
			value: token.value,
		};
	}

	private parse_boolean(): LiteralBoolean {
		const token = this.advance_token();

		return {
			type:  NodeType.literal_boolean,
			value: token.value === "true",
		};
	}

	private parse_null(): LiteralNull {
		this.advance_token();

		return {
			type:  NodeType.literal_null,
			value: null,
		};
	}

	private parse_identifier(): ExpressionMember | FunctionCall | Identifier {
		const token = this.current_token();

		let left: Expression = {
			type: NodeType.identifier,
			name: token.value
		};

		this.advance_token();

		while (true) {
			if (this.is_current_token(TokenType.period)) {
				this.advance_token();

				const prop_token = this.current_token();
				const property: Identifier = {
					type: NodeType.identifier,
					name: prop_token.value,
				};
				this.advance_token();

				left = {
					type:     NodeType.expression_member,
					object:   left,
					property: property,
					computed: false,
				};
			} else if (this.is_current_token(TokenType.l_bracket)) {
				this.advance_token();

				const property = this.parse_expression();

				this.expect_token(TokenType.r_bracket);

				left = {
					type:     NodeType.expression_member,
					object:   left,
					property: property,
					computed: true,
				};
			} else if (this.is_current_token(TokenType.l_parenthesis)) {
				this.advance_token();

				const argument_list = this.parse_argument_list(TokenType.r_parenthesis);

				this.expect_token(TokenType.r_parenthesis);

				left = {
					type:       NodeType.function_call,
					identifier: left as Identifier,
					args:       argument_list,
				};
			} else {
				break;
			}
		}

		return left;
	}

	private parse_argument_list(end_token_type: TokenType, allow_empty = true): Expression[] {
		const argument_list: Expression[] = [];

		if (allow_empty && this.current_token().type === end_token_type) {
			return argument_list;
		}

		const first_arg = this.parse_expression();
		argument_list.push(first_arg);

		while (this.is_current_token(TokenType.comma)) {
			this.advance_token();
			const value = this.parse_expression();
			argument_list.push(value);
		}

		return argument_list;
	}

	private parse_key_value_list(): KeyValue[] {
		const pairs: KeyValue[] = [];

		while (true) {
			const key = this.expect_token(TokenType.identifier).value;

			this.expect_token(TokenType.colon);

			const value = this.parse_expression();

			pairs.push({
				key:   key,
				value: value
			});

			if (this.is_current_token(TokenType.comma)) {
				this.advance_token();
			}

			if (this.is_current_token(TokenType.r_parenthesis)) {
				break;
			}
		};

		return pairs;
	}

	private parse_content(): Content {
		const current = this.current_token();

		switch (current.type) {
			case TokenType.comment: {
				return this.parse_comment();
			}

			case TokenType.text:
			case TokenType.text_css:
			case TokenType.text_js: {
				return this.parse_text();
			}

			case TokenType.tag_start_css: {
				return this.parse_css();
			}

			case TokenType.tag_start_js: {
				return this.parse_js();
			}

			case TokenType.expr_start: {
				const next = this.peek_token()!;

				this.advance_token();

				switch (next.type) {
					case TokenType.if_start: {
						return this.parse_if_block();
					}

					case TokenType.switch_start: {
						return this.parse_switch_block();
					}

					case TokenType.for_start: {
						return this.parse_for_block();
					}

					case TokenType.insert_start: {
						return this.parse_insert_block();
					}

					case TokenType.recurse_start: {
						return this.parse_recurse_block();
					}

					case TokenType.use_start: {
						return this.parse_use_block();
					}

					case TokenType.slot_start: {
						return this.parse_slot_block();
					}

					case TokenType.eof: {
						const { line, column } = current.position;
						throw new Error(`Unexpected end of file (${line}:${column})`);
					}

					default: {
						return this.parse_expression_block();
					}
				}
			}

			case TokenType.eof: {
				const { line, column } = current.position;
				throw new Error(`Unexpected end of file (${line}:${column})`);
			}

			default: {
				const { line, column } = current.position;
				throw new Error(`Unknown token ${current.value} (${line}:${column})`);
			}
		}
	}

	parse(): Template {
		const nodes: Content[] = [];

		while (!this.is_current_token(TokenType.eof)) {
			nodes.push(this.parse_content());
		}

		return {
			imports: this.imports,
			js: this.js,
			css: this.css,
			ast: {
				type: NodeType.block,
				body: nodes
			}
		}
	}

	print_node(node: Content): void {
		console.log(JSON.stringify(node, null, 4));
	}
}

export class Renderer {
	private template:      Template;
	private templates:     Record<string, Template>                  = {};
	private context:       Record<string, unknown>                   = {};
	private slots:         Map<string | null, string>                = new Map();
	private recurse_depth: number                                    = 0;
	private recurse_max:   number                                    = 32;

	constructor(template: Template, templates: Record<string, Template>, context: Record<string, unknown>) {
		this.template  = template;
		this.templates = templates;
		this.context   = context;
	}

	private eval_literal(node: Literal): unknown {
		return node.value;
	}

	private eval_identifier(node: Identifier): unknown {
		return this.context[node.name] ?? null;
	}

	private eval_function_call(node: FunctionCall): unknown {
		const identifier = this.eval_node(node.identifier);
		const args: any = [];

		for (const arg of node.args) {
			args.push(this.eval_node(arg));
		}

		if (typeof identifier !== 'function') {
			return null;
		}

		if (!identifier) {
			return null;
		}

		return identifier(...args);
	}

	private eval_expression_member(node: ExpressionMember): unknown {
		const object = this.eval_node(node.object);

		if (object === null || object === undefined) {
			return null;
		}

		const property = node.computed
			? this.eval_node(node.property)
			: (node.property as Identifier).name;


		if (typeof property !== "string" && typeof property !== "number") {
			return null;
		}

		try {
			return (object as any)[property] ?? null;
		} catch {
			return null;
		}
	}

	private eval_expression_binary(node: ExpressionBinary): unknown {
		const left = this.eval_node(node.left);
		const right = this.eval_node(node.right);

		switch (node.operator) {
			case TokenType.logical_or:
				return left || right;
			case TokenType.logical_and:
				return left && right;
			case TokenType.not_equal:
				return (left as unknown) != (right as unknown);
			case TokenType.equal:
				return (left as unknown) == (right as unknown);
			case TokenType.greater_than:
				return (left as number) > (right as number);
			case TokenType.less_than:
				return (left as number) < (right as number);
			case TokenType.greater_equal:
				return (left as number) >= (right as number);
			case TokenType.less_equal:
				return (left as number) <= (right as number);
			case TokenType.plus:
				return (left as number) + (right as number);
			case TokenType.minus:
				return (left as number) - (right as number);
			case TokenType.multiplication:
				return (left as number) * (right as number);
			case TokenType.division:
				return (left as number) / (right as number);
			case TokenType.modulo:
				return (left as number) % (right as number);
		}
	}

	private eval_expression_conditional(node: ExpressionConditional): unknown {
		if (this.eval_node(node.condition)) {
			return this.eval_node(node.consequent);
		} else {
			return this.eval_node(node.alternate);
		}
	}

	private eval_node(node: Content): unknown {
		switch(node.type) {
			case NodeType.identifier: {
				return this.eval_identifier(node);
			}

			case NodeType.function_call: {
				return this.eval_function_call(node);
			}

			case NodeType.expression_member: {
				return this.eval_expression_member(node);
			}

			case NodeType.expression_unary: {
				const unary = node as ExpressionUnary;
				const operand = this.eval_node(unary.operand);
				if (unary.operator === TokenType.minus) return -(operand as number);
				if (unary.operator === TokenType.exclamation_mark) return !operand;
				return null;
			}

			case NodeType.expression_binary: {
				return this.eval_expression_binary(node);
			}

			case NodeType.expression_conditional: {
				return this.eval_expression_conditional(node);
			}

			case NodeType.literal_int:
			case NodeType.literal_string:
			case NodeType.literal_boolean:
			case NodeType.literal_float:
			case NodeType.literal_null: {
				return this.eval_literal(node);
			}

			default: {
				console.log('NI %s', node.type);
				return null;
			}
		}
	}

	private render_skip(_: Skip): string {
		return "";
	}

	private render_comment(_: Comment): string {
		return "";
	}

	private render_text(node: Text): string {
		return node.value;
	}

	private render_css(node: CSS): string {
		const attributes = this.render_node(node.attributes);
		const content = this.render_node(node.body);
		return `<style ${attributes}>${content}</style>`
	}

	private render_js(node: JS): string {
		const attributes = this.render_node(node.attributes);
		const content = this.render_node(node.body);
		return `<script ${attributes}>${content}</script>`
	}

	private render_if_block(node: If): string {
		if (this.eval_node(node.condition)) {
			return this.render_node(node.consequent);
		}

		if (node.alternate) {
			return this.render_node(node.alternate);
		}

		return "";
	}

	private render_for_block(node: For): string {
		const iterable = this.eval_node(node.iterable);

		const initial_iterator = this.context[node.iterator];
		const initial_index    = this.context[node.index as string];

		let output = "";

		try {
			if (iterable === null || iterable === undefined) {
				return "";
			}

			if (typeof iterable === 'string') {
				const loop_string = iterable;

				if (loop_string.length === 0) {
					return "";
				}

				for (let i = 0; i < loop_string.length; i++) {
					this.context[node.iterator] = loop_string[i];

					if (node.index) {
						this.context[node.index as string] = i;
					}

					output += this.render_node(node.body);
				}
			} else if (Array.isArray(iterable)) {
				const loop_array = iterable;

				if (loop_array.length === 0) {
					return "";
				}

				for (let i = 0; i < loop_array.length; i++) {
					this.context[node.iterator] = loop_array[i];

					if (node.index) {
						this.context[node.index as string] = i;
					}

					output += this.render_node(node.body);
				}
			} else if (typeof iterable === 'number') {
				const loop_number = iterable;

				if (loop_number <= 0) {
					return "";
				}

				for (let i = 0; i < loop_number; i++) {
					this.context[node.iterator] = i;

					if (node.index) {
						this.context[node.index as string] = i;
					}

					output += this.render_node(node.body);
				}
			} else if (typeof iterable === 'object') {
				const loop_object = iterable as any;
				const loop_object_keys = Object.keys(loop_object);

				for (let i = 0; i < loop_object_keys.length; i++) {
					const key = loop_object_keys[i];

					this.context[node.iterator] = loop_object[key];

					if (node.index) {
						this.context[node.index as string] = key;
					}

					output += this.render_node(node.body);
				}
			}
		} finally {
			if (initial_iterator) {
				this.context[node.iterator] = initial_iterator;
			} else {
				delete this.context[node.iterator];
			}

			if (initial_index) {
				this.context[node.index as string] = initial_index;
			} else {
				delete this.context[node.index as string];
			}
		}

		return output;
	}

	private render_switch_block(node: Switch): string {
		const test = this.eval_node(node.test);

		for (const switch_case of node.cases) {
			if (switch_case.tests === null) {
				return this.render_node(switch_case.body);
			}

			for (const test_expr of switch_case.tests) {
				const test_value = this.eval_node(test_expr);

				if (test_value === test) {
					return this.render_node(switch_case.body);
				}
			}
		}

		return "";
	}

	private render_use_block(node: Use): string {
		const initial_context: Record<string, unknown> = {};

		for (const pair of node.values) {
			if (this.context[pair.key]) {
				initial_context[pair.key] = this.context[pair.key];
			}

			this.context[pair.key] = this.eval_node(pair.value);
		}

		const template = this.templates[node.template];

		if (!template) {
			throw new Error(`Template "${node.template}" not compiled`);
		}

		for (const block of node.slots) {
			this.slots.set(block.name, this.render_node(block.body));
		}

		const inserted = this.render_node(template.ast);

		for (const pair of node.values) {
			if (initial_context.hasOwnProperty(pair.key)) {
				this.context[pair.key] = initial_context[pair.key];
			} else {
				delete this.context[pair.key];
			}
		}

		this.slots.clear();

		return inserted;
	}

	private render_slot_block(node: Slot): string {
		const rendered_slot = this.slots.get(node.name);

		if (rendered_slot) {
			return rendered_slot;
		} else {
			return this.render_node(node.body);
		}
	}

	private render_insert(node: Insert): string {
		const initial_context: Record<string, unknown> = {};

		for (const pair of node.values) {
			initial_context[pair.key] = this.context[pair.key];
			this.context[pair.key] = this.eval_node(pair.value);
		}

		const template = this.templates[node.template];

		if (!template) {
			throw new Error(`Template "${node.template}" not compiled`);
		}

		const inserted = this.render_node(template.ast);

		for (const pair of node.values) {
			if (initial_context.hasOwnProperty(pair.key)) {
				this.context[pair.key] = initial_context[pair.key];
			} else {
				delete this.context[pair.key];
			}
		}

		return inserted;
	}

	private render_recurse(node: Recurse): string {
		if (this.recurse_depth >= this.recurse_max) {
			return "";
		}

		const initial_context: Record<string, unknown> = {};

		for (const pair of node.values) {
			initial_context[pair.key] = this.context[pair.key];
			this.context[pair.key] = this.eval_node(pair.value);
		}

		const template = this.templates[node.template];

		if (!template) {
			throw new Error(`Template "${node.template}" not compiled`);
		}

		this.recurse_depth++;
		const inserted = this.render_node(template.ast);
		this.recurse_depth--;

		for (const pair of node.values) {
			if (initial_context.hasOwnProperty(pair.key)) {
				this.context[pair.key] = initial_context[pair.key];
			} else {
				delete this.context[pair.key];
			}
		}

		return inserted;
	}

	private render_block(node: Block): string {
		let output = "";

		for (const block of node.body) {
			output += this.render_node(block);
		}

		return output;
	}

	private render_content(node: Content): string {
		const value = this.eval_node(node);

		if (value === null || value === undefined) {
			return "";
		}

		return String(value);
	}

	private render_node(node: Content): string {
		switch(node.type) {
			case NodeType.skip: {
				return this.render_skip(node);
			}

			case NodeType.text: {
				return this.render_text(node);
			}

			case NodeType.css: {
				return this.render_css(node);
			}

			case NodeType.js: {
				return this.render_js(node);
			}

			case NodeType.comment: {
				return this.render_comment(node);
			}

			case NodeType.block: {
				return this.render_block(node);
			}

			case NodeType.block_if: {
				return this.render_if_block(node);
			}

			case NodeType.block_for: {
				return this.render_for_block(node);
			}

			case NodeType.block_switch: {
				return this.render_switch_block(node);
			}

			case NodeType.block_use: {
				return this.render_use_block(node);
			}

			case NodeType.block_slot: {
				return this.render_slot_block(node);
			}

			case NodeType.block_insert: {
				return this.render_insert(node);
			}

			case NodeType.block_recurse: {
				return this.render_recurse(node);
			}

			case NodeType.identifier:
			case NodeType.function_call:
			case NodeType.expression_member:
			case NodeType.expression_unary:
			case NodeType.expression_binary:
			case NodeType.expression_conditional:
			case NodeType.literal_int:
			case NodeType.literal_string:
			case NodeType.literal_boolean:
			case NodeType.literal_float:
			case NodeType.literal_null: {
				return this.render_content(node);
			}

			default: {
				return "";
			}
		}
	}

	render() {
		return this.render_node(this.template.ast);
	}
}

export class TemplateEngine {
	templates: Record<string, Template> = {};
	imports:   Record<string, string[]> = {};
	options:   TemplateEngineOptions    = {
		debug:       false,
		skip_static: false,
		context:     {}
	};

	constructor(options?: Partial<TemplateEngineOptions>) {
		if (options) {
			this.options = Object.assign(this.options, options);
		}
	}

	compile(template_name: string, content: string): Template {
		const lexer    = new Lexer(content);
		const tokens   = lexer.tokenize();

		if (this.options.debug) {
			for (const token of tokens) {
				lexer.print_token(token);
			}
		}

		const parser   = new Parser(tokens, this.options);
		const template = parser.parse();

		this.templates[template_name] = template;
		this.imports[template_name]   = template.imports;

		this.check_import_cycles();

		if (this.options.debug) {
			parser.print_node(template.ast);
		}

		return template;
	}

	add(template_name: string, template: Template): Template {
		this.templates[template_name] = template;
		this.imports[template_name]   = template.imports;

		this.check_import_cycles();

		return template;
	}

	get(template_name: string): Template {
		return this.templates[template_name];
	}

	render(name: string, context: Record<string, unknown> = {}): string {
		const template = this.templates[name];

		if (!template) {
			throw new Error(`Template "${name}" not compiled`);
		}

		const renderer = new Renderer(template, this.templates, Object.assign(this.options.context, context));
		const result = renderer.render();

		return result;
	}

	run(template_name: string, content: string, context: Record<string, unknown> = {}): string {
		this.compile(template_name, content);
		return this.render(template_name, context);
	}

	private check_import_cycles(): void {
		const visited_templates = new Set<string>();
		const current_import_path: string[] = [];
		const in_current_path = new Set<string>();
		const path_dfs = (template_name: string): void => {
			if (visited_templates.has(template_name)) {
				return;
			}

			if (in_current_path.has(template_name)) {
				const cycle_start_index = current_import_path.indexOf(template_name);
				const cycle = current_import_path.slice(cycle_start_index);

				cycle.push(template_name);

				throw new Error(`Found import cycle: ${cycle.join(' → ')}`);
			}

			current_import_path.push(template_name);
			in_current_path.add(template_name);

			if (this.imports[template_name]) {
				for (const dependency of this.imports[template_name]) {
					path_dfs(dependency);
				}
			}

			current_import_path.pop();
			in_current_path.delete(template_name);
			visited_templates.add(template_name);
		};

		for (const template_name of Object.keys(this.imports)) {
			if (!visited_templates.has(template_name)) {
				path_dfs(template_name);
			}
		}
	}
}
