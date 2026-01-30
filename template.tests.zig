const std = @import("std");
const testing = std.testing;
const print = std.debug.print;
const template = @import("template.main.zig");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

const full_syntax_input =
    \\// expression
    \\<style>
    \\    html {
    \\        color: ${value};
    \\    }
    \\</style>
    \\
    \\// expression
    \\<script>
    \\    if (true) {
    \\        const test = ${value};
    \\    }
    \\</script>
    \\
    \\// expressions
    \\<div>{2 + 2}</div>
    \\<div>{2 + 2 == 4 ? 'yes' : 'no'}</div>
    \\<div>{item}</div>
    \\<div>{item.id}</div>
    \\<div>{item[var].id}</div>
    \\
    \\// loop
    \\{for item, index in items}
    \\    <!-- ... -->
    \\{/for}
    \\
    \\// if block
    \\{if condition}
    \\    <!-- ... -->
    \\{else if condition_2}
    \\    <!-- ... -->
    \\{else}
    \\    <!-- ... -->
    \\{/if}
    \\
    \\// switch block
    \\{switch var}
    \\    {case 2 + 2}
    \\        <!-- ... -->
    \\
    \\    {case 'test_1', 'test_2'}
    \\        <!-- ... -->
    \\
    \\    {default}
    \\        <!-- ... -->
    \\{/switch}
;

test "basic" {
    const test_input = "test 123";

    var lexer = template.Lexer.init(test_input, allocator);
    const token = lexer.tokenize_lexeme();

    try testing.expect(token.type == .text);
    try testing.expectEqualStrings("test 123", token.value);
}

test "expression: arithmetic" {
    const test_input = "{2 + 2}";

    var lexer = template.Lexer.init(test_input, allocator);

    var token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_start);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .integer);
    try testing.expectEqualStrings("2", token.value);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .plus);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .integer);
    try testing.expectEqualStrings("2", token.value);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_end);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .eof);
}

test "expression: property access" {
    const test_input = "{item.id}";

    var lexer = template.Lexer.init(test_input, allocator);

    var token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_start);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .identifier);
    try testing.expectEqualStrings("item", token.value);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .period);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .identifier);
    try testing.expectEqualStrings("id", token.value);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_end);
}

test "for loop" {
    const test_input = "{for item in items}";

    var lexer = template.Lexer.init(test_input, allocator);

    var token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_start);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .for_start);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .identifier);
    try testing.expectEqualStrings("item", token.value);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .for_in);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .identifier);
    try testing.expectEqualStrings("items", token.value);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_end);
}

test "if block" {
    const test_input = "{if a >= 10}";

    var lexer = template.Lexer.init(test_input, allocator);

    var token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_start);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .if_start);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .identifier);
    try testing.expectEqualStrings("a", token.value);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .greater_equal);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .integer);
    try testing.expectEqualStrings("10", token.value);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_end);
}

test "string literal" {
    const test_input = "{\"test 123\"}";

    var lexer = template.Lexer.init(test_input, allocator);

    var token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_start);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .string);

    try testing.expectEqualStrings("test 123", token.value);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_end);
}

test "boolean literal" {
    const test_input = "{true}";

    var lexer = template.Lexer.init(test_input, allocator);

    var token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_start);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .boolean);
    try testing.expectEqualStrings("true", token.value);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_end);
}

test "float literal" {
    const test_input = "{99.9}";

    var lexer = template.Lexer.init(test_input, allocator);

    var token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_start);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .float);
    try testing.expectEqualStrings("99.9", token.value);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_end);
}

test "token positions" {
    const input =
        \\// test
        \\<style>
        \\    html {
        \\        color: @{2 + 2};
        \\    }
        \\</style>
    ;

    var lexer = template.Lexer.init(input, allocator);

    var token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .comment);
    try testing.expect(token.position.line == 1);
    try testing.expect(token.position.column == 1);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .css_start);
    try testing.expect(token.position.line == 2);
    try testing.expect(token.position.column == 1);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .text_css);
    try testing.expect(token.position.line == 3);
    try testing.expect(token.position.column == 5);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .text_css);
    try testing.expect(token.position.line == 4);
    try testing.expect(token.position.column == 9);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_start);
    try testing.expect(token.position.line == 4);
    try testing.expect(token.position.column == 16);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .integer);
    try testing.expect(token.position.line == 4);
    try testing.expect(token.position.column == 18);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .plus);
    try testing.expect(token.position.line == 4);
    try testing.expect(token.position.column == 20);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .integer);
    try testing.expect(token.position.line == 4);
    try testing.expect(token.position.column == 22);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_end);
    try testing.expect(token.position.line == 4);
    try testing.expect(token.position.column == 23);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .text_css);
    try testing.expect(token.position.line == 4);
    try testing.expect(token.position.column == 24);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .text_css);
    try testing.expect(token.position.line == 5);
    try testing.expect(token.position.column == 5);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .css_end);
    try testing.expect(token.position.line == 6);
    try testing.expect(token.position.column == 1);
}

test "print token list" {
    var lexer = template.Lexer.init(full_syntax_input, allocator);

    const tokens = lexer.tokenize() catch |err| {
        std.debug.print("Lexer error: {}\n", .{err});
        return;
    };

    print("==============\n", .{});

    for (tokens) |token| {
        print("{:>2}:{:<5} {s:<15} {s}\n", .{
            token.position.line,
            token.position.column,
            @tagName(token.type),
            token.value,
        });
    }
}

test "print node tree" {
    var lexer = template.Lexer.init(full_syntax_input, allocator);

    const tokens = lexer.tokenize() catch |err| {
        std.debug.print("Test failed: Lexer tokenize error: {}\n", .{err});
        return err;
    };

    var parser = template.Parser.init(tokens, allocator);

    const ast = parser.parse() catch |err| switch (err) {
        template.ParseError.UnexpectedToken => {
            std.debug.print("Test failed: Parse error - unexpected token\n", .{});
            return err;
        },

        template.ParseError.UnexpectedEndOfInput => {
            std.debug.print("Test failed: Parse error - unexpected end of input\n", .{});
            return err;
        },

        template.ParseError.UnsupportedExpression => {
            std.debug.print("Test failed: Parse error - unsupported expression\n", .{});
            return err;
        },

        template.ParseError.OutOfMemory => {
            std.debug.print("Test failed: Parse error - out of memory\n", .{});
            return err;
        },
    };

    const fmt = std.json.fmt(ast, .{ .whitespace = .indent_2 });

    var writer = std.Io.Writer.Allocating.init(allocator);
    fmt.format(&writer.writer) catch |err| {
        std.debug.print("Test failed: JSON formatting error: {}\n", .{err});
        return err;
    };

    const output = writer.toOwnedSlice() catch |err| {
        std.debug.print("Test failed: Writer toOwnedSlice error: {}\n", .{err});
        return err;
    };

    print("==============\n", .{});
    print("{s}", .{output});
}
