import React from 'react';
import { Box } from 'ink';
import { Input } from './input.js';
import { Messages } from './messages.js';
import { useAgent } from './use-agent.js';

export function App() {
  const { messages, modelId, sendMessage, abort, clear } = useAgent();

  const handleSubmit = (message: string) => {
    void sendMessage(message);
  };

  return (
    <Box flexDirection="column" height="100%">
      <Messages messages={messages} model={modelId} />
      <Input onSubmit={handleSubmit} onAbort={abort} onClear={clear} />
    </Box>
  );
}
