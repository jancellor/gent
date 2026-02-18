import React from 'react';
import { Box, Text } from 'ink';

export function UserPartMessage({ text }: { text: string }) {
  const width = Math.max(10, process.stdout.columns ?? 80);
  const divider = '─'.repeat(width);

  return (
    <Box flexDirection="column">
      <Text color="gray">{divider}</Text>
      <Text>{text}</Text>
      <Text color="gray">{divider}</Text>
      <Text> </Text>
    </Box>
  );
}
