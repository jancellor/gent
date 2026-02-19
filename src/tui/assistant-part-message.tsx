import React from 'react';
import { Box, Text } from 'ink';
import { parseMarkdown } from './markdown.js';

export function AssistantPartMessage({ text }: { text: string }) {
  const parsed = parseMarkdown(text);

  return (
    <Box flexDirection="column">
      <Text>{parsed}</Text>
      <Text> </Text>
    </Box>
  );
}
