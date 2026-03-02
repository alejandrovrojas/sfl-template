sfl-template

produces an ordinary AST for rendering HTML-like templates.
syntax resembles most mustache-based template engines. the zig
parser is used primarly for testing WASM interop performance.

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
                // default slot
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
        {ch}
    {/for}

    {for ch, i in "hello"}
        {ch}
    {/for}

    {for item, index in items}
        {if condition}
            <!-- ... -->
        {else if condition_2}
            <!-- ... -->
        {else}
            <!-- ... -->
        {/if}
    {/for}

    // if block
    {if condition}
        <!-- ... -->
    {else if condition_2 || condition_3}
        <!-- ... -->
    {else}
        <!-- ... -->
    {/if}

    // switch block
    {switch var}
        {case 2 + 2}
            <!-- ... -->

        {case 'test_1', 'test_2'}
            <!-- ... -->

        {default}
            <!-- ... -->
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
