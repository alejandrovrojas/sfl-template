import { Lexer, Parser, Renderer, TemplateEngine, TokenType } from './template.ts';
import { TestSuite } from './template.suite.ts';

const tests = new TestSuite();

tests.run('member: single property', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{user.name}', { user: { name: 'alice' } });
	tests.assert_equal(result, 'alice');
});

tests.run('member: two levels deep', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{test.a.b}', { test: { a: { b: 'test' } } });
	tests.assert_equal(result, 'test');
});

tests.run('member: three levels deep', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{a.b.c.d}', { a: { b: { c: { d: 'deep' } } } });
	tests.assert_equal(result, 'deep');
});

tests.run('member: missing intermediate returns empty', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{a.b.c}', { a: {} });
	tests.assert_equal(result, '');
});

tests.run('member: missing root returns empty', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{missing.prop}', {});
	tests.assert_equal(result, '');
});

tests.run('member: numeric property value', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{obj.count}', { obj: { count: 42 } });
	tests.assert_equal(result, '42');
});

tests.run('bracket: access with string literal key', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', `{obj["key"]}`, { obj: { key: 'value' } });
	tests.assert_equal(result, 'value');
});

tests.run('bracket: access with variable key', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{obj[key]}', { obj: { foo: 'bar' }, key: 'foo' });
	tests.assert_equal(result, 'bar');
});

tests.run('bracket: access array by index literal', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{arr[0]}', { arr: ['first', 'second'] });
	tests.assert_equal(result, 'first');
});

tests.run('bracket: chained bracket then dot', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{arr[0].name}', { arr: [{ name: 'alice' }] });
	tests.assert_equal(result, 'alice');
});

tests.run('bracket: dot then bracket', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{obj.list[1]}', { obj: { list: ['a', 'b', 'c'] } });
	tests.assert_equal(result, 'b');
});

tests.run('arithmetic: addition of integers', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{2 + 2}');
	tests.assert_equal(result, '4');
});

tests.run('arithmetic: subtraction', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{10 - 3}');
	tests.assert_equal(result, '7');
});

tests.run('arithmetic: multiplication', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{3 * 4}');
	tests.assert_equal(result, '12');
});

tests.run('arithmetic: division', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{10 / 4}');
	tests.assert_equal(result, '2.5');
});

tests.run('arithmetic: modulo even', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{2 % 2}');
	tests.assert_equal(result, '0');
});

tests.run('arithmetic: modulo odd', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{5 % 2}');
	tests.assert_equal(result, '1');
});

tests.run('arithmetic: operator precedence mul before add', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{2 + 3 * 4}');
	tests.assert_equal(result, '14');
});

tests.run('arithmetic: parentheses override precedence', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{(2 + 3) * 4}');
	tests.assert_equal(result, '20');
});

tests.run('arithmetic: chained addition left-associative', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{1 + 2 + 3}');
	tests.assert_equal(result, '6');
});

tests.run('arithmetic: with context variables', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{a + b}', { a: 5, b: 3 });
	tests.assert_equal(result, '8');
});

tests.run('arithmetic: with member expression operands', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{obj.x + obj.y}', { obj: { x: 10, y: 5 } });
	tests.assert_equal(result, '15');
});

tests.run('comparison: greater than true', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{3 > 2}');
	tests.assert_equal(result, 'true');
});

tests.run('comparison: greater than false', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{2 > 2}');
	tests.assert_equal(result, 'false');
});

tests.run('comparison: less than true', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{1 < 2}');
	tests.assert_equal(result, 'true');
});

tests.run('comparison: less than false', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{2 < 2}');
	tests.assert_equal(result, 'false');
});

tests.run('comparison: greater or equal true (greater)', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{3 >= 2}');
	tests.assert_equal(result, 'true');
});

tests.run('comparison: greater or equal true (equal)', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{2 >= 2}');
	tests.assert_equal(result, 'true');
});

tests.run('comparison: greater or equal false', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{1 >= 2}');
	tests.assert_equal(result, 'false');
});

tests.run('comparison: less or equal true (equal)', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{2 <= 2}');
	tests.assert_equal(result, 'true');
});

tests.run('comparison: less or equal false', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{3 <= 2}');
	tests.assert_equal(result, 'false');
});

tests.run('comparison: equal true', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{2 == 2}');
	tests.assert_equal(result, 'true');
});

tests.run('comparison: equal false', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{2 == 3}');
	tests.assert_equal(result, 'false');
});

tests.run('comparison: not equal true', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{2 != 3}');
	tests.assert_equal(result, 'true');
});

tests.run('comparison: not equal false', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{2 != 2}');
	tests.assert_equal(result, 'false');
});

tests.run('comparison: arithmetic inside comparison', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{2 + 2 == 4}');
	tests.assert_equal(result, 'true');
});

tests.run('comparison: modulo inside comparison', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{4 % 2 == 0}');
	tests.assert_equal(result, 'true');
});

tests.run('logical: and both true', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{1 < 2 && 3 < 4}');
	tests.assert_equal(result, 'true');
});

tests.run('logical: and one false', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{2 > 2 && 3 > 3}');
	tests.assert_equal(result, 'false');
});

tests.run('logical: or both false', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{2 > 3 || 4 > 5}');
	tests.assert_equal(result, 'false');
});

tests.run('logical: or one true', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{2 > 3 || 5 > 4}');
	tests.assert_equal(result, 'true');
});

tests.run('logical: and has higher precedence than or', () => {
	const engine = new TemplateEngine();
	// false && true || true  =>  (false && true) || true  => true
	const result = engine.run('_', '{1 > 2 && 3 < 4 || 5 < 6}');
	tests.assert_equal(result, 'true');
});

tests.run('logical: chained and', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{1 < 2 && 2 < 3 && 3 < 4}');
	tests.assert_equal(result, 'true');
});

tests.run('logical: with member expressions', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{a.x > 0 && b.y > 0}', {
		a: { x: 1 },
		b: { y: 2 },
	});
	tests.assert_equal(result, 'true');
});

tests.run('unary: negate number literal', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{-5}');
	tests.assert_equal(result, '-5');
});

tests.run('unary: logical not true', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{!true}');
	tests.assert_equal(result, 'false');
});

tests.run('unary: logical not false', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{!false}');
	tests.assert_equal(result, 'true');
});

tests.run('unary: double negation', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{!!true}');
	tests.assert_equal(result, 'true');
});

tests.run('unary: not on comparison', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{!(2 == 2)}');
	tests.assert_equal(result, 'false');
});

tests.run('unary: negate variable', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{-n}', { n: 7 });
	tests.assert_equal(result, '-7');
});

tests.run('ternary: true branch', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', `{2 + 2 == 4 ? 'yes' : 'no'}`);
	tests.assert_equal(result, 'yes');
});

tests.run('ternary: false branch', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', `{2 + 2 == 5 ? 'yes' : 'no'}`);
	tests.assert_equal(result, 'no');
});

tests.run('ternary: consequent is arithmetic', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{1 < 2 ? 10 + 5 : 0}');
	tests.assert_equal(result, '15');
});

tests.run('ternary: alternate is arithmetic', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{1 > 2 ? 0 : 10 + 5}');
	tests.assert_equal(result, '15');
});

tests.run('ternary: condition uses context variable', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', `{flag ? 'on' : 'off'}`, { flag: true });
	tests.assert_equal(result, 'on');
});

tests.run('ternary: condition uses member expression', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', `{user.active ? 'yes' : 'no'}`, { user: { active: false } });
	tests.assert_equal(result, 'no');
});

tests.run('literal: integer', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{42}');
	tests.assert_equal(result, '42');
});

tests.run('literal: float', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{3.14}');
	tests.assert_equal(result, '3.14');
});

tests.run('literal: string single quotes', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', `{'hello'}`);
	tests.assert_equal(result, 'hello');
});

tests.run('literal: boolean true', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{true}');
	tests.assert_equal(result, 'true');
});

tests.run('literal: boolean false', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{false}');
	tests.assert_equal(result, 'false');
});

tests.run('if: renders consequent when true', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{if show}visible{/if}', { show: true });
	tests.assert_equal(result, 'visible');
});

tests.run('if: renders nothing when false and no else', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{if show}visible{/if}', { show: false });
	tests.assert_equal(result, '');
});

tests.run('if: renders else branch', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{if show}yes{else}no{/if}', { show: false });
	tests.assert_equal(result, 'no');
});

tests.run('if: else if selects correct branch', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{if a}A{else if b}B{else}C{/if}', { a: false, b: true });
	tests.assert_equal(result, 'B');
});

tests.run('if: falls through to else', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{if a}A{else if b}B{else}C{/if}', { a: false, b: false });
	tests.assert_equal(result, 'C');
});

tests.run('if: condition is comparison expression', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{if n > 5}big{else}small{/if}', { n: 10 });
	tests.assert_equal(result, 'big');
});

tests.run('if: condition uses member expression', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{if user.admin}admin{else}guest{/if}', { user: { admin: true } });
	tests.assert_equal(result, 'admin');
});

tests.run('for: iterate over number', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{for n in 3}{n}{/for}');
	tests.assert_equal(result, '012');
});

tests.run('for: iterate over array', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{for item in items}{item},{/for}', { items: ['a', 'b', 'c'] });
	tests.assert_equal(result, 'a,b,c,');
});

tests.run('for: iterate over string characters', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{for ch in word}{ch}{/for}', { word: 'hi' });
	tests.assert_equal(result, 'hi');
});

tests.run('for: iterate over object values', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{for v in obj}{v},{/for}', { obj: { a: 1, b: 2 } });
	tests.assert_equal(result, '1,2,');
});

tests.run('for: index variable over array', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{for item, i in items}{i}{/for}', { items: ['x', 'y', 'z'] });
	tests.assert_equal(result, '012');
});

tests.run('for: index variable over object gives keys', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{for v, k in obj}{k}:{v},{/for}', { obj: { x: 1, y: 2 } });
	tests.assert_equal(result, 'x:1,y:2,');
});

tests.run('for: iterate over member expression', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{for item in data.list}{item},{/for}', { data: { list: [1, 2, 3] } });
	tests.assert_equal(result, '1,2,3,');
});

tests.run('for: empty array renders nothing', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{for item in items}x{/for}', { items: [] });
	tests.assert_equal(result, '');
});

tests.run('for: zero count renders nothing', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{for n in 0}x{/for}');
	tests.assert_equal(result, '');
});

tests.run('for: iterator variable does not leak into outer context', () => {
	const engine = new TemplateEngine();
	engine.run('_', '{for item in items}{item}{/for}', { items: ['a'] });
	const result = engine.run('outer', '{item}', {});
	tests.assert_equal(result, '');
});

tests.run('switch: matches literal case', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', `{switch x}{case 1}one{case 2}two{default}other{/switch}`, { x: 2 });
	tests.assert_equal(result, 'two');
});

tests.run('switch: falls through to default', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', `{switch x}{case 1}one{case 2}two{default}other{/switch}`, { x: 99 });
	tests.assert_equal(result, 'other');
});

tests.run('switch: matches string case', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', `{switch role}{case 'admin'}A{case 'user'}U{default}?{/switch}`, { role: 'admin' });
	tests.assert_equal(result, 'A');
});

tests.run('switch: multi-value case matches first value', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', `{switch x}{case 'a', 'b'}hit{default}miss{/switch}`, { x: 'a' });
	tests.assert_equal(result, 'hit');
});

tests.run('switch: multi-value case matches second value', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', `{switch x}{case 'a', 'b'}hit{default}miss{/switch}`, { x: 'b' });
	tests.assert_equal(result, 'hit');
});

tests.run('switch: no match and no default returns empty', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', `{switch x}{case 1}one{case 2}two{/switch}`, { x: 99 });
	tests.assert_equal(result, '');
});

tests.run('mixed: expression inside surrounding text', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', 'Hello, {name}!', { name: 'world' });
	tests.assert_equal(result, 'Hello, world!');
});

tests.run('mixed: multiple expressions in one template', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{a} + {b} = {a + b}', { a: 1, b: 2 });
	tests.assert_equal(result, '1 + 2 = 3');
});

tests.run('mixed: if inside for', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{for n in 4}{if n % 2 == 0}{n}{/if}{/for}');
	tests.assert_equal(result, '02');
});

tests.run('mixed: ternary inside for', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', `{for n in 3}{n % 2 == 0 ? 'e' : 'o'}{/for}`);
	tests.assert_equal(result, 'eoe');
});

tests.run('mixed: member expression in for body', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', '{for item in items}{item.name},{/for}', {
		items: [{ name: 'alice' }, { name: 'bob' }],
	});

	tests.assert_equal(result, 'alice,bob,');
});

tests.run('html: multiline attributes', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', `
		<div
			style=""
			data-test="">
			{message}
		</div>
	`, {
		message: "hello"
	});

	tests.assert_equal(result, `<div
			style=""
			data-test="">hello</div>`);
});

tests.run('html: tags in style/script attributes', () => {
	const engine = new TemplateEngine();
	const result = engine.run('_', `
		<style test="{message}">
		</style>

		<script test="{message}">
		</script>
	`, {
		message: "hello"
	});

	tests.assert_equal(result, `<style test="hello"></style><script test="hello"></script>`);
});

tests.run('text: trimmed text values', () => {
	const engine = new TemplateEngine();

	const result = engine.run('_', `
		<div>  this {message} is preserved    </div>
	`, { message: 'hello' });

	tests.assert_equal(result, `<div>  this hello is preserved    </div>`);
});

tests.print_results();
