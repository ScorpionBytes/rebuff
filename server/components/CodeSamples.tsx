import { FC } from "react";
import { Space, Tabs, Title, Box } from "@mantine/core";
import { Prism } from "@mantine/prism";

const CodeSamples: FC = () => {
  return (
    <div className="max-w-sm">
      <Title order={4}>Code</Title>
      <Tabs color="dark" defaultValue="py">
        <Tabs.List>
          <Tabs.Tab value="py">Python</Tabs.Tab>
          <Tabs.Tab value="js">Javascript</Tabs.Tab>
          <Tabs.Tab value="py-langchain">LangChain</Tabs.Tab>
          <Tabs.Tab value="curl">cURL</Tabs.Tab>
        </Tabs.List>
        <Space h="xl" />
        <Tabs.Panel value="js" pt="xs">
          <Space h="sm" />
          <Prism
            language="tsx"
            copyLabel="Copy code to clipboard"
            copiedLabel="Code copied to clipboard"
          >
            {`const promptGuard = require("prompt-guard");
promptGuard.detect(prompt);`}
          </Prism>
        </Tabs.Panel>
        <Tabs.Panel value="py" pt="xs">
          <Space h="sm" />
          <Prism
            language="tsx"
            copyLabel="Copy code to clipboard"
            copiedLabel="Code copied to clipboard"
          >
            {" "}
          </Prism>
        </Tabs.Panel>
        <Tabs.Panel value="curl" pt="xs">
          <Space h="sm" />
          <Prism
            language="tsx"
            copyLabel="Copy code to clipboard"
            copiedLabel="Code copied to clipboard"
          >
            {" "}
          </Prism>
        </Tabs.Panel>
        <Tabs.Panel value="py-langchain" pt="xs">
          <Space h="sm" />
          <Prism
            language="tsx"
            copyLabel="Copy code to clipboard"
            copiedLabel="Code copied to clipboard"
          >
            {" "}
          </Prism>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default CodeSamples;
