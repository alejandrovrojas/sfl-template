const std = @import("std");
const builtin = @import("builtin");

pub const TokenType = enum {
    eof,
    comment,
    text,
    text_css,
    text_js,
    expr_start,
    expr_end,
    js_start,
    js_end,
    css_start,
    css_end,
    for_start,
    for_end,
    for_in,
    if_start,
    if_end,
    else_start,
    switch_start,
    switch_end,
    case_start,
    default_start,
    plus,
    minus,
    multiplication,
    division,
    equal,
    not_equal,
    less_than,
    greater_than,
    less_equal,
    greater_equal,
    logical_and,
    logical_or,
    l_paren,
    r_paren,
    l_bracket,
    r_bracket,
    underscore,
    comma,
    period,
    colon,
    exclamation,
    question_mark,
    boolean,
    string,
    integer,
    float,
    identifier,
    null,
    undefined
};

pub const TokenPosition = struct {
    line: u32,
    column: u32,
};

pub const Token = struct {
    type: TokenType,
    position: TokenPosition,
    value: []const u8,
};

pub const LexerMode = enum {
    comment,
    text,
    js,
    css,
    expr,
};

pub const Lexer = struct {
    input:        []const u8,
    allocator:    std.mem.Allocator,
    cursor:       u32,
    line:         u32,
    column:       u32,
    mode:         LexerMode,
    type:         TokenType,
    prev_mode:    LexerMode,

    pub fn init(input: []const u8, allocator: std.mem.Allocator) Lexer {
        return Lexer{
            .input     = input,
            .allocator = allocator,
            .cursor    = 0,
            .line      = 1,
            .column    = 1,
            .mode      = .text,
            .type      = .text,
            .prev_mode = .text,
        };
    }

    inline fn is_whitespace(ch: u8) bool {
        return (ch == ' ' or ch == '\t' or ch == '\n' or ch == '\r');
    }

    inline fn is_keyword_boundary(ch: u8) bool {
        return is_whitespace(ch) or ch == '}'; // @note -- kind of flaky
    }

    inline fn is_alpha(ch: u8) bool {
        return (ch >= 'a' and ch <= 'z') or (ch >= 'A' and ch <= 'Z') or ch == '_'; // @later -- allow dash?
    }

    inline fn is_numeric(ch: u8) bool {
        return ch >= '0' and ch <= '9';
    }

    inline fn is_alphanumeric(ch: u8) bool {
        return is_alpha(ch) or is_numeric(ch);
    }

    fn current_ch(self: *Lexer) ?u8 {
        if (self.cursor >= self.input.len) {
            return null;
        }

        return self.input[self.cursor];
    }

    fn advance_ch(self: *Lexer) void {
        const ch = self.current_ch();

        if (ch == null) {
            return;
        }

        self.cursor += 1;

        if (ch == '\n') {
            self.line += 1;
            self.column = 1;
        } else {
            self.column += 1;
        }
    }

    pub fn tokenize_lexeme(self: *Lexer) Token {
        while (self.current_ch()) |ch| {
            if (is_whitespace(ch)) {
                self.advance_ch();
            } else {
                break;
            }
        }

        const start_position = TokenPosition{
            .line = self.line,
            .column = self.column,
        };

        if (self.cursor >= self.input.len) {
            return Token{
                .type = .eof,
                .value = "",
                .position = start_position
            };
        }

        const start_cursor = self.cursor;

        while (self.cursor < self.input.len) {
            const ch = self.input[self.cursor];

            if (ch == '\n' or ch == '\r') {
                break;
            }

            if (ch == '/') {
                if (self.cursor + 1 <= self.input.len and self.input[self.cursor + 1] == '/') {
                    self.mode = .comment;
                }
            }

            if (self.mode == .comment) {
                self.type = .comment;

                while (self.current_ch()) |c| {
                    if (c == '\n' or c == '\r') {
                        break;
                    }

                    self.advance_ch();
                }

                self.mode = .text;
                break;
            }

            if (self.mode == .text) {
                self.type = .text;

                if (ch == '<') {
                    // <script>
                    if (self.cursor + 8 <= self.input.len and
                        self.input[self.cursor + 1] == 's' and
                        self.input[self.cursor + 2] == 'c' and
                        self.input[self.cursor + 3] == 'r' and
                        self.input[self.cursor + 4] == 'i' and
                        self.input[self.cursor + 5] == 'p' and
                        self.input[self.cursor + 6] == 't' and
                        self.input[self.cursor + 7] == '>')
                    {
                        if (self.cursor > start_cursor) {
                            break;
                        }

                        self.type = .js_start;

                        inline for (0..8) |_| {
                            self.advance_ch();
                        }

                        self.mode = .js;

                        break;
                    }

                    // <style>
                    if (self.cursor + 7 <= self.input.len and
                        self.input[self.cursor + 1] == 's' and
                        self.input[self.cursor + 2] == 't' and
                        self.input[self.cursor + 3] == 'y' and
                        self.input[self.cursor + 4] == 'l' and
                        self.input[self.cursor + 5] == 'e' and
                        self.input[self.cursor + 6] == '>')
                    {
                        if (self.cursor > start_cursor) {
                            break;
                        }

                        self.type = .css_start;

                        inline for (0..7) |_| {
                            self.advance_ch();
                        }

                        self.mode = .css;

                        break;
                    }
                }

                if (ch == '{') {
                    self.prev_mode = self.mode;
                    self.mode = .expr;

                    break;
                }
            }

            if (self.mode == .css) {
                self.type = .text_css;

                // </style>
                if (self.cursor + 8 <= self.input.len and
                    self.input[self.cursor + 1] == '/' and
                    self.input[self.cursor + 2] == 's' and
                    self.input[self.cursor + 3] == 't' and
                    self.input[self.cursor + 4] == 'y' and
                    self.input[self.cursor + 5] == 'l' and
                    self.input[self.cursor + 6] == 'e' and
                    self.input[self.cursor + 7] == '>')
                {
                    if (self.cursor > start_cursor) {
                        break;
                    }

                    self.type = .css_end;

                    inline for (0..8) |_| {
                        self.advance_ch();
                    }

                    self.mode = .text;

                    break;
                }

                // @{}
                if (ch == '@') {
                    if (self.cursor + 1 <= self.input.len and self.input[self.cursor + 1] == '{') {
                        if (self.cursor > start_cursor) {
                            break;
                        }

                        self.prev_mode = self.mode;
                        self.mode = .expr;

                        break;
                    }
                }
            }

            if (self.mode == .js) {
                self.type = .text_js;

                // </script>
                if (self.cursor + 9 <= self.input.len and
                    self.input[self.cursor + 1] == '/' and
                    self.input[self.cursor + 2] == 's' and
                    self.input[self.cursor + 3] == 'c' and
                    self.input[self.cursor + 4] == 'r' and
                    self.input[self.cursor + 5] == 'i' and
                    self.input[self.cursor + 6] == 'p' and
                    self.input[self.cursor + 7] == 't' and
                    self.input[self.cursor + 8] == '>')
                {
                    if (self.cursor > start_cursor) {
                        break;
                    }

                    self.type = .js_end;

                    inline for (0..9) |_| {
                        self.advance_ch();
                    }

                    self.mode = .text;

                    break;
                }

                // @{}
                if (ch == '@') {
                    if (self.cursor + 1 <= self.input.len and self.input[self.cursor + 1] == '{') {
                        if (self.cursor > start_cursor) {
                            break;
                        }

                        self.prev_mode = self.mode;
                        self.mode = .expr;

                        break;
                    }
                }
            }

            if (self.mode == .expr) {
                if (ch == ' ' or ch == '\t' or ch == '\n' or ch == '\r') {
                    return self.tokenize_lexeme();
                }

                switch (ch) {
                    '@' => {
                        if (self.cursor + 1 <= self.input.len and self.input[self.cursor + 1] == '{') {
                            self.advance_ch();
                            self.advance_ch();
                            self.type = .expr_start;
                            break;
                        }
                    },

                    '{' => {
                        self.advance_ch();
                        self.type = .expr_start;
                        break;
                    },

                    '}' => {
                        self.advance_ch();
                        self.type = .expr_end;
                        self.mode = self.prev_mode;
                        break;
                    },

                    '+' => {
                        self.advance_ch();
                        self.type = .plus;
                        break;
                    },

                    '-' => {
                        self.advance_ch();
                        self.type = .minus;
                        break;
                    },

                    '*' => {
                        self.advance_ch();
                        self.type = .multiplication;
                        break;
                    },

                    '/' => {
                        // {/for}
                        if (self.cursor + 4 <= self.input.len and
                            self.input[self.cursor + 1] == 'f' and
                            self.input[self.cursor + 2] == 'o' and
                            self.input[self.cursor + 3] == 'r')
                        {
                            inline for (0..4) |_| {
                                self.advance_ch();
                            }

                            self.type = .for_end;
                            break;
                        }

                        // {/if}
                        if (self.cursor + 3 <= self.input.len and
                            self.input[self.cursor + 1] == 'i' and
                            self.input[self.cursor + 2] == 'f')
                        {
                            inline for (0..3) |_| {
                                self.advance_ch();
                            }

                            self.type = .if_end;
                            break;
                        }

                        // {/switch}
                        if (self.cursor + 7 <= self.input.len and
                            self.input[self.cursor + 1] == 's' and
                            self.input[self.cursor + 2] == 'w' and
                            self.input[self.cursor + 3] == 'i' and
                            self.input[self.cursor + 4] == 't' and
                            self.input[self.cursor + 5] == 'c' and
                            self.input[self.cursor + 6] == 'h')
                        {
                            inline for (0..7) |_| {
                                self.advance_ch();
                            }

                            self.type = .switch_end;
                            break;
                        }

                        self.advance_ch();
                        self.type = .division;
                        break;
                    },

                    '=' => {
                        if (self.cursor + 2 <= self.input.len and
                            self.input[self.cursor + 1] == '=')
                        {
                            self.advance_ch();
                            self.advance_ch();
                            self.type = .equal;

                            break;
                        }

                        self.advance_ch();
                        self.type = .equal;

                        break;
                    },

                    '!' => {
                        if (self.cursor + 2 <= self.input.len and
                            self.input[self.cursor + 1] == '=')
                        {
                            self.advance_ch();
                            self.advance_ch();
                            self.type = .not_equal;

                            break;
                        }

                        self.advance_ch();
                        self.type = .exclamation;

                        break;
                    },

                    '>' => {
                        if (self.cursor + 2 <= self.input.len and
                            self.input[self.cursor + 1] == '=')
                        {
                            self.advance_ch();
                            self.advance_ch();
                            self.type = .greater_equal;

                            break;
                        }

                        self.advance_ch();
                        self.type = .greater_than;

                        break;
                    },

                    '<' => {
                        if (self.cursor + 2 <= self.input.len and
                            self.input[self.cursor + 1] == '=')
                        {
                            self.advance_ch();
                            self.advance_ch();
                            self.type = .less_equal;

                            break;
                        }

                        self.advance_ch();
                        self.type = .less_than;

                        break;
                    },

                    '|' => {
                        // @later - use "or"?
                        self.advance_ch();
                        self.type = .logical_or;
                        break;
                    },

                    '&' => {
                        // @later - use "and"?
                        self.advance_ch();
                        self.type = .logical_and;
                        break;
                    },

                    '(' => {
                        self.advance_ch();
                        self.type = .l_paren;
                        break;
                    },

                    ')' => {
                        self.advance_ch();
                        self.type = .r_paren;
                        break;
                    },

                    '[' => {
                        self.advance_ch();
                        self.type = .l_bracket;
                        break;
                    },

                    ']' => {
                        self.advance_ch();
                        self.type = .r_bracket;
                        break;
                    },

                    '_' => {
                        self.advance_ch();
                        self.type = .underscore;
                        break;
                    },

                    ',' => {
                        self.advance_ch();
                        self.type = .comma;
                        break;
                    },

                    '.' => {
                        self.advance_ch();
                        self.type = .period;
                        break;
                    },

                    ':' => {
                        self.advance_ch();
                        self.type = .colon;
                        break;
                    },

                    '?' => {
                        self.advance_ch();
                        self.type = .question_mark;
                        break;
                    },

                    else => {
                        // undefined
                        if (self.cursor + 10 <= self.input.len and
                            self.input[self.cursor]     == 'u' and
                            self.input[self.cursor + 1] == 'n' and
                            self.input[self.cursor + 2] == 'd' and
                            self.input[self.cursor + 3] == 'e' and
                            self.input[self.cursor + 4] == 'f' and
                            self.input[self.cursor + 5] == 'i' and
                            self.input[self.cursor + 6] == 'n' and
                            self.input[self.cursor + 7] == 'e' and
                            self.input[self.cursor + 8] == 'd' and
                            is_keyword_boundary(self.input[self.cursor + 9]))
                        {
                            inline for (0..9) |_| {
                                self.advance_ch();
                            }

                            self.type = .undefined;
                            break;
                        }

                        // null
                        if (self.cursor + 5 <= self.input.len and
                            self.input[self.cursor]     == 'n' and
                            self.input[self.cursor + 1] == 'u' and
                            self.input[self.cursor + 2] == 'l' and
                            self.input[self.cursor + 3] == 'l' and
                            is_keyword_boundary(self.input[self.cursor + 4]))
                        {
                            inline for (0..4) |_| {
                                self.advance_ch();
                            }

                            self.type = .null;
                            break;
                        }

                        // true
                        if (self.cursor + 5 <= self.input.len and
                            self.input[self.cursor]     == 't' and
                            self.input[self.cursor + 1] == 'r' and
                            self.input[self.cursor + 2] == 'u' and
                            self.input[self.cursor + 3] == 'e' and
                            is_keyword_boundary(self.input[self.cursor + 4]))
                        {
                            inline for (0..4) |_| {
                                self.advance_ch();
                            }

                            self.type = .boolean;
                            break;
                        }

                        // false
                        if (self.cursor + 6 <= self.input.len and
                            self.input[self.cursor]     == 'f' and
                            self.input[self.cursor + 1] == 'a' and
                            self.input[self.cursor + 2] == 'l' and
                            self.input[self.cursor + 3] == 's' and
                            self.input[self.cursor + 4] == 'e' and
                            is_keyword_boundary(self.input[self.cursor + 5]))
                        {
                            inline for (0..5) |_| {
                                self.advance_ch();
                            }

                            self.type = .boolean;
                            break;
                        }

                        // for
                        if (self.cursor + 4 <= self.input.len and
                            self.input[self.cursor]     == 'f' and
                            self.input[self.cursor + 1] == 'o' and
                            self.input[self.cursor + 2] == 'r' and
                            is_keyword_boundary(self.input[self.cursor + 3]))
                        {
                            inline for (0..3) |_| {
                                self.advance_ch();
                            }

                            self.type = .for_start;
                            break;
                        }

                        // in
                        if (self.cursor + 3 <= self.input.len and
                            self.input[self.cursor]     == 'i' and
                            self.input[self.cursor + 1] == 'n' and
                            is_keyword_boundary(self.input[self.cursor + 2]))
                        {
                            inline for (0..2) |_| {
                                self.advance_ch();
                            }

                            self.type = .for_in;
                            break;
                        }

                        // if
                        if (self.cursor + 3 <= self.input.len and
                            self.input[self.cursor]     == 'i' and
                            self.input[self.cursor + 1] == 'f' and
                            is_keyword_boundary(self.input[self.cursor + 2])
                        )
                        {
                            inline for (0..2) |_| {
                                self.advance_ch();
                            }

                            self.type = .if_start;
                            break;
                        }

                        // {else}
                        if (self.cursor + 5 <= self.input.len and
                            self.input[self.cursor]     == 'e' and
                            self.input[self.cursor + 1] == 'l' and
                            self.input[self.cursor + 2] == 's' and
                            self.input[self.cursor + 3] == 'e' and
                            is_keyword_boundary(self.input[self.cursor + 4])
                        )
                        {
                            inline for (0..4) |_| {
                                self.advance_ch();
                            }

                            self.type = .else_start;
                            break;
                        }

                        // switch
                        if (self.cursor + 7 <= self.input.len and
                            self.input[self.cursor]     == 's' and
                            self.input[self.cursor + 1] == 'w' and
                            self.input[self.cursor + 2] == 'i' and
                            self.input[self.cursor + 3] == 't' and
                            self.input[self.cursor + 4] == 'c' and
                            self.input[self.cursor + 5] == 'h' and
                            is_keyword_boundary(self.input[self.cursor + 6]))
                        {
                            inline for (0..6) |_| {
                                self.advance_ch();
                            }

                            self.type = .switch_start;
                            break;
                        }

                        // case
                        if (self.cursor + 5 <= self.input.len and
                            self.input[self.cursor]     == 'c' and
                            self.input[self.cursor + 1] == 'a' and
                            self.input[self.cursor + 2] == 's' and
                            self.input[self.cursor + 3] == 'e' and
                            is_keyword_boundary(self.input[self.cursor + 4]))
                        {
                            inline for (0..4) |_| {
                                self.advance_ch();
                            }

                            self.type = .case_start;
                            break;
                        }

                        // default
                        if (self.cursor + 8 <= self.input.len and
                            self.input[self.cursor]     == 'd' and
                            self.input[self.cursor + 1] == 'e' and
                            self.input[self.cursor + 2] == 'f' and
                            self.input[self.cursor + 3] == 'a' and
                            self.input[self.cursor + 4] == 'u' and
                            self.input[self.cursor + 5] == 'l' and
                            self.input[self.cursor + 6] == 't' and
                            is_keyword_boundary(self.input[self.cursor + 7]))
                        {
                            inline for (0..7) |_| {
                                self.advance_ch();
                            }

                            self.type = .default_start;
                            break;
                        }

                        // identifiers
                        if (is_alpha(ch)) {
                            while (self.current_ch()) |c| {
                                if (!is_alphanumeric(c)) {
                                    break;
                                }

                                self.advance_ch();
                            }

                            self.type = .identifier;
                            break;
                        }

                        // numbers
                        if (is_numeric(ch)) {
                            self.type = .integer;

                            while (self.current_ch()) |c| {
                                if (is_numeric(c)) {
                                    self.advance_ch();
                                } else if (c == '.' and self.type == .integer) {
                                    if (self.cursor + 1 < self.input.len and is_numeric(self.input[self.cursor + 1])) {
                                        self.type = .float;
                                        self.advance_ch();
                                    } else {
                                        break;
                                    }
                                } else {
                                    break;
                                }
                            }

                            break;
                        }

                        // strings
                        if (ch == '\'' or ch == '"') {
                            const quote = ch;

                            self.advance_ch();

                            while (self.current_ch()) |c| {
                                if (c == quote) {
                                    self.advance_ch();
                                    break;
                                }

                                if (c == '\\') {
                                    self.advance_ch();

                                    if (self.cursor < self.input.len) {
                                        self.advance_ch();
                                    }
                                } else {
                                    self.advance_ch();
                                }
                            }

                            self.type = .string;
                            break;
                        }

                        // @later - throw an error for invalid token?
                    },
                }
            }

            self.advance_ch();
        }

        var token_value = self.input[start_cursor..self.cursor];

        if (token_value.len == 0) {
            return self.tokenize_lexeme();
        }

        if (self.type == .string) {
            token_value = self.input[start_cursor+1..self.cursor-1];
        }

        return Token{
            .type = switch (self.type) {
                .eof            => TokenType.eof,
                .comment        => TokenType.comment,
                .text           => TokenType.text,
                .text_css       => TokenType.text_css,
                .text_js        => TokenType.text_js,
                .expr_start     => TokenType.expr_start,
                .expr_end       => TokenType.expr_end,
                .js_start       => TokenType.js_start,
                .js_end         => TokenType.js_end,
                .css_start      => TokenType.css_start,
                .css_end        => TokenType.css_end,
                .for_start      => TokenType.for_start,
                .for_end        => TokenType.for_end,
                .for_in         => TokenType.for_in,
                .if_start       => TokenType.if_start,
                .if_end         => TokenType.if_end,
                .else_start     => TokenType.else_start,
                .switch_start   => TokenType.switch_start,
                .switch_end     => TokenType.switch_end,
                .case_start     => TokenType.case_start,
                .default_start  => TokenType.default_start,
                .plus           => TokenType.plus,
                .minus          => TokenType.minus,
                .multiplication => TokenType.multiplication,
                .division       => TokenType.division,
                .equal          => TokenType.equal,
                .not_equal      => TokenType.not_equal,
                .less_than      => TokenType.less_than,
                .greater_than   => TokenType.greater_than,
                .less_equal     => TokenType.less_equal,
                .greater_equal  => TokenType.greater_equal,
                .logical_and    => TokenType.logical_and,
                .logical_or     => TokenType.logical_or,
                .l_paren        => TokenType.l_paren,
                .r_paren        => TokenType.r_paren,
                .l_bracket      => TokenType.l_bracket,
                .r_bracket      => TokenType.r_bracket,
                .underscore     => TokenType.underscore,
                .comma          => TokenType.comma,
                .period         => TokenType.period,
                .colon          => TokenType.colon,
                .exclamation    => TokenType.exclamation,
                .question_mark  => TokenType.question_mark,
                .boolean        => TokenType.boolean,
                .string         => TokenType.string,
                .integer        => TokenType.integer,
                .float          => TokenType.float,
                .identifier     => TokenType.identifier,
                .null           => TokenType.null,
                .undefined      => TokenType.undefined,
            },
            .value = token_value,
            .position = start_position,
        };
    }

    pub fn tokenize(self: *Lexer) ![]Token {
        var tokens: std.ArrayList(Token) = .empty;

        while (self.current_ch()) |_| {
            const token = self.tokenize_lexeme();
            try tokens.append(self.allocator, token);
        }

        return try tokens.toOwnedSlice(self.allocator);
    }
};

pub const ParseError = error{
    OutOfMemory,
    UnknownToken,
    UnexpectedToken,
    UnexpectedEndOfInput,
    InvalidExpression,
    InvalidSyntax,
    InvalidBlockStructure,
};

pub const NodeType = enum {
    program,
    block,
    text,
    comment,
    block_if,
    block_switch,
    block_case,
    block_for,
    literal_null,
    literal_int,
    literal_float,
    literal_string,
    literal_boolean,
    expression,
    expression_conditional,
    expression_binary,
    expression_unary,
    identifier,
};

pub const Node = union(NodeType) {
    program:                Program,
    block:                  Block,
    text:                   Text,
    comment:                Comment,
    block_if:               If,
    block_switch:           Switch,
    block_case:             Case,
    block_for:              For,
    literal_null:           LiteralNull,
    literal_int:            LiteralInt,
    literal_float:          LiteralFloat,
    literal_string:         LiteralString,
    literal_boolean:        LiteralBoolean,
    expression:             Expression,
    expression_conditional: ExpressionConditional,
    expression_binary:      ExpressionBinary,
    expression_unary:       ExpressionUnary,
    identifier:             Identifier,
};

pub const Program = struct {
    root: Block,
};

pub const Block = struct {
    block: []Node,
};

pub const Comment = struct {
    value: []const u8,
};

pub const Text = struct {
    value: []const u8,
};

pub const If = struct {
    condition: *Node,
    consequent: Block,
    alternate: ?*Node,
};

pub const Switch = struct {
    expression: *Node,
    cases: []Node,
};

pub const Case = struct {
    values: ?[]*Node,
    body: Block,
};

pub const For = struct {
    iterator: []const u8,
    iterator_index: ?[]const u8,
    iterable: *Node,
    body: Block,
};

pub const LiteralInt = struct {
    value: i64,
};

pub const LiteralFloat = struct {
    value: f64,
};

pub const LiteralString = struct {
    value: []const u8,
};

pub const LiteralBoolean = struct {
    value: bool,
};

pub const LiteralNull = struct {
    value: i8
};

pub const Expression = struct {
    value: *Node,
};

pub const ExpressionConditional = struct {
    condition: *Node,
    consequent: *Node,
    alternate: *Node,
};

pub const ExpressionBinary = struct {
    left: *Node,
    operator: TokenType,
    right: *Node,
};

pub const ExpressionUnary = struct {
    operator: TokenType,
    operand: *Node,
};

pub const Identifier = struct {
    name: []const u8,
};

pub const Parser = struct {
    tokens:        []Token,
    allocator:     std.mem.Allocator,
    cursor:        u32,

    pub fn init(tokens: []Token, allocator: std.mem.Allocator) Parser {
        const parser = Parser{
            .tokens    = tokens,
            .allocator = allocator,
            .cursor    = 0
        };

        return parser;
    }

    fn current_token(self: *Parser) ?Token {
        if (self.cursor >= self.tokens.len) {
            return null;
        }

        return self.tokens[self.cursor];
    }

    fn peek_token(self: *Parser) ?Token {
        if (self.cursor + 1 >= self.tokens.len) {
            return null;
        }

        return self.tokens[self.cursor + 1];
    }

    fn advance_token(self: *Parser) void {
        if (self.cursor < self.tokens.len) {
            self.cursor += 1;
        }
    }

    fn expect_token(self: *Parser, expected_type: TokenType) ParseError!void {
        const token = self.current_token() orelse {
            return ParseError.UnexpectedEndOfInput;
        };

        if (token.type != expected_type) {
            std.debug.print("{s}, {any}", .{ token.value, token.type });
            return ParseError.UnexpectedToken;
        }

        self.advance_token();
    }

    fn is_current_token(self: *Parser, token_type: TokenType) bool {
        if (self.current_token()) |token| {
            return token.type == token_type;
        }

        return false;
    }

    fn is_current_token_any(self: *Parser, token_types: []const TokenType) bool {
        if (self.current_token()) |token| {
            for (token_types) |token_type| {
                if (token.type == token_type) {
                    return true;
                }
            }
        }

        return false;
    }

    fn parse_text(_: *Parser, token: Token) Node {
        return Node{
            .text = Text{
                .value = token.value,
            },
        };
    }

    fn parse_comment(_: *Parser, token: Token) Node {
        return Node{
            .comment = Comment{
                .value = token.value,
            },
        };
    }

    fn parse_if_block(self: *Parser) ParseError!Node {
        return self.parse_if_sequence(false);
    }

    fn parse_if_sequence(self: *Parser, is_nested: bool) ParseError!Node {
        // @note -- omit self.expect_token(.expr_start) because this could be an else-if block
        try self.expect_token(.if_start);

        const condition = try self.parse_expression();

        try self.expect_token(.expr_end);

        const end_tokens = [_]TokenType{
            .else_start,
            .if_end
        };

        const consequent = Block{
            .block = try self.parse_until(&end_tokens)
        };

        var alternate: ?*Node = null;

        if (self.is_current_token(.expr_start)) {
            const next = self.peek_token();

            if (next) |next_token| {
                if (next_token.type == .else_start) {
                    self.advance_token();

                    const else_block = try self.allocator.create(Node);

                    else_block.* = try self.parse_else_block();
                    alternate = else_block;
                }
            }
        }

        if (!is_nested) {
            try self.expect_token(.expr_start);
            try self.expect_token(.if_end);
            try self.expect_token(.expr_end);
        }

        return Node{
            .block_if = If{
                .condition = condition,
                .consequent = consequent,
                .alternate = alternate,
            },
        };
    }

    fn parse_else_block(self: *Parser) ParseError!Node {
        try self.expect_token(.else_start);

        if (self.is_current_token(.if_start)) {
            return try self.parse_if_sequence(true);
        }

        try self.expect_token(.expr_end);

        const end_tokens = [_]TokenType{
            .if_end
        };

        const body_nodes = try self.parse_until(&end_tokens);

        return Node{
            .block = Block{
                .block = body_nodes,
            },
        };
    }

    fn parse_expression(self: *Parser) ParseError!*Node {
        return self.parse_conditional_expression();
    }

    fn parse_conditional_expression(self: *Parser) ParseError!*Node {
        const left = try self.parse_logical_or();

        while (self.current_token()) |token| {
            if (token.type != .question_mark) {
                break;
            }

            self.advance_token();

            const consequent = try self.parse_expression();

            try self.expect_token(.colon);

            const alternate = try self.parse_expression();
            const conditional = try self.allocator.create(Node);

            conditional.* = Node{
                .expression_conditional = ExpressionConditional{
                    .condition = left,
                    .consequent = consequent,
                    .alternate = alternate,
                }
            };

            return conditional;
        }

        return left;
    }

    fn parse_binary_expression(self: *Parser, operators: []const TokenType, subexpression: fn(p: *Parser) ParseError!*Node) ParseError!*Node {
        var left = try subexpression(self);

        while (self.current_token()) |token| {
            if (!self.is_current_token_any(operators)) {
                break;
            }

            const operator = token.type;

            self.advance_token();

            const right = try subexpression(self);
            const binary = try self.allocator.create(Node);

            binary.* = Node{
                .expression_binary = ExpressionBinary{
                    .left = left,
                    .operator = operator,
                    .right = right
                }
            };

            left = binary;
        }

        return left;
    }

    fn parse_logical_or(self: *Parser) ParseError!*Node {
        const operators = [_]TokenType{
            .logical_or
        };

        return self.parse_binary_expression(&operators, parse_logical_and);
    }

    fn parse_logical_and(self: *Parser) ParseError!*Node {
        const operators = [_]TokenType{
            .logical_and
        };

        return self.parse_binary_expression(&operators, parse_equality);
    }

    fn parse_equality(self: *Parser) ParseError!*Node {
        const operators = [_]TokenType{
            .equal,
            .not_equal
        };

        return self.parse_binary_expression(&operators, parse_relational);
    }

    fn parse_relational(self: *Parser) ParseError!*Node {
        const operators = [_]TokenType{
            .less_than,
            .greater_than,
            .less_equal,
            .greater_equal
        };

        return self.parse_binary_expression(&operators, parse_additive);
    }

    fn parse_additive(self: *Parser) ParseError!*Node {
        const operators = [_]TokenType{
            .plus,
            .minus,
        };

        return self.parse_binary_expression(&operators, parse_multiplicative);
    }

    fn parse_multiplicative(self: *Parser) ParseError!*Node {
        const operators = [_]TokenType{
            .multiplication,
            .division,
        };

        return self.parse_binary_expression(&operators, parse_unary);
    }

    fn parse_unary(self: *Parser) ParseError!*Node {
        if (self.current_token()) |token| {
            if (token.type == .minus or token.type == .exclamation) {
                const operator = token.type;

                self.advance_token();

                const operand = try self.parse_unary();
                const unary = try self.allocator.create(Node);

                unary.* = Node{
                    .expression_unary = ExpressionUnary{
                        .operator = operator,
                        .operand = operand,
                    }
                };

                return unary;
            }
        }

        return self.parse_primary();
    }

    fn parse_primary(self: *Parser) ParseError!*Node {
        if (self.current_token()) |token| {
            switch (token.type) {
                .null => {
                    self.advance_token();

                    const node = try self.allocator.create(Node);

                    node.* = Node{
                        .literal_null = LiteralNull{
                            .value = 0
                        }
                    };

                    return node;
                },

                .integer => {
                    self.advance_token();

                    const node = try self.allocator.create(Node);

                    node.* = Node{
                        .literal_int = LiteralInt{
                            .value = std.fmt.parseInt(i64, token.value, 10) catch {
                                return ParseError.InvalidSyntax;
                            }
                        }
                    };

                    return node;
                },

                .float => {
                    self.advance_token();

                    const node = try self.allocator.create(Node);

                    node.* = Node{
                        .literal_float = LiteralFloat{
                            .value = std.fmt.parseFloat(f64, token.value) catch {
                                return ParseError.InvalidSyntax;
                            }
                        }
                    };

                    return node;
                },

                .string => {
                    self.advance_token();

                    const node = try self.allocator.create(Node);

                    node.* = Node{
                        .literal_string = LiteralString{
                            .value = token.value
                        }
                    };

                    return node;
                },

                .boolean => {
                    self.advance_token();

                    const node = try self.allocator.create(Node);

                    node.* = Node{
                        .literal_boolean = LiteralBoolean{
                            .value = std.mem.eql(u8, token.value, "true")
                        }
                    };

                    return node;
                },

                .identifier => {
                    self.advance_token();

                    const node = try self.allocator.create(Node);

                    node.* = Node{
                        .identifier = Identifier{
                            .name = token.value
                        }
                    };

                    return node;
                },

                .l_paren => {
                    self.advance_token();

                    const expr = try self.parse_expression();

                    try self.expect_token(.r_paren);

                    return expr;
                },

                else => {
                    return ParseError.UnexpectedToken;
                },
            }
        }

        return ParseError.UnexpectedEndOfInput;
    }

    fn parse_switch_block(self: *Parser) ParseError!Node {
        try self.expect_token(.switch_start);

        const expression = try self.parse_expression();

        try self.expect_token(.expr_end);

        var cases: std.ArrayList(Node) = .empty;

        while (self.current_token()) |_| {
            const next = self.peek_token();

            if (next) |next_token| {
                if (next_token.type == .switch_end) {
                    try self.expect_token(.expr_start);
                    try self.expect_token(.switch_end);
                    try self.expect_token(.expr_end);
                    break;
                }

                if (next_token.type == .case_start) {
                    self.advance_token();
                    try cases.append(self.allocator, try self.parse_case_block());
                } else if (next_token.type == .default_start) {
                    self.advance_token();
                    try cases.append(self.allocator, try self.parse_default_block());
                } else {
                    self.advance_token();
                    return ParseError.UnexpectedToken;
                }
            } else {
                return ParseError.UnexpectedEndOfInput;
            }
        }

        return Node{
            .block_switch = Switch{
                .expression = expression,
                .cases = try cases.toOwnedSlice(self.allocator),
            },
        };
    }

    fn parse_case_block(self: *Parser) ParseError!Node {
        try self.expect_token(.case_start);

        var case_values: std.ArrayList(*Node) = .empty;

        while (self.current_token()) |token| {
            if (token.type == .expr_end) {
                break;
            }

            const expr = try self.parse_expression();

            try case_values.append(self.allocator, expr);

            if (self.is_current_token(.comma)) {
                self.advance_token();
            }
        }

        try self.expect_token(.expr_end);

        const body_nodes = try self.parse_until(&[_]TokenType{
            .case_start,
            .default_start,
            .switch_end
        });

        return Node{
            .block_case = Case{
                .values = try case_values.toOwnedSlice(self.allocator),
                .body = Block{
                    .block = body_nodes
                },
            },
        };
    }

    fn parse_default_block(self: *Parser) ParseError!Node {
        try self.expect_token(.default_start);
        try self.expect_token(.expr_end);

        const body_nodes = try self.parse_until(&[_]TokenType{
            .switch_end
        });

        return Node{
            .block_case = Case{
                .values = null,
                .body = Block{
                    .block = body_nodes,
                },
            },
        };
    }

    fn parse_for_block(self: *Parser) ParseError!Node {
        try self.expect_token(.for_start);

        var iterator: []const u8 = "";

        if (self.current_token()) |token| {
            if (token.type == .identifier) {
                iterator = token.value;
                self.advance_token();
            } else {
                return ParseError.UnexpectedToken;
            }
        }

        var iterator_index: ?[]const u8 = null;

        if (self.is_current_token(.comma)) {
            self.advance_token();

            if (self.current_token()) |token| {
                if (token.type == .identifier) {
                    iterator_index = token.value;
                    self.advance_token();
                } else {
                    return ParseError.UnexpectedToken;
                }
            }
        }

        try self.expect_token(.for_in);

        const iterable = try self.parse_expression();

        try self.expect_token(.expr_end);

        const body_nodes = try self.parse_until(&[_]TokenType{
            .for_end
        });

        try self.expect_token(.expr_start);
        try self.expect_token(.for_end);
        try self.expect_token(.expr_end);

        return Node{
            .block_for = For{
                .iterator = iterator,
                .iterator_index = iterator_index,
                .iterable = iterable,
                .body = Block{ .block = body_nodes },
            },
        };
    }

    fn parse_expression_block(self: *Parser) ParseError!Node {
        const expression = try self.parse_expression();
        try self.expect_token(.expr_end);

        return Node{
            .expression = Expression{
                .value = expression,
            },
        };
    }

    fn parse_until(self: *Parser, end_tokens: []const TokenType) ParseError![]Node {
        var nodes = std.ArrayList(Node){};

        while (self.current_token()) |_| {
            const next = self.peek_token();

            if (next) |next_token| {
                for (end_tokens) |end_token| {
                    if (next_token.type == end_token) {
                        return try nodes.toOwnedSlice(self.allocator);
                    }
                }
            }

            const node = try self.parse_statement();
            try nodes.append(self.allocator, node);
        }

        return ParseError.UnexpectedEndOfInput;
    }

    fn parse_statement(self: *Parser) ParseError!Node {
        const token = self.current_token() orelse {
            return ParseError.UnexpectedEndOfInput;
        };

        switch (token.type) {
            .comment => {
                self.advance_token();
                return self.parse_comment(token);
            },

            .text => {
                self.advance_token();
                return self.parse_text(token);
            },

            .text_css => {
                self.advance_token();
                return self.parse_text(token);
            },

            .text_js => {
                self.advance_token();
                return self.parse_text(token);
            },

            .css_start => {
                self.advance_token();
                return self.parse_text(token);
            },

            .css_end => {
                self.advance_token();
                return self.parse_text(token);
            },

            .js_start => {
                self.advance_token();
                return self.parse_text(token);
            },

            .js_end => {
                self.advance_token();
                return self.parse_text(token);
            },

            .expr_start => {
                const next = self.peek_token();

                if (next) |next_token| {
                    switch (next_token.type) {
                        .if_start => {
                            self.advance_token();
                            return try self.parse_if_block();
                        },

                        .else_start => {
                            self.advance_token();
                            return try self.parse_else_block();
                        },

                        .switch_start => {
                            self.advance_token();
                            return try self.parse_switch_block();
                        },

                        .for_start => {
                            self.advance_token();
                            return try self.parse_for_block();
                        },

                        else => {
                            self.advance_token();
                            return try self.parse_expression_block();
                        },
                    }
                } else {
                    self.advance_token();
                    return ParseError.UnexpectedEndOfInput;
                }
            },

            else => {
                self.advance_token();
                return ParseError.UnknownToken;
            },
        }
    }

    pub fn parse(self: *Parser) ParseError!Node {
        var nodes: std.ArrayList(Node) = .empty;

        while (self.current_token()) |_| {
            const node = try self.parse_statement();
            try nodes.append(self.allocator, node);
        }

        return Node{
            .program = Program{
                .root = Block{
                    .block = try nodes.toOwnedSlice(self.allocator)
                }
            },
        };
    }
};

pub fn main() void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();

    var arena = std.heap.ArenaAllocator.init(gpa.allocator());
    defer arena.deinit();

    const allocator = arena.allocator();

    const input = \\
        \\ // tags
        \\ <style>
        \\   html {
        \\     color: ${value};
        \\   }
        \\ </style>
        \\ 
        \\ <script>
        \\   if (true) {
        \\     const test = ${value};
        \\   }
        \\ </script>
        \\ 
        \\ // expressions
        \\ <div>{2 + 2}</div>
        \\ <div>{2 + 2 == 4 ? 'yes' : 'no'}</div>
        \\ <div>{item}</div>
        \\ <div>{item.id}</div>
        \\ <div>{item[var].id}</div>
        \\ 
        \\ // loop
        \\ {for item, index in items}
        \\     <!-- ... -->
        \\ {/for}
        \\ 
        \\ // if block
        \\ {if condition}
        \\     <!-- ... -->
        \\ {else if condition_2}
        \\     <!-- ... -->
        \\ {else}
        \\     <!-- ... -->
        \\ {/if}
        \\ 
        \\ // switch block
        \\ {switch var}
        \\   {case 2 + 2}
        \\     <!-- ... -->
        \\ 
        \\   {case 'test_1', 'test_2'}
        \\     <!-- ... -->
        \\ 
        \\   {default}
        \\     <!-- ... -->
        \\ {/switch}
    ;

    var lexer = Lexer.init(input, allocator);

    const tokens = lexer.tokenize() catch |err| {
        std.debug.print("Lexer error: {}\n", .{err});
        return;
    };

    var parser = Parser.init(tokens, allocator);

    _ = parser.parse() catch |err| switch (err) {
        ParseError.OutOfMemory => {
            std.debug.print("Parse error: Out of memory\n", .{});
            return;
        },

        ParseError.UnknownToken => {
            std.debug.print("Parse error: Unknown token\n", .{});
            return;
        },

        ParseError.UnexpectedToken => {
            std.debug.print("Parse error: Unexpected token encountered\n", .{});
            return;
        },

        ParseError.UnexpectedEndOfInput => {
            std.debug.print("Parse error: Unexpected end of input\n", .{});
            return;
        },

        ParseError.InvalidExpression => {
            std.debug.print("Parse error: Unsupported expression syntax\n", .{});
            return;
        },

        ParseError.InvalidSyntax => {
            std.debug.print("Parse error: Invalid syntax\n", .{});
            return;
        },

        ParseError.InvalidBlockStructure => {
            std.debug.print("Parse error: Invalid block structure\n", .{});
            return;
        },
    };
}
