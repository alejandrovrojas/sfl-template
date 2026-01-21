const std = @import("std");
const builtin = @import("builtin");
const print = std.debug.print;
const allocator = if (builtin.target.cpu.arch == .wasm32)
    std.heap.wasm_allocator
else
    std.heap.page_allocator;

export fn wasm_alloc(size: usize) [*]u8 {
    const buf = allocator.alloc(u8, size) catch unreachable;
    return buf.ptr;
}

export fn wasm_free(ptr: [*]u8, size: usize) void {
    const slice = ptr[0..size];
    allocator.free(slice);
}

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
    input: []const u8,
    input_length: usize,
    cursor: usize,
    line: u32,
    column: u32,
    mode: LexerMode,
    type: TokenType,
    prev_mode: LexerMode,

    pub fn init(input: []const u8) Lexer {
        return Lexer{
            .input         = input,
            .input_length  = input.len,
            .cursor        = 0,
            .line          = 1,
            .column        = 1,
            .mode          = .text,
            .type          = .text,
            .prev_mode     = .text,
        };
    }

    pub fn debug(self: *Lexer) void {
        while (true) {
            const token = self.next_token();

            print("{:>2}:{:<5} {s:<15} {s}\n", .{
                token.position.line,
                token.position.column,
                @tagName(token.type),
                token.value,
            });

            if (token.type == .eof) {
                break;
            }
        }
    }

    inline fn peek(self: *Lexer) ?u8 {
        if (self.cursor >= self.input_length) {
            return null;
        }

        return self.input[self.cursor];
    }

    inline fn next(self: *Lexer) void {
        const ch = self.peek();

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

    inline fn get_position(self: *Lexer) TokenPosition {
        return TokenPosition{
            .line   = self.line,
            .column = self.column,
        };
    }

    inline fn is_alpha(ch: u8) bool {
        return (ch >= 'a' and ch <= 'z') or (ch >= 'A' and ch <= 'Z') or ch == '_';
    }

    inline fn is_numeric(ch: u8) bool {
        return ch >= '0' and ch <= '9';
    }

    inline fn is_alphanumeric(ch: u8) bool {
        return is_alpha(ch) or is_numeric(ch);
    }

    pub fn next_token(self: *Lexer) Token {
        while (self.peek()) |ch| {
            if (ch == ' ' or ch == '\t' or ch == '\n' or ch == '\r') {
                self.next();
            } else {
                break;
            }
        }

        const start_position = self.get_position();

        if (self.cursor >= self.input_length) {
            return Token{
                .type = .eof,
                .value = "",
                .position = start_position
            };
        }

        const start_cursor = self.cursor;

        while (self.cursor < self.input_length) {
            const ch = self.input[self.cursor];

            if (ch == '\n' or ch == '\r') {
                break;
            }

            if (ch == '/') {
                if (self.cursor + 1 <= self.input_length and self.input[self.cursor + 1] == '/') {
                    self.mode = .comment;
                }
            }

            if (self.mode == .comment) {
                self.type = .comment;

                while (self.peek()) |c| {
                    if (c == '\n' or c == '\r') {
                        break;
                    }

                    self.next();
                }

                self.mode = .text;
                break;
            }

            if (self.mode == .text) {
                self.type = .text;

                if (ch == '<') {
                    // <script>
                    if (self.cursor + 8 <= self.input_length and
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
                            self.next();
                        }

                        self.mode = .js;

                        break;
                    }

                    // <style>
                    if (self.cursor + 7 <= self.input_length and
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
                            self.next();
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
                if (self.cursor + 8 <= self.input_length and
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
                        self.next();
                    }

                    self.mode = .text;

                    break;
                }

                // @{}
                if (ch == '@') {
                    if (self.cursor + 1 <= self.input_length and self.input[self.cursor + 1] == '{') {
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
                if (self.cursor + 9 <= self.input_length and
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
                        self.next();
                    }

                    self.mode = .text;

                    break;
                }

                // @{}
                if (ch == '@') {
                    if (self.cursor + 1 <= self.input_length and self.input[self.cursor + 1] == '{') {
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
                    return self.next_token();
                }

                switch(ch) {
                    '@' => {
                        if (self.cursor + 1 <= self.input_length and self.input[self.cursor + 1] == '{') {
                            self.next();
                            self.next();
                            self.type = .expr_start;
                            break;
                        }
                    },

                    '{' => {
                        self.next();
                        self.type = .expr_start;
                        break;
                    },

                    '}' => {
                        self.next();
                        self.type = .expr_end;
                        self.mode = self.prev_mode;
                        break;
                    },

                    '+' => {
                        self.next();
                        self.type = .plus;
                        break;
                    },

                    '-' => {
                        self.next();
                        self.type = .minus;
                        break;
                    },

                    '*' => {
                        self.next();
                        self.type = .multiplication;
                        break;
                    },

                    '/' => {
                        // {/for}
                        if (self.cursor + 4 <= self.input_length and
                            self.input[self.cursor + 1] == 'f' and
                            self.input[self.cursor + 2] == 'o' and
                            self.input[self.cursor + 3] == 'r')
                        {
                            inline for (0..4) |_| {
                                self.next();
                            }

                            self.type = .for_end;
                            break;
                        }

                        // {/if}
                        if (self.cursor + 3 <= self.input_length and
                            self.input[self.cursor + 1] == 'i' and
                            self.input[self.cursor + 2] == 'f')
                        {
                            inline for (0..3) |_| {
                                self.next();
                            }

                            self.type = .if_end;
                            break;
                        }

                        // {/switch}
                        if (self.cursor + 7 <= self.input_length and
                            self.input[self.cursor + 1] == 's' and
                            self.input[self.cursor + 2] == 'w' and
                            self.input[self.cursor + 3] == 'i' and
                            self.input[self.cursor + 4] == 't' and
                            self.input[self.cursor + 5] == 'c' and
                            self.input[self.cursor + 6] == 'h')
                        {
                            inline for (0..7) |_| {
                                self.next();
                            }

                            self.type = .switch_end;
                            break;
                        }

                        self.next();
                        self.type = .division;
                        break;
                    },

                    '=' => {
                        if (self.cursor + 2 <= self.input_length and
                            self.input[self.cursor + 1] == '=')
                        {
                            self.next();
                            self.next();
                            self.type = .equal;

                            break;
                        }

                        self.next();
                        self.type = .equal;

                        break;
                    },

                    '!' => {
                        if (self.cursor + 2 <= self.input_length and
                            self.input[self.cursor + 1] == '=')
                        {
                            self.next();
                            self.next();
                            self.type = .not_equal;

                            break;
                        }

                        self.next();
                        self.type = .exclamation;

                        break;
                    },

                    '>' => {
                        if (self.cursor + 2 <= self.input_length and
                            self.input[self.cursor + 1] == '=')
                        {
                            self.next();
                            self.next();
                            self.type = .greater_equal;

                            break;
                        }

                        self.next();
                        self.type = .greater_than;

                        break;
                    },

                    '<' => {
                        if (self.cursor + 2 <= self.input_length and
                            self.input[self.cursor + 1] == '=')
                        {
                            self.next();
                            self.next();
                            self.type = .less_equal;

                            break;
                        }

                        self.next();
                        self.type = .less_than;

                        break;
                    },

                    '|' => {
                        // @later - use "or"?
                        self.next();
                        self.type = .logical_or;
                        break;
                    },

                    '&' => {
                        // @later - use "and"?
                        self.next();
                        self.type = .logical_and;
                        break;
                    },

                    '(' => {
                        self.next();
                        self.type = .l_paren;
                        break;
                    },

                    ')' => {
                        self.next();
                        self.type = .r_paren;
                        break;
                    },

                    '[' => {
                        self.next();
                        self.type = .l_bracket;
                        break;
                    },

                    ']' => {
                        self.next();
                        self.type = .r_bracket;
                        break;
                    },

                    '_' => {
                        self.next();
                        self.type = .underscore;
                        break;
                    },

                    ',' => {
                        self.next();
                        self.type = .comma;
                        break;
                    },

                    '.' => {
                        self.next();
                        self.type = .period;
                        break;
                    },

                    ':' => {
                        self.next();
                        self.type = .colon;
                        break;
                    },

                    '?' => {
                        self.next();
                        self.type = .question_mark;
                        break;
                    },

                    else => {
                        // undefined
                        if (ch == 'u' and 
                            self.cursor + 9 <= self.input_length and
                            self.input[self.cursor + 1] == 'n' and
                            self.input[self.cursor + 2] == 'd' and
                            self.input[self.cursor + 3] == 'e' and
                            self.input[self.cursor + 4] == 'f' and
                            self.input[self.cursor + 5] == 'i' and
                            self.input[self.cursor + 6] == 'n' and
                            self.input[self.cursor + 7] == 'e' and
                            self.input[self.cursor + 8] == 'd')
                        {
                            inline for (0..9) |_| {
                                self.next();
                            }

                            self.type = .undefined;
                            break;
                        }

                        // null
                        if (ch == 'n' and 
                            self.cursor + 4 <= self.input_length and
                            self.input[self.cursor + 1] == 'u' and
                            self.input[self.cursor + 2] == 'l' and
                            self.input[self.cursor + 3] == 'l')
                        {
                            inline for (0..4) |_| {
                                self.next();
                            }

                            self.type = .null;
                            break;
                        }

                        // true
                        if (ch == 't' and 
                            self.cursor + 4 <= self.input_length and
                            self.input[self.cursor + 1] == 'r' and
                            self.input[self.cursor + 2] == 'u' and
                            self.input[self.cursor + 3] == 'e')
                        {
                            inline for (0..4) |_| {
                                self.next();
                            }

                            self.type = .boolean;
                            break;
                        }

                        // false
                        if (ch == 'f' and 
                            self.cursor + 5 <= self.input_length and
                            self.input[self.cursor + 1] == 'a' and
                            self.input[self.cursor + 2] == 'l' and
                            self.input[self.cursor + 3] == 's' and
                            self.input[self.cursor + 4] == 'e')
                        {
                            inline for (0..5) |_| {
                                self.next();
                            }

                            self.type = .boolean;
                            break;
                        }

                        // for
                        if (ch == 'f' and 
                            self.cursor + 3 <= self.input_length and
                            self.input[self.cursor + 1] == 'o' and
                            self.input[self.cursor + 2] == 'r')
                        {
                            inline for (0..3) |_| {
                                self.next();
                            }

                            self.type = .for_start;
                            break;
                        }

                        // in
                        if (ch == 'i' and 
                            self.cursor + 2 <= self.input_length and
                            self.input[self.cursor + 1] == 'n')
                        {
                            inline for (0..2) |_| {
                                self.next();
                            }

                            self.type = .for_in;
                            break;
                        }

                        // if
                        if (ch == 'i' and 
                            self.cursor + 2 <= self.input_length and
                            self.input[self.cursor + 1] == 'f')
                        {
                            inline for (0..2) |_| {
                                self.next();
                            }

                            self.type = .if_start;
                            break;
                        }

                        // {else}
                        if (self.cursor + 5 <= self.input_length and
                            self.input[self.cursor + 1] == 'e' and
                            self.input[self.cursor + 2] == 'l' and
                            self.input[self.cursor + 3] == 's' and
                            self.input[self.cursor + 4] == 'e')
                        {
                            inline for (0..5) |_| {
                                self.next();
                            }

                            self.type = .else_start;
                            break;
                        }

                        // {switch}
                        if (self.cursor + 7 <= self.input_length and
                            self.input[self.cursor + 1] == 's' and
                            self.input[self.cursor + 2] == 'w' and
                            self.input[self.cursor + 3] == 'i' and
                            self.input[self.cursor + 4] == 't' and
                            self.input[self.cursor + 5] == 'c' and
                            self.input[self.cursor + 6] == 'h')
                        {
                            inline for (0..7) |_| {
                                self.next();
                            }

                            self.type = .switch_end;
                            break;
                        }

                        // {case}
                        if (self.cursor + 5 <= self.input_length and
                            self.input[self.cursor + 1] == 'c' and
                            self.input[self.cursor + 2] == 'a' and
                            self.input[self.cursor + 3] == 's' and
                            self.input[self.cursor + 4] == 'e')
                        {
                            inline for (0..5) |_| {
                                self.next();
                            }

                            self.type = .case_start;
                            break;
                        }

                        // {default}
                        if (self.cursor + 8 <= self.input_length and
                            self.input[self.cursor + 1] == 'd' and
                            self.input[self.cursor + 2] == 'e' and
                            self.input[self.cursor + 3] == 'f' and
                            self.input[self.cursor + 4] == 'a' and
                            self.input[self.cursor + 5] == 'u' and
                            self.input[self.cursor + 6] == 'l' and
                            self.input[self.cursor + 7] == 't')
                        {
                            inline for (0..8) |_| {
                                self.next();
                            }

                            self.type = .default_start;
                            break;
                        }

                        // identifiers
                        if (is_alpha(ch)) {
                            while (self.peek()) |c| {
                                if (!is_alphanumeric(c)) {
                                    break;
                                }

                                self.next();
                            }

                            self.type = .identifier;
                            break;
                        }

                        // numbers
                        if (is_numeric(ch)) {
                            self.type = .integer;

                            while (self.peek()) |c| {
                                if (is_numeric(c)) {
                                    self.next();
                                } else if (c == '.' and self.type == .integer) {
                                    if (self.cursor + 1 < self.input_length and is_numeric(self.input[self.cursor + 1])) {
                                        self.type = .float;
                                        self.next();
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

                            self.next();
                            
                            while (self.peek()) |c| {
                                if (c == quote) {
                                    self.next();
                                    break;
                                }

                                if (c == '\\') {
                                    self.next();

                                    if (self.peek()) |_| {
                                        self.next();
                                    }
                                } else {
                                    self.next();
                                }
                            }
                            
                            self.type = .string;
                            break;
                        }

                        // @later - throw an error for invalid token?
                    }
                }
            }

            self.next();
        }

        const token_value = self.input[start_cursor..self.cursor];

        if (token_value.len == 0) {
            return self.next_token();
        }

        return Token{
            .type = switch(self.type) {
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
            .position = start_position
        };
    }
};

pub fn main() void {
    const test_input =
        \\// expression @{}
        \\<style>
        \\    html {
        \\        color: @{value};
        \\    }
        \\</style>
        \\
        \\// expression @{}
        \\<script>
        \\    if (true) {
        \\        const test = @{value};
        \\    }
        \\</script>
        \\
        \\// expressions
        \\<div>{99.9 + 2.5123}</div>
        \\<div>{2 + 2 == null | a == undefined ? true : false }</div>
        \\<div>{thing & other ? 'yes' : 'no'}</div>
        \\<div>{item | that}</div>
        \\<div>{item.id}</div>
        \\<div>{item[var].id}</div>
        \\
        \\// loop
        \\{for item, index in items}
        \\        <!-- ... -->
        \\{/for}
        \\
        \\// if block
        \\{if a >= 10}
        \\        <!-- if a -->
        \\{else if other == !true | thing.a > 10 & misc[0] >= "test"}
        \\        <!-- else if -->
        \\{else}
        \\        <!-- else -->
        \\{/if}
        \\
        \\// switch block
        \\{switch var}
        \\    {case 2 + 2}
        \\        <!-- case -->
        \\    
        \\    {case 'test_1', 'test_2'}
        \\        <!-- case -->
        \\
        \\    {default}
        \\        <!-- default -->
        \\{/switch}
    ;

    var lexer = Lexer.init(test_input);
    lexer.debug();
}

export fn lex(input_ptr: [*]const u8, input_len: usize) u64 {
    const prefix = "test_";
    const total_len = prefix.len + input_len;

    const result_buf = allocator.alloc(u8, total_len) catch unreachable;

    @memcpy(result_buf[0..prefix.len], prefix);
    @memcpy(result_buf[prefix.len..], input_ptr[0..input_len]);

    return (@as(u64, @intFromPtr(result_buf.ptr)) << 32) | @as(u64, total_len);
}
