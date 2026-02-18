import React from 'react';
import { Box, Text } from 'ink';

export function AssistantPartMessage({ text }: { text: string }) {
  return (
    <Box flexDirection="column">
      <Text>{text}</Text>
      <Text> </Text>
    </Box>
  );
}
