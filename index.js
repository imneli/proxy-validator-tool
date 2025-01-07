import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import FormData from 'form-data';
import chalk from 'chalk';

// proxy sources (can be TXT lists, APIs, or raw GitHub files) // fontes de proxy (podem ser listas em txt ou APIs, ou em arquivos 
export const PROXY_SOURCES = [
    "example.com/proxies.txt",
    "example.com/proxies.txt",
    "example.com/proxies.txt",
    "example.com/proxies.txt",
];

// packup sources (in case the main sources fail, these will be used) //  fontes de backup (caso as fontes principais falhem, essas serão usadas)
export const BACKUP_PROXY_SOURCES = [
    "https://www.proxyscan.io/download?type=http",
    "https://www.proxyscan.io/download?type=https",
    "https://www.proxyscan.io/download?type=socks4",
    "https://www.proxyscan.io/download?type=socks5",
    "https://raw.githubusercontent.com/hendrikbgr/Free-Proxy-List/master/free-proxy-list.txt",
    "https://raw.githubusercontent.com/opsxcq/proxy-list/master/list.txt"
];

export class ProxyValidator {
    checkUrls = [
        'http://httpbin.org/ip',
        'https://api.ipify.org?format=json',
        'http://ip-api.com/json/',
    ];
    allProxies = new Set();
    validProxies = new Set();
    axiosInstance;
    discordWebhook;

    constructor(discordWebhook) {
        this.discordWebhook = discordWebhook;
        this.axiosInstance = axios.create({
            timeout: 10000,
            headers: {
                'User-Agent': 'ProxyValidator/1.0'
            }
        });
    }

    _log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colorMap = {
            'success': chalk.green,
            'error': chalk.red,
            'info': chalk.blue,
            'warning': chalk.yellow
        };
        const colorFunc = colorMap[type];
        console.log(colorFunc(`[${timestamp}] ${this._getEmoji(type)} ${message}`));
    }

    _getEmoji(type) {
        const emojiMap = {
            'success': '✅',
            'error': '❌',
            'info': '🔍',
            'warning': '⚠️'
        };
        return emojiMap[type] || '';
    }

    async fetchFromSource(source) {
        try {
            const response = await this.axiosInstance.get(source);
            const proxyRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)/g;
            const proxies = new Set();
            let match;
            while ((match = proxyRegex.exec(response.data)) !== null) {
                proxies.add(`${match[1]}:${match[2]}`);
            }
            this._log(`Collected ${proxies.size} proxies from ${source}`, 'success');
            return proxies;
        } catch (error) {
            if (error instanceof Error) {
                this._log(`Error collecting from ${source}: ${error.message}`, 'error');
            } else {
                this._log(`Error collecting from ${source}: Unknown error`, 'error');
            }
            return new Set();
        }
    }

    async validateProxy(proxy) {
        const checkUrl = this.checkUrls[Math.floor(Math.random() * this.checkUrls.length)];
        try {
            const [host, port] = proxy.split(':');
            const response = await this.axiosInstance.get(checkUrl, {
                proxy: {
                    host,
                    port: parseInt(port)
                }
            });
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }

    async fetchAllProxies() {
        this._log('Starting to collect proxies from all sources...');
        const fetchPromises = PROXY_SOURCES.map(source => this.fetchFromSource(source));
        const results = await Promise.all(fetchPromises);
        results.forEach(proxySet => {
            proxySet.forEach(proxy => this.allProxies.add(proxy));
        });
        this._log(`Total proxies collected: ${this.allProxies.size}`, 'success');
    }

    async validateProxies(sampleSize = 5000) {
        this._log('Starting proxy validation...');
        const proxiesList = Array.from(this.allProxies);
        const shuffledProxies = proxiesList
            .sort(() => 0.5 - Math.random())
            .slice(0, sampleSize);
        const validationPromises = shuffledProxies.map(async (proxy) => ({
            proxy,
            isValid: await this.validateProxy(proxy)
        }));
        const results = await Promise.all(validationPromises);
        results.forEach(({ proxy, isValid }) => {
            if (isValid) this.validProxies.add(proxy);
        });
        this._log(`Valid proxies: ${this.validProxies.size}`, 'success');
    }

    async saveProxies() {
        try {
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const filename = `valid_proxies_${timestamp}.txt`;
            const filepath = path.join('proxies', filename);
            await fs.mkdir('proxies', { recursive: true });
            await fs.writeFile(filepath, Array.from(this.validProxies).join('\n'));
            this._log(`Proxies saved to ${filepath}`, 'success');
            return filepath;
        } catch (error) {
            this._log(`Error saving proxies: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            return null;
        }
    }

    async sendToDiscord(filepath) {
        try {
            const form = new FormData();
            form.append('file', await fs.readFile(filepath), {
                filename: path.basename(filepath),
                contentType: 'text/plain'
            });
            form.append('payload_json', JSON.stringify({
                content: '',
                embeds: [
                    {
                        color: 0x000000,
                        title: "📡 **Proxy Validation Report** 📡",
                        description: "Here is a detailed summary of proxy collection and validation.",
                        fields: [
                            {
                                name: "🌍 **Total Proxies Collected**",
                                value: `\`\`\`${this.allProxies.size}\`\`\``,
                                inline: true
                            },
                            {
                                name: "✅ **Valid Proxies**",
                                value: `\`\`\`${this.validProxies.size}\`\`\``,
                                inline: true
                            },
                            {
                                name: "📅 **Validation Date**",
                                value: `\`\`\`${new Date().toLocaleString()}\`\`\``,
                                inline: false
                            },
                            {
                                name: "🔍 **Validation Details**",
                                value: `- Collected from various trusted sources.\n` +
                                    `- Validation was performed on a large number of proxies ensuring accuracy and quality.\n` +
                                    `- Sources include public lists, APIs, and international proxies.\n`,
                                inline: false
                            },
                            {
                                name: "📂 **Proxy File**",
                                value: "The file with the list of valid proxies has been generated and is attached.",
                                inline: false
                            }
                        ],
                        image: {
                            url: "https://i.pinimg.com/736x/3b/d9/dc/3bd9dc9c89ad67c4b0992680bb248cb8.jpg"
                        },
                        footer: {
                            text: 'Proxy Validator - 2025',
                            icon_url: 'https://avatars.githubusercontent.com/u/154631371?v=4&size=64'
                        },
                        timestamp: new Date()
                    }
                ]
            }));
            await this.axiosInstance.post(this.discordWebhook, form, {
                headers: form.getHeaders()
            });
            this._log('Report successfully sent to Discord!', 'success');
        } catch (error) {
            this._log(`Error sending to Discord: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        }
    }
}

(async () => {
    const discordWebhook = process.env.DISCORD_WEBHOOK || 'YOUR_WEBHOOK_HERE'; // replace with your webhook or add it to .env! // mude para seu webhook ou adicione ao .env
    const validator = new ProxyValidator(discordWebhook);
    await validator.fetchAllProxies();
    await validator.validateProxies();
    const filepath = await validator.saveProxies();
    if (filepath) {
        await validator.sendToDiscord(filepath);
    }
})();
