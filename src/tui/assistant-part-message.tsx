import React from 'react';
import { Box, Text } from 'ink';
import { ABORTED_MESSAGE } from '../agent/index.js';
import { parseMarkdown } from './markdown.js';

export function AssistantPartMessage({ text }: { text: string }) {
  const aborted = text === ABORTED_MESSAGE;
  const parsed = aborted ? text : parseMarkdown(text);

  return (
    <Box flexDirection="column">
      <Text color={aborted ? 'red' : undefined} dimColor={aborted}>{parsed}</Text>
      <Text> </Text>
    </Box>
  );
}
