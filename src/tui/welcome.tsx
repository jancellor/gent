import React from 'react';
import { Box, Text } from 'ink';
import { homedir } from 'os';

interface WelcomeProps {
  model: string;
}

function shortDir(): string {
  const cwd = process.cwd();
  const home = homedir();
  return cwd.startsWith(home) ? '~' + cwd.slice(home.length) : cwd;
}

export function Welcome({ model }: WelcomeProps) {
  const dir = shortDir();

  return (
    <Box flexDirection="column" paddingLeft={2}>
      <Text> </Text>
      <Text>
        <Text>┌─┐</Text>
        <Text>{'   '}gent</Text>
        <Text> — at your service</Text>
      </Text>
      <Text>
        <Text>┴─┴</Text>
        <Text>{'   '}{model}</Text>
        <Text> · </Text>
        <Text>{dir}</Text>
      </Text>
      <Text> </Text>
    </Box>
  );
}

// Alternative design: two-column with name below hat
//
// export function Welcome({ model }: WelcomeProps) {
//   const dir = shortDir();
//
//   return (
//     <Box flexDirection="column" paddingLeft={2}>
//       <Text>
//         <Text color="#B7A7FF">┌─┐</Text>
//         <Text>{'     '}</Text>
//         <Text>{model}</Text>
//       </Text>
//       <Text>
//         <Text color="#B7A7FF">┴─┴</Text>
//         <Text>{'     '}</Text>
//         <Text>{dir}</Text>
//       </Text>
//       <Text>
//         <Text bold>gent</Text>
//         <Text dimColor>{'    '}/help · /clear</Text>
//       </Text>
//     </Box>
//   );
// }
