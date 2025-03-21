# Gold Price Tracker Bot

A Telegram bot that tracks gold and currency prices, allowing users to manage their portfolios and receive price notifications.

## Features

- **Real-time Price Tracking**: Get current prices for different types of gold and currencies
- **Price History**: View price history for gold and currencies for custom date ranges
- **Portfolio Management**: Add, view, and remove items from your portfolio
- **Subscription System**: Get notifications when prices change for your subscribed assets
- **Comprehensive Asset Support**: Supports many types of gold (gram, quarter, half, full, etc.) and multiple currency pairs

## Commands

- `/fiyat [CODE]` - Get the current price of a specific gold type or currency
- `/fiyat_gecmisi [CODE] [DAYS]` - View price history for a specific asset (default: 7 days)
- `/portfoy_ekle [CODE] [AMOUNT] [PRICE] [DATE]` - Add an item to your portfolio
- `/portfoy` - View your portfolio
- `/portfoy_sil [ID]` - Remove an item from your portfolio
- `/takip [CODE]` - Subscribe to price notifications for a specific asset
- `/durdur [CODE]` - Unsubscribe from price notifications
- `/durdur_hepsi` - Unsubscribe from all price notifications
- `/liste` - View your subscriptions
- `/turleri_goster` - Show all available asset types

## Tech Stack

- Node.js
- TypeScript
- MySQL
- WebSocket for real-time price updates
- Telegram Bot API

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/gold-price-tracker.git
cd gold-price-tracker
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
Create a `.env` file with the following variables:
```
BOT_TOKEN=your_telegram_bot_token
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
```

4. Set up the database
```bash
npm run setup-db
```

5. Start the bot
```bash
npm start
```

## License

MIT License

## Contributions

Contributions are welcome! Please feel free to submit a Pull Request. 