sfl-template

produces an ordinary AST for rendering HTML-like templates.
syntax resembles most mustache-based template engines. the zig
parser is used primarly for testing WASM interop performance.

SYNTAX
    // expressions
    <div>{2 + 2}</div>
    <div>{2 + 2 == 4 ? 'yes' : 'no'}</div>
    <div>{item}</div>
    <div>{item.id}</div>
    <div>{item[var].id}</div>

    // loop
    {for item, index in items}
        <!-- ... -->
    {/for}

    // if block
    {if condition}
        <!-- ... -->
    {else if condition_2}
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
