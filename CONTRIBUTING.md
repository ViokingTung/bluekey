# Contributing to BlueKey / 参与贡献

First off, thank you for considering contributing to BlueKey! 🎉 
首先，感谢您有意向为 BlueKey 贡献代码！🎉

It's people like you that make BlueKey such a great tool.

## 🛠️ Local Development Environment

To start developing BlueKey locally, follow these steps:

1. **Fork the repo** to your own GitHub account.
2. **Clone** your fork to your local machine:
   \`\`\`bash
   git clone https://github.com/YOUR_USERNAME/bluekey.git
   cd bluekey
   \`\`\`
3. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`
4. **Start the development server**:
   \`\`\`bash
   npm run tauri dev
   \`\`\`

## 📝 Commit Message Guidelines

We recommend writing commit messages that are clear and descriptive. A good format to follow is the Conventional Commits specification:

- \`feat:\` A new feature
- \`fix:\` A bug fix
- \`docs:\` Documentation only changes
- \`style:\` Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- \`refactor:\` A code change that neither fixes a bug nor adds a feature
- \`perf:\` A code change that improves performance

## 📥 Pull Request Process

1. Create a new branch for your feature or bugfix (\`git checkout -b feat/my-new-feature\`).
2. Commit your changes.
3. Push the branch to your fork.
4. Open a Pull Request from your branch to the \`main\` branch of the upstream repository.
5. Ensure your PR description clearly describes the problem and solution. It should include the relevant issue number if applicable.

We will review your PR as soon as possible. Thank you!
