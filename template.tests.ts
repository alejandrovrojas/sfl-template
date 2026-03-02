import { Lexer, Parser, Renderer, TemplateEngine } from './template.ts';
import { TestSuite } from './template.suite.ts';

const tests = new TestSuite();

tests.run('basic: slots', () => {
	const t = new TemplateEngine();

	const b = t.compile('b', `
		{test.test}
	`);

	console.log(t.render('b', { item: "YES" }))
});

tests.run('basic: expressions', () => {
	const t = new TemplateEngine();

	const a = t.run('_', '{2 + 2}');
	const b = t.run('_', '{2 > 2}');
	const c = t.run('_', '{2 > 2 & 3 > 3}');
	const d = t.run('_', '{2 % 2 == 0}');

	tests.assert_equal(a, "4");
	tests.assert_equal(b, "false");
	tests.assert_equal(c, "false");
	tests.assert_equal(d, "true");
});

tests.print_results();
