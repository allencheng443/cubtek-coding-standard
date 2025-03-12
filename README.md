# CubTEK Coding Standard Extension

A Visual Studio Code extension that provides formatting and checking capabilities for C/C++ code according to CubTEK's coding standards.

## Features

This extension provides the following features:

- **Automatic Code Formatting**: Formats your C/C++ code according to CubTEK's coding standards using clang-format
- **Code Style Checking**: Validates your code against CubTEK's coding standards
- **Real-time Diagnostics**: Shows coding standard violations as you type
- **Project-wide Analysis**: Ability to check entire projects for compliance
- **Compliance Reports**: Generate detailed compliance reports for your codebase

### Commands

The extension provides several commands accessible through the command palette:

- `CubTEK: Check Current File` - Check the currently open file against coding standards
- `CubTEK: Check Entire Project` - Run a compliance check on the entire project
- `CubTEK: Show Compliance Report` - Generate and display a coding standard compliance report

## Requirements

- Visual Studio Code ^1.98.0
- clang-format (for code formatting)
- C/C++ files in your workspace

## Installation

1. Install Visual Studio Code 1.98.0 or higher
2. Install clang-format on your system
3. Install this extension from the VS Code marketplace

## Extension Settings

This extension contributes the following settings:

- `cubtek.formatOnSave`: Enable/disable automatic formatting on save (default: `true`)
- `cubtek.checkOnSave`: Enable/disable coding standard checking on save (default: `true`)
- `cubtek.severity`: Set the severity level for diagnostics (`"error"`, `"warning"`, `"information"`, `"hint"`) (default: `"warning"`)
- `cubtek.configPath`: Specify a custom path to the configuration file

## Configuration

The extension uses `.clang-format` for formatting rules. A default configuration is provided, but you can customize it by creating a `.clang-format` file in your project root.

Example `.clang-format` configuration:

```yaml
Language: Cpp
IndentWidth: 4
UseTab: Never
BreakBeforeBraces: Allman
SpaceBeforeParens: ControlStatements
SpaceAfterCStyleCast: true
SpaceBeforeAssignmentOperators: true
IndentCaseLabels: false
ColumnLimit: 100
AlignTrailingComments: true
```

## Known Issues

- The extension currently only supports C/C++ files
- Formatting requires clang-format to be installed on the system

## Release Notes

### 0.1.0

Initial release of CubTEK Coding Standard extension:

- Basic code formatting support
- Coding standard validation
- Project-wide analysis capabilities
- Configuration options for formatting and checking

## Contributing

The extension is open for contributions. Please feel free to submit issues and pull requests on our repository.

## License

This extension is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Support

If you encounter any problems or have suggestions, please file an issue on our [GitHub repository](https://github.com/allencheng443/cubtek-coding-standard).

---

**Note**: This extension is currently in development. Features and configurations may change in future releases.
