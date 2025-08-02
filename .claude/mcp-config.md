# MCP Server Configuration for ImageCraft Pro

## Claude Code MCP Configuration Locations

### Configuration Files
- **Global Config**: `~/.claude/settings.json` (permissions only)
- **Local Project Config**: `.claude/settings.local.json` (project-specific permissions)
- **MCP Servers**: Managed via `claude mcp` command

### Managing MCP Servers
```bash
# List all configured MCP servers
claude mcp list

# Add a new MCP server
claude mcp add <name> <command> [args...]

# Remove an MCP server
claude mcp remove <name>

# Get details about an MCP server
claude mcp get <name>

# Import from Claude Desktop
claude mcp add-from-claude-desktop
```

## Currently Installed MCP Servers

### IDE Integration (Built-in)
- **Purpose**: VS Code integration
- **Automatically Available**: When using Claude Code in VS Code
- **Tools Available**:
  - `mcp__ide__getDiagnostics`: Get language diagnostics from VS Code
  - `mcp__ide__executeCode`: Execute Python code in Jupyter notebooks
- **Use for**:
  - Getting TypeScript/JavaScript errors
  - Running code in notebooks
  - IDE-specific operations

### 1. **filesystem** (Always Active)
- **Purpose**: File operations, code reading/writing
- **Use for**: All file-related tasks
- **Installation**: 
  ```bash
  claude mcp add filesystem npx -- -y @modelcontextprotocol/server-filesystem /Users/sharvin
  ```
- **Tools Available**:
  - `mcp__filesystem__read_file`: Read file contents
  - `mcp__filesystem__read_multiple_files`: Read multiple files at once
  - `mcp__filesystem__write_file`: Create or overwrite files
  - `mcp__filesystem__edit_file`: Make line-based edits
  - `mcp__filesystem__create_directory`: Create directories
  - `mcp__filesystem__list_directory`: List directory contents
  - `mcp__filesystem__list_directory_with_sizes`: List with file sizes
  - `mcp__filesystem__directory_tree`: Get recursive tree view
  - `mcp__filesystem__move_file`: Move or rename files
  - `mcp__filesystem__search_files`: Search for files by pattern
  - `mcp__filesystem__get_file_info`: Get file metadata
  - `mcp__filesystem__list_allowed_directories`: List accessible directories

### 2. **shadcn-ui**
- **Purpose**: Modern UI component library (v4)
- **Use for**: 
  - Adding new UI components
  - Replacing custom components with battle-tested alternatives
  - Implementing accessible UI patterns
- **Installation**:
  ```bash
  claude mcp add shadcn-ui npx -- @jpisnice/shadcn-ui-mcp-server --github-api-key YOUR_GITHUB_TOKEN
  ```
- **Tools Available**:
  - `mcp__shadcn-ui__list_components`: Get all available components
  - `mcp__shadcn-ui__get_component`: Get component source code
  - `mcp__shadcn-ui__get_component_demo`: Get component demo code
  - `mcp__shadcn-ui__get_component_metadata`: Get component metadata
  - `mcp__shadcn-ui__get_directory_structure`: Browse repository structure
  - `mcp__shadcn-ui__get_block`: Get shadcn/ui blocks (dashboards, etc.)
  - `mcp__shadcn-ui__list_blocks`: List available blocks by category

### 3. **contrasts** (Not Currently Installed)
- **Purpose**: Accessibility and color contrast checking
- **Use for**:
  - Verifying glass morphism contrast ratios
  - Checking text readability on gradient backgrounds
  - Ensuring WCAG compliance
- **Priority**: HIGH - ImageCraft Pro uses glass morphism design
- **Installation**:
  ```bash
  claude mcp add contrasts npx -- -y @modelcontextprotocol/server-contrasts
  ```
- **Tools Available**:
  - Check color contrast ratios
  - Verify WCAG AA/AAA compliance
  - Test text on various backgrounds

### 4. **framelink-figma-mcp**
- **Purpose**: Figma design integration
- **Use for**:
  - Extracting design tokens
  - Downloading design assets
  - Syncing with design system
- **Note**: Only use if Figma files are provided
- **Installation**:
  ```bash
  claude mcp add framelink-figma-mcp npx -- -y figma-developer-mcp --figma-api-key YOUR_FIGMA_API_KEY --stdio
  ```
- **Tools Available**:
  - `mcp__framelink-figma-mcp__get_figma_data`: Get comprehensive Figma file data
  - `mcp__framelink-figma-mcp__download_figma_images`: Download SVG/PNG images from Figma

### 5. **context7**
- **Purpose**: Up-to-date documentation and code examples
- **Use for**:
  - Getting real-time, version-specific documentation
  - Fetching accurate code examples for any library
  - Avoiding outdated or hallucinated APIs
- **Installation**:
  ```bash
  # HTTP endpoint (already configured)
  claude mcp add context7 https://mcp.context7.com/mcp
  
  # Or via NPX
  claude mcp add context7 npx -- -y @upstash/context7-mcp
  ```
- **Tools Available**: 
  - `resolve-library-id`: Find library ID from package name
  - `get-library-docs`: Fetch documentation with examples
- **Usage**: Add "use context7" to prompts when needing current docs

## Task-Based MCP Selection

### Adding New Features
1. **Primary**: filesystem (for code implementation)
2. **Secondary**: shadcn-ui (for UI components)
3. **Tertiary**: contrasts (for accessibility verification)
4. **Optional**: context7 (for latest library docs)

### UI Component Development
1. **Primary**: filesystem
2. **Secondary**: shadcn-ui (check for existing solutions)
3. **Tertiary**: contrasts (verify accessibility)

### Accessibility Improvements
1. **Primary**: filesystem
2. **Secondary**: contrasts (analyze current state)
3. **Optional**: shadcn-ui (for accessible alternatives)

### Design System Updates
1. **Primary**: filesystem
2. **Secondary**: framelink-figma-mcp (if Figma available)
3. **Tertiary**: contrasts (verify changes)

## ImageCraft Pro Specific Considerations

### Glass Morphism Design
- **Always use contrasts MCP** when working with:
  - Semi-transparent backgrounds
  - Backdrop blur effects
  - Text over images
  - Gradient overlays

### PWA Requirements
- **Use filesystem MCP** exclusively for:
  - Service worker modifications
  - Manifest updates
  - Offline functionality

### Image Processing
- **Primary**: filesystem for implementation
- **Secondary**: contrasts for UI visibility during processing

## MCP Usage Priority Matrix

| Component Type | filesystem | shadcn-ui | contrasts | framelink | context7  |
|----------------|------------|-----------|-----------|-----------|-----------|
| Glass Cards    | ✓          | Consider  | Required  | Optional  | -         |
| Image Tools    | ✓          | -         | ✓         | -         | Consider  |
| Navigation     | ✓          | ✓         | ✓         | -         | Consider  |
| Forms          | ✓          | ✓         | ✓         | -         | Consider  |
| Modals         | ✓          | ✓         | ✓         | -         | -         |

## Best Practices

1. **Always start with filesystem** - Read existing code first
2. **Check shadcn-ui** before creating custom components
3. **Verify with contrasts** for any UI with transparency
4. **Use framelink** only when design specs are provided
5. **Use context7** when working with external libraries for current docs

## Common Patterns

### Pattern 1: Adding Accessible Component
```
1. filesystem: Read current component structure
2. shadcn-ui: Check for suitable base component
3. filesystem: Implement with modifications
4. contrasts: Verify accessibility
5. filesystem: Apply fixes if needed
```

### Pattern 2: Improving Existing UI
```
1. filesystem: Analyze current implementation
2. contrasts: Check accessibility issues
3. shadcn-ui: Find better alternatives
4. filesystem: Refactor with improvements
```

### Pattern 3: Design System Compliance
```
1. filesystem: Review design tokens
2. framelink: Extract latest design specs (if available)
3. filesystem: Update tokens
4. contrasts: Verify all variations
```

### Pattern 4: Implementing with External Libraries
```
1. context7: Get current library documentation
2. filesystem: Read existing integration points
3. filesystem: Implement using latest API
4. contrasts: Verify UI components (if applicable)
```

## Context7 Usage Examples

### Getting React Documentation
```
# In your prompt:
"Create a React component with hooks. use context7"

# MCP will:
1. Call resolve-library-id with "react"
2. Call get-library-docs with the resolved ID
3. Provide current React docs and examples
```

### Getting Next.js App Router Docs
```
# In your prompt:
"Implement Next.js middleware with app router. use context7"

# MCP will fetch latest Next.js docs specific to app router
```

### Library-Specific Topics
```
# In your prompt:
"Show me Tailwind CSS animation utilities. use context7"

# MCP will fetch Tailwind docs focused on animations
```

## Popular MCP Servers to Install

### Development Tools

#### **puppeteer**
- **Purpose**: Browser automation and web scraping
- **Installation**:
  ```bash
  claude mcp add puppeteer npx -- -y @modelcontextprotocol/server-puppeteer
  ```
- **Use for**: Testing, screenshots, web scraping, automation

#### **github**
- **Purpose**: GitHub repository operations
- **Installation**:
  ```bash
  claude mcp add github npx -- -y @modelcontextprotocol/server-github --token YOUR_GITHUB_TOKEN
  ```
- **Use for**: Managing repos, issues, PRs, releases

#### **gitlab**
- **Purpose**: GitLab operations
- **Installation**:
  ```bash
  claude mcp add gitlab npx -- -y @modelcontextprotocol/server-gitlab --token YOUR_GITLAB_TOKEN
  ```

#### **postgres**
- **Purpose**: PostgreSQL database operations
- **Installation**:
  ```bash
  claude mcp add postgres npx -- -y @modelcontextprotocol/server-postgres postgresql://user:pass@host/db
  ```

#### **sqlite**
- **Purpose**: SQLite database operations
- **Installation**:
  ```bash
  claude mcp add sqlite npx -- -y @modelcontextprotocol/server-sqlite /path/to/database.db
  ```

### AI & Analytics

#### **brave-search**
- **Purpose**: Web search using Brave Search API
- **Installation**:
  ```bash
  claude mcp add brave-search npx -- -y @modelcontextprotocol/server-brave-search --api-key YOUR_BRAVE_API_KEY
  ```

#### **exa**
- **Purpose**: AI-powered search
- **Installation**:
  ```bash
  claude mcp add exa npx -- -y @modelcontextprotocol/server-exa --api-key YOUR_EXA_API_KEY
  ```

### Communication

#### **slack**
- **Purpose**: Slack workspace integration
- **Installation**:
  ```bash
  claude mcp add slack npx -- -y @modelcontextprotocol/server-slack --bot-token YOUR_BOT_TOKEN
  ```

#### **gmail**
- **Purpose**: Gmail operations
- **Installation**:
  ```bash
  claude mcp add gmail npx -- -y @modelcontextprotocol/server-gmail --credentials /path/to/credentials.json
  ```

### Utilities

#### **fetch**
- **Purpose**: Make HTTP requests
- **Installation**:
  ```bash
  claude mcp add fetch npx -- -y @modelcontextprotocol/server-fetch
  ```

#### **memory**
- **Purpose**: Knowledge graph for persistent memory
- **Installation**:
  ```bash
  claude mcp add memory npx -- -y @modelcontextprotocol/server-memory
  ```

#### **time**
- **Purpose**: Time and timezone operations
- **Installation**:
  ```bash
  claude mcp add time npx -- -y @modelcontextprotocol/server-time
  ```

## Quick Installation Reference

### Basic NPX Installation Pattern
```bash
claude mcp add <server-name> npx -- -y <package-name> [options]
```

### HTTP Endpoint Pattern
```bash
claude mcp add <server-name> <https-url>
```

### With Environment Variables
```bash
claude mcp add <server-name> npx -- -y <package-name> --env-var VALUE
```

### Removing MCP Servers
```bash
# Remove from local project
claude mcp remove <server-name> -s local

# Remove from global config
claude mcp remove <server-name> -s global
```

## Troubleshooting MCP Servers

### Check Connection Status
```bash
claude mcp list
```

### View Server Details
```bash
claude mcp get <server-name>
```

### Common Issues
1. **Server not connecting**: Check API keys and network access
2. **Permission denied**: Add to `.claude/settings.local.json` permissions
3. **Tool not found**: Ensure MCP server is connected and healthy

## Project-Specific MCP Configuration

For team projects, you can create `.mcp.json` in the project root:
```json
{
  "mcpServers": {
    "radix-ui": {
      "command": "npx",
      "args": ["@gianpieropuleo/radix-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-github-token-here"
      }
    },
    "your-server": {
      "command": "npx",
      "args": ["-y", "@your/mcp-server"],
      "env": {
        "API_KEY": "${YOUR_API_KEY}"
      }
    }
  }
}
```

Team members will be prompted to approve project-scoped servers on first use.

## Quick Reference Card

### Essential Commands
```bash
# Add MCP server
claude mcp add <name> <command> [args...]

# List all servers
claude mcp list

# Remove server
claude mcp remove <name>

# Get server info
claude mcp get <name>
```

### Common Installation Patterns

#### NPX Package
```bash
claude mcp add <name> npx -- -y @org/package-name
```

#### NPX with API Key
```bash
claude mcp add <name> npx -- -y @org/package --api-key YOUR_KEY
```

#### HTTP Endpoint
```bash
claude mcp add <name> https://api.example.com/mcp
```

#### Local Script
```bash
claude mcp add <name> node /path/to/server.js
```

### Currently Active Servers in This Project
1. **filesystem** - File operations
2. **shadcn-ui** - UI components
3. **framelink-figma-mcp** - Figma integration
4. **context7** - Up-to-date docs
5. **ide** - VS Code integration (built-in)

### Recommended for ImageCraft Pro
- ✅ **contrasts** - Critical for glass morphism accessibility
- ✅ **puppeteer** - For screenshot/testing features
- ✅ **github** - For version control integration