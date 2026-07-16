import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
    // Co-located with components (e.g. shared/components/ui/Badge.stories.tsx),
    // matching this project's existing convention for tests
    // (Modal.browser.test.tsx sits next to Modal.tsx) rather than a separate
    // top-level stories/ folder. Scoped to actual source dirs (not `../**`) so
    // this never has to walk node_modules.
    stories: [
        "../shared/**/*.stories.@(js|jsx|mjs|ts|tsx)",
        "../features/**/*.stories.@(js|jsx|mjs|ts|tsx)",
        "../app/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    ],
    addons: [
        "@chromatic-com/storybook",
        "@storybook/addon-vitest",
        "@storybook/addon-a11y",
        "@storybook/addon-docs",
        "@storybook/addon-mcp",
    ],
    framework: "@storybook/nextjs-vite",
    staticDirs: ["../public"],
};
export default config;
