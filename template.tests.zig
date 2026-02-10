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
    \\<div>{true}</div>
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

test "keyword boundaries" {
    const test_input = "{for1}";

    var lexer = template.Lexer.init(test_input, allocator);

    var token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_start);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .identifier);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .expr_end);

    token = lexer.tokenize_lexeme();
    try testing.expect(token.type == .eof);
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

test "for loop basic" {
    const test_input =
        \\{for item in items}
        \\    <div>content</div>
        \\{/for}
    ;

    var lexer = template.Lexer.init(test_input, allocator);
    const tokens = lexer.tokenize() catch unreachable;

    var parser = template.Parser.init(tokens, allocator);
    const ast = parser.parse() catch unreachable;

    try testing.expect(ast.program.root.block.len == 1);
    try testing.expect(ast.program.root.block[0] == .block_for);

    const for_block = ast.program.root.block[0].block_for;
    try testing.expectEqualStrings("item", for_block.item_var);
    try testing.expect(for_block.index_var == null);
    try testing.expect(for_block.iterable.* == .identifier);
    try testing.expectEqualStrings("items", for_block.iterable.identifier.name);
    try testing.expect(for_block.body.block.len == 1);
    try testing.expect(for_block.body.block[0] == .text);
}

test "for loop with index" {
    const test_input =
        \\{for user, index in users}
        \\    <tr>content</tr>
        \\{/for}
    ;

    var lexer = template.Lexer.init(test_input, allocator);
    const tokens = lexer.tokenize() catch unreachable;

    var parser = template.Parser.init(tokens, allocator);
    const ast = parser.parse() catch unreachable;

    try testing.expect(ast.program.root.block.len == 1);
    try testing.expect(ast.program.root.block[0] == .block_for);

    const for_block = ast.program.root.block[0].block_for;
    try testing.expectEqualStrings("user", for_block.item_var);
    try testing.expectEqualStrings("index", for_block.index_var.?);
    try testing.expect(for_block.iterable.* == .identifier);
    try testing.expectEqualStrings("users", for_block.iterable.identifier.name);
}

test "nested for loops" {
    const test_input =
        \\{for category in categories}
        \\    {for product in products}
        \\        <span>item</span>
        \\    {/for}
        \\{/for}
    ;

    var lexer = template.Lexer.init(test_input, allocator);
    const tokens = lexer.tokenize() catch unreachable;

    var parser = template.Parser.init(tokens, allocator);
    const ast = parser.parse() catch unreachable;

    try testing.expect(ast.program.root.block.len == 1);
    try testing.expect(ast.program.root.block[0] == .block_for);

    const outer_for = ast.program.root.block[0].block_for;
    try testing.expectEqualStrings("category", outer_for.item_var);
    try testing.expect(outer_for.body.block.len == 1);
    try testing.expect(outer_for.body.block[0] == .block_for);

    const inner_for = outer_for.body.block[0].block_for;
    try testing.expectEqualStrings("product", inner_for.item_var);
    try testing.expectEqualStrings("products", inner_for.iterable.identifier.name);
}

test "switch block basic" {
    const test_input =
        \\{switch value}
        \\    {case 1}
        \\        <p>One</p>
        \\    {case 2}
        \\        <p>Two</p>
        \\    {default}
        \\        <p>Other</p>
        \\{/switch}
    ;

    var lexer = template.Lexer.init(test_input, allocator);
    const tokens = lexer.tokenize() catch unreachable;

    var parser = template.Parser.init(tokens, allocator);
    const ast = parser.parse() catch unreachable;

    try testing.expect(ast.program.root.block.len == 1);
    try testing.expect(ast.program.root.block[0] == .block_switch);

    const switch_block = ast.program.root.block[0].block_switch;
    try testing.expect(switch_block.expression.* == .identifier);
    try testing.expectEqualStrings("value", switch_block.expression.identifier.name);
    try testing.expect(switch_block.cases.len == 3);
    try testing.expect(switch_block.cases[0] == .block_case);

    const case1 = switch_block.cases[0].block_case;
    try testing.expect(case1.values.?.len == 1);
    try testing.expect(case1.values.?[0].* == .literal_int);
    try testing.expect(case1.values.?[0].literal_int.value == 1);

    try testing.expect(switch_block.cases[2] == .block_case);
    const default_case = switch_block.cases[2].block_case;
    try testing.expect(default_case.values == null);
}

test "switch block with multiple case values" {
    const test_input =
        \\{switch role}
        \\    {case 'admin', 'moderator'}
        \\        <div>Admin panel</div>
        \\    {case 'user'}
        \\        <div>User panel</div>
        \\    {default}
        \\        <div>Guest panel</div>
        \\{/switch}
    ;

    var lexer = template.Lexer.init(test_input, allocator);
    const tokens = lexer.tokenize() catch unreachable;

    var parser = template.Parser.init(tokens, allocator);
    const ast = parser.parse() catch unreachable;

    try testing.expect(ast.program.root.block.len == 1);
    try testing.expect(ast.program.root.block[0] == .block_switch);

    const switch_block = ast.program.root.block[0].block_switch;
    try testing.expect(switch_block.cases.len == 3);

    const case1 = switch_block.cases[0].block_case;
    try testing.expect(case1.values.?.len == 2);
    try testing.expect(case1.values.?[0].* == .literal_string);
    try testing.expectEqualStrings("admin", case1.values.?[0].literal_string.value);
    try testing.expect(case1.values.?[1].* == .literal_string);
    try testing.expectEqualStrings("moderator", case1.values.?[1].literal_string.value);
    try testing.expect(case1.body.block.len == 1);
    try testing.expect(case1.body.block[0] == .text);
}

test "multiple switch blocks" {
    const test_input =
        \\{switch status}
        \\    {case 1}
        \\        <span>Active</span>
        \\{/switch}
        \\{switch type}
        \\    {case 'premium'}
        \\        <span>Premium</span>
        \\{/switch}
    ;

    var lexer = template.Lexer.init(test_input, allocator);
    const tokens = lexer.tokenize() catch unreachable;

    var parser = template.Parser.init(tokens, allocator);
    const ast = parser.parse() catch unreachable;

    try testing.expect(ast.program.root.block.len == 2);
    try testing.expect(ast.program.root.block[0] == .block_switch);
    try testing.expect(ast.program.root.block[1] == .block_switch);

    const switch1 = ast.program.root.block[0].block_switch;
    const switch2 = ast.program.root.block[1].block_switch;

    try testing.expectEqualStrings("status", switch1.expression.identifier.name);
    try testing.expectEqualStrings("type", switch2.expression.identifier.name);
}

fn print_ast(node: *const template.Node, indent: usize) void {
    const spaces = "                                        ";
    const prefix = spaces[0..@min(indent * 2, spaces.len)];

    switch (node.*) {
        .program => |prog| {
            print("{s}PROGRAM:\n", .{prefix});
            print("{s}  BLOCK [{}]:\n", .{ prefix, prog.root.block.len });
            for (prog.root.block) |*child| {
                print_ast(child, indent + 2);
            }
        },

        .block => |block| {
            print("{s}BLOCK [{}]:\n", .{ prefix, block.block.len });
            for (block.block) |*child| {
                print_ast(child, indent + 1);
            }
        },

        .text => |text| {
            print("{s}TEXT: \"{s}\"\n", .{ prefix, text.value });
        },

        .comment => |comment| {
            print("{s}COMMENT: \"{s}\"\n", .{ prefix, comment.value });
        },

        .block_if => |if_block| {
            print("{s}IF:\n", .{prefix});
            print("{s}  CONDITION:\n", .{prefix});
            print_ast(if_block.condition, indent + 2);
            print("{s}  CONSEQUENT:\n", .{prefix});
            print_block(&if_block.consequent, indent + 2);
            if (if_block.alternate) |alt| {
                print("{s}  ALTERNATE:\n", .{prefix});
                print_ast(alt, indent + 2);
            }
        },

        .block_switch => |switch_block| {
            print("{s}SWITCH:\n", .{prefix});
            print("{s}  EXPRESSION:\n", .{prefix});
            print_ast(switch_block.expression, indent + 2);
            print("{s}  CASES [{}]:\n", .{ prefix, switch_block.cases.len });
            for (switch_block.cases) |*case| {
                print_ast(case, indent + 2);
            }
        },

        .block_case => |case_block| {
            print("{s}CASE:\n", .{prefix});
            if (case_block.values) |values| {
                print("{s}  VALUES [{}]:\n", .{ prefix, values.len });
                for (values) |value| {
                    print("{s}    VALUE:\n", .{prefix});
                    print_ast(value, indent + 3);
                }
            } else {
                print("{s}  DEFAULT\n", .{prefix});
            }
            print("{s}  BODY:\n", .{prefix});
            print_block(&case_block.body, indent + 2);
        },

        .block_for => |for_block| {
            print("{s}FOR:\n", .{prefix});
            print("{s}  ITEM_VAR: \"{s}\"\n", .{ prefix, for_block.item_var });
            if (for_block.index_var) |index_var| {
                print("{s}  INDEX_VAR: \"{s}\"\n", .{ prefix, index_var });
            }
            print("{s}  ITERABLE:\n", .{prefix});
            print_ast(for_block.iterable, indent + 2);
            print("{s}  BODY:\n", .{prefix});
            print_block(&for_block.body, indent + 2);
        },

        .literal_null => |null_lit| {
            print("{s}LITERAL_NULL: {}\n", .{ prefix, null_lit.value });
        },

        .literal_int => |int_lit| {
            print("{s}LITERAL_INT: {}\n", .{ prefix, int_lit.value });
        },

        .literal_float => |float_lit| {
            print("{s}LITERAL_FLOAT: {}\n", .{ prefix, float_lit.value });
        },

        .literal_string => |str_lit| {
            print("{s}LITERAL_STRING: \"{s}\"\n", .{ prefix, str_lit.value });
        },

        .literal_boolean => |bool_lit| {
            print("{s}LITERAL_BOOLEAN: {}\n", .{ prefix, bool_lit.value });
        },

        .expression => |expr| {
            print("{s}EXPRESSION:\n", .{prefix});
            print_ast(expr.expr, indent + 1);
        },

        .expression_binary => |binary| {
            print("{s}BINARY_EXPRESSION:\n", .{prefix});
            print("{s}  LEFT:\n", .{prefix});
            print_ast(binary.left, indent + 2);
            print("{s}  OPERATOR: {s}\n", .{ prefix, @tagName(binary.operator) });
            print("{s}  RIGHT:\n", .{prefix});
            print_ast(binary.right, indent + 2);
        },

        .expression_unary => |unary| {
            print("{s}UNARY_EXPRESSION:\n", .{prefix});
            print("{s}  OPERATOR: {s}\n", .{ prefix, @tagName(unary.operator) });
            print("{s}  OPERAND:\n", .{prefix});
            print_ast(unary.operand, indent + 2);
        },

        .identifier => |ident| {
            print("{s}IDENTIFIER: \"{s}\"\n", .{ prefix, ident.name });
        },
    }
}

fn print_expression(expr: *const template.Node, indent: usize) void {
    const spaces = "                                        ";
    const prefix = spaces[0..@min(indent * 2, spaces.len)];

    switch (expr.*) {
        .identifier => |ident| {
            print("{s}IDENTIFIER: \"{s}\"\n", .{ prefix, ident.name });
        },
        .literal_int => |int| {
            print("{s}INT: {}\n", .{ prefix, int.value });
        },
        .literal_string => |str| {
            print("{s}STRING: \"{s}\"\n", .{ prefix, str.value });
        },
        else => {
            print_ast(expr, indent);
        },
    }
}

fn print_block(block: *const template.Block, indent: usize) void {
    const spaces = "                                        ";
    const prefix = spaces[0..@min(indent * 2, spaces.len)];

    print("{s}BLOCK [{}]:\n", .{ prefix, block.block.len });
    for (block.block) |*child| {
        print_ast(child, indent + 1);
    }
}

test "ast print comprehensive" {
    const test_input = full_syntax_input;

    var lexer = template.Lexer.init(test_input, allocator);
    const tokens = lexer.tokenize() catch |err| {
        print("Lexer error: {}\n", .{err});
        return;
    };

    var parser = template.Parser.init(tokens, allocator);
    const ast = parser.parse() catch |err| {
        print("Parse error: {}\n", .{err});
        return;
    };

    print_ast(&ast, 0);

    try testing.expect(ast.program.root.block.len > 0);
}

test "ast simple expression" {
    const test_input = "{2 + 2 * 2 > 4}";

    var lexer = template.Lexer.init(test_input, allocator);
    const tokens = lexer.tokenize() catch unreachable;

    var parser = template.Parser.init(tokens, allocator);
    const ast = parser.parse() catch unreachable;

    print_ast(&ast, 0);

    try testing.expect(ast.program.root.block.len == 1);
    try testing.expect(ast.program.root.block[0] == .expression);
}

test "ast if block structure" {
    const test_input =
        \\{if condition}
        \\    <div>true content</div>
        \\{else}
        \\    <div>false content</div>
        \\{/if}
    ;

    var lexer = template.Lexer.init(test_input, allocator);
    const tokens = lexer.tokenize() catch unreachable;

    var parser = template.Parser.init(tokens, allocator);
    const ast = parser.parse() catch unreachable;

    print_ast(&ast, 0);

    try testing.expect(ast.program.root.block.len == 1);
    try testing.expect(ast.program.root.block[0] == .block_if);
}

test "ast expression conditional" {
    const test_input =
        \\{1 ? 2 : 3}
    ;

    var lexer = template.Lexer.init(test_input, allocator);
    const tokens = lexer.tokenize() catch unreachable;

    var parser = template.Parser.init(tokens, allocator);
    const ast = parser.parse() catch unreachable;

    print_ast(&ast, 0);

    try testing.expect(ast.program.root.block.len == 1);
    try testing.expect(ast.program.root.block[0] == .expression);
}
