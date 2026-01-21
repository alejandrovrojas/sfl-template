import { lex, wasm_alloc, wasm_free, memory } from './zig-out/bin/nano.wasm';

function wasm_string(): string {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const input = "TEST THIS";
  const input_bytes = encoder.encode(input);
  const input_ptr = wasm_alloc(input_bytes.length);
  const input_length = input_bytes.length;

  const input_view = new Uint8Array(memory.buffer, input_ptr, input_length);

  input_view.set(input_bytes);

  const result = prepend_test(input_ptr, input_length);

  const result_ptr = Number(result >> 32n);
  const result_length = Number(result & ((1n << 32n) - 1n));

  const result_bytes = new Uint8Array(memory.buffer, result_ptr, result_length);
  const result_string = decoder.decode(result_bytes);

  wasm_free(input_ptr, input_length);
  wasm_free(result_ptr, result_length);

  return result_string;
}

console.log(wasm_string());
