import { useCallback, useState } from 'react';
import { Agent } from '../agent/index.js';
import { ModelMessage } from 'ai';

type UseAgentResult = {
  messages: ModelMessage[];
  sendMessage: (message: string) => Promise<void>;
  abort: () => void;
};

export function useAgent(): UseAgentResult {
  const [messages, setMessages] = useState<ModelMessage[]>([]);
  const [agent] = useState<Agent>(() => {
    let instance: Agent;
    instance = new Agent({
      onUpdate: () => {
        setMessages([...instance.messages]);
      },
    });
    return instance;
  });

  const sendMessage = useCallback(
    (message: string) => agent.sendMessage(message),
    [agent],
  );

  const abort = useCallback(() => agent.abort(), [agent]);

  return {
    messages,
    sendMessage,
    abort,
  };
}
