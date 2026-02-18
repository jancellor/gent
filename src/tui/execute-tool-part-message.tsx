import React from 'react';
import { Box, Text } from 'ink';
import { SpinnerMessage } from './spinner-message.js';
import type { ToolPartMessageRenderProps } from './tool-part-message.js';

export function ExecuteToolPartMessage({ input, output }: ToolPartMessageRenderProps) {
  const displayInput = input == null ? null : formatExecuteToolInput(input);
  const parsed = output == null ? null : parseExecuteToolOutput(output);

  return (
    <Box flexDirection="column">
      {displayInput ? (
        <>
          <Text>{displayInput}</Text>
          <Text> </Text>
        </>
      ) : null}
      {parsed?.stdout ? (
        <>
          <Text dimColor>{parsed.stdout}</Text>
          <Text> </Text>
        </>
      ) : null}
      {parsed?.stderr ? (
        <>
          <Text color="red" dimColor>{parsed.stderr}</Text>
          <Text> </Text>
        </>
      ) : null}
      {parsed?.exitCode ? (
        <>
          <Text>{`exit ${parsed.exitCode}`}</Text>
          <Text> </Text>
        </>
      ) : null}
      {output == null ? <SpinnerMessage /> : null}
    </Box>
  );
}

type ParsedExecuteOutput = {
  stdout: string;
  stderr: string;
  exitCode: string;
};

function parseExecuteToolOutput(output: unknown): ParsedExecuteOutput | null {
  if (!output || typeof output !== 'object') return null;
  const outer = output as Record<string, unknown>;
  if (outer.type !== 'json' || !('value' in outer)) return null;

  const value = outer.value;
  if (!value || typeof value !== 'object') return null;
  const inner = value as Record<string, unknown>;

  const stdout =
    typeof inner.stdout === 'string' && inner.stdout.trim().length > 0
      ? inner.stdout.trimEnd()
      : '';
  const stderr =
    typeof inner.stderr === 'string' && inner.stderr.trim().length > 0
      ? inner.stderr.trimEnd()
      : '';
  const exitCode = String(inner.exitCode ?? inner.exit_code ?? 'unknown');

  return { stdout, stderr, exitCode };
}

function formatExecuteToolInput(input: unknown): string {
  if (typeof input === 'string') return input;
  if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    if (typeof obj.command === 'string') return `$ ${obj.command}`;
    return JSON.stringify(input, null, 2);
  }
  return String(input);
}
