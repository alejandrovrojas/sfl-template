sfl-template
0.1.0

depdendency-free single-file library for rendering HTML-like templates.
the syntax resembles most mustache-based template engines. all basic logic
blocks supported. the parser allows out-of-order imports and throws
on import cycles. imports paths and inline <style> or <script> content
is extracted and returned separately during parsing.


USAGE
    import { TemplateEngine } from './template.ts';

    const t = new TemplateEngine();

    t.compile('first_template', `
        {insert 'button' (title: "test")}
    `)

    t.compile('button', `
        <button>{title}</button>
    `)

    t.render('first_template');


SYNTAX
    // import
    {insert "template.html" (date: "now", other: 2 > 2)}

    // import + slot
    {use "button" (item: "other")}
        default slot

        {slot "title"}
            {item}
        {/slot}
    {/use}

    // slots
    <div>
        {slot "title"}
            <div>default title</div>
        {/slot}

        <button>
            {slot}
                default slot
            {/slot}
        </button>
    </div>

    // expressions
    <div>{2 + 2}</div>
    <div>{a > b && c < d || e >= f}</div>
    <div>{2 + 2 == 4 ? 'yes' : 'no'}</div>
    <div>{item}</div>
    <div>{item.id}</div>
    <div>{item[var].id}</div>

    // for block
    {for n, i in 10}
        {n}
    {/for}

    {for ch, i in "hello"}
        {ch}
    {/for}

    {for k, v in obj.like}
        {k}: {v}
    {/for}

    {for item, index in items}
        {if condition}
            //...
        {else if condition_2}
            //...
        {else}
            //...
        {/if}
    {/for}

    // if block
    {if condition}
        //...
    {else if condition_2 || condition_3}
        //...
    {else}
        //...
    {/if}

    // switch block
    {switch var}
        {case 2 + 2}
            //...
        {case 'test_1', 'test_2'}
            //...
        {default}
            //...
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


OUTPUT
    t.compile('test', `
        {insert "misc/button.html"}

        <style>
            .css { color: red; }
        </style>

        <script>
            const test = 20;
        </script>

        <script>
            const ignored = @{2 + 2};
        </script>

        <div></div>
    `);

    Template {
    	    imports:  string[]  =  [ "misc/button.html" ],
    	    js:       string;   =  ".css { color: red; }",
    	    css:      string;   =  "const test = 20;",
    	    ast:      Block;    =  { ... }
    }
