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
    try testing.expect(for_block.iterable.len == 1);
    try testing.expectEqualStrings("items", for_block.iterable[0].value);
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
    try testing.expect(for_block.iterable.len == 1);
    try testing.expectEqualStrings("users", for_block.iterable[0].value);
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
    try testing.expectEqualStrings("products", inner_for.iterable[0].value);
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
    try testing.expect(switch_block.expression.len == 1);
    try testing.expectEqualStrings("value", switch_block.expression[0].value);
    try testing.expect(switch_block.cases.len == 3);

    try testing.expect(switch_block.cases[0] == .block_case);
    const case1 = switch_block.cases[0].block_case;
    // try testing.expect(case1.is_default == false);
    try testing.expect(case1.values.?.len == 1);
    try testing.expectEqualStrings("1", case1.values.?[0][0].value);

    try testing.expect(switch_block.cases[2] == .block_case);
    const default_case = switch_block.cases[2].block_case;
    // try testing.expect(default_case.is_default == true);
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
    try testing.expectEqualStrings("admin", case1.values.?[0][0].value);
    try testing.expectEqualStrings("moderator", case1.values.?[1][0].value);
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

    try testing.expectEqualStrings("status", switch1.expression[0].value);
    try testing.expectEqualStrings("type", switch2.expression[0].value);
}
