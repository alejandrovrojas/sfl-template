// comment

// expression inside a css block with expressions injected with ${ }
<style>
	html {
		color: ${value};
	}
</style>

// expression inside a js block with expressions injected with ${ }
<script>
	if (true) {
		const test = ${value};
	}
</script>

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
