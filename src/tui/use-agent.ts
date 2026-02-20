import { useCallback, useState } from 'react';
import { Agent, type GentMessage } from '../agent/index.js';

type UseAgentResult = {
  messages: GentMessage[];
  modelId: string;
  sendMessage: (message: string) => Promise<void>;
  abort: () => void;
  clear: (beforeClear?: () => void) => Promise<void>;
};

export function useAgent(): UseAgentResult {
  const [messages, setMessages] = useState<GentMessage[]>([]);
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

  const clear = useCallback((beforeClear?: () => void) => agent.clear(beforeClear), [agent]);

  return {
    messages,
    modelId: agent.modelId,
    sendMessage,
    abort,
    clear,
  };
}
