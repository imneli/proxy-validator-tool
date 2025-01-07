# 🌐 Proxy Validator

A robust and efficient proxy validator tool that collects, validates, and manages proxy lists from multiple sources. It features automated validation, Discord integration for reporting, and detailed terminal feedback.

## ✨ Features

- Multi-source proxy collection from configurable endpoints
- Intelligent proxy validation with multiple check endpoints
- Automated backup sources if primary sources fail
- Beautiful terminal interface with real-time progress tracking
- Discord webhook integration for validation reports
- Automatic proxy list saving with timestamps
- Configurable validation parameters
- Support for HTTP, HTTPS, SOCKS4, and SOCKS5 proxies

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/imneli/proxy-validator

# Navigate to the project directory
cd proxy-validator

# Install dependencies
npm install
```

## 📋 Requirements

- Node.js 16.x or higher
- npm or yarn
- Discord webhook URL (optional, for reporting)

## 🛠️ Configuration

1. Create a `.env` file in the project root:
```env
DISCORD_WEBHOOK=your_webhook_url_here
```

2. (Optional) Modify proxy sources in `config.ts`:
```typescript
export const PROXY_SOURCES = [
    // Add your preferred proxy sources here
];
```

## 💻 Usage

```bash
# Run with default settings
npm install

# Run the script
node index.js

```

## 📊 Output

The validator generates two types of output:
1. A text file containing valid proxies in the `proxies` directory
2. A detailed Discord report (if webhook is configured)

## 📝 License

MIT License - feel free to use and modify for your needs.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.