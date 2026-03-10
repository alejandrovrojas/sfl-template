import { Lexer, Parser, Renderer, TemplateEngine, TokenType } from './template.ts';
import { TestSuite } from './template.suite.ts';

const tests = new TestSuite();

tests.run('basic: syntax', () => {
	const t = new TemplateEngine();

	const input = `
		<style>
			.css {};
		</style>

		<script>
			.css {};
		</script>

		<div>
			html
		</div>
	`

	const ast = t.compile('t', input);

	console.dir(ast, { depth: 20 })
});

tests.run('basic: expressions', () => {
	const t = new TemplateEngine();

	const {all: a} = t.run('_', '{2 + 2}');
	const {all: b} = t.run('_', '{2 > 2}');
	const {all: c} = t.run('_', '{2 > 2 && 3 > 3}');
	const {all: d} = t.run('_', '{2 % 2 == 0}');

	tests.assert_equal(a, "4");
	tests.assert_equal(b, "false");
	tests.assert_equal(c, "false");
	tests.assert_equal(d, "true");
});

tests.run('lexer: script tags with attributes', () => {
	// test <script type="importmaps">
	let lexer = new Lexer('<script type="importmaps">{"imports": {}}</script>');
	let tokens = lexer.tokenize();

	tests.assert_equal(tokens[0].type, TokenType.js_start);
	tests.assert_equal(tokens[1].type, TokenType.text_js);
	tests.assert_equal(tokens[1].value, '{"imports": {}}');
	tests.assert_equal(tokens[2].type, TokenType.js_end);

	// test <script src="file.js">
	lexer = new Lexer('<script src="file.js"></script>');
	tokens = lexer.tokenize();

	tests.assert_equal(tokens[0].type, TokenType.js_start);
	tests.assert_equal(tokens[1].type, TokenType.js_end);

	// test <script type="module" defer>
	lexer = new Lexer('<script type="module" defer>console.log("test");</script>');
	tokens = lexer.tokenize();

	tests.assert_equal(tokens[0].type, TokenType.js_start);
	tests.assert_equal(tokens[1].type, TokenType.text_js);
	tests.assert_equal(tokens[1].value, 'console.log("test");');
	tests.assert_equal(tokens[2].type, TokenType.js_end);

	// test regular <script> still works
	lexer = new Lexer('<script>alert("hello");</script>');
	tokens = lexer.tokenize();

	tests.assert_equal(tokens[0].type, TokenType.js_start);
	tests.assert_equal(tokens[1].type, TokenType.text_js);
	tests.assert_equal(tokens[1].value, 'alert("hello");');
	tests.assert_equal(tokens[2].type, TokenType.js_end);
});

tests.run('lexer: style tags with attributes', () => {
	// test <style type="text/css">
	let lexer = new Lexer('<style type="text/css">body { color: red; }</style>');
	let tokens = lexer.tokenize();

	tests.assert_equal(tokens[0].type, TokenType.css_start);
	tests.assert_equal(tokens[1].type, TokenType.text_css);
	tests.assert_equal(tokens[1].value, 'body { color: red; }');
	tests.assert_equal(tokens[2].type, TokenType.css_end);

	// test <style media="screen">
	lexer = new Lexer('<style media="screen"></style>');
	tokens = lexer.tokenize();

	tests.assert_equal(tokens[0].type, TokenType.css_start);
	tests.assert_equal(tokens[1].type, TokenType.css_end);

	// test <style scoped>
	lexer = new Lexer('<style scoped>.component { margin: 0; }</style>');
	tokens = lexer.tokenize();

	tests.assert_equal(tokens[0].type, TokenType.css_start);
	tests.assert_equal(tokens[1].type, TokenType.text_css);
	tests.assert_equal(tokens[1].value, '.component { margin: 0; }');
	tests.assert_equal(tokens[2].type, TokenType.css_end);

	// test regular <style> still works
	lexer = new Lexer('<style>h1 { font-size: 2em; }</style>');
	tokens = lexer.tokenize();

	tests.assert_equal(tokens[0].type, TokenType.css_start);
	tests.assert_equal(tokens[1].type, TokenType.text_css);
	tests.assert_equal(tokens[1].value, 'h1 { font-size: 2em; }');
	tests.assert_equal(tokens[2].type, TokenType.css_end);
});

tests.print_results();
