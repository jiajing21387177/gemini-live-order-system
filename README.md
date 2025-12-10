# Gemini Live Order System

[English](#gemini-live-order-system) | [繁體中文](#gemini-live-訂餐系統)

A real-time voice-activated food ordering system powered by Google's Gemini Live API. This application demonstrates how to build an interactive voice agent that can understand natural language, manage a shopping cart, and guide users through a menu.

## Features

- **Real-time Voice Interaction**: Converse naturally with the AI to browse the menu and place orders.
- **Live Audio Streaming**: Uses WebSockets and AudioWorklets for low-latency audio input and output.
- **Context-Aware Menu**: The AI has access to the full menu and can answer questions about ingredients, prices, and recommendations.
- **Shopping Cart Management**: Add and remove items from your cart using voice commands.
- **Visual Feedback**: Real-time audio visualizer and dynamic UI updates for cart and menu state.
- **Tool Calling**: Demonstrates Gemini's function calling capabilities to interact with the application state (e.g., `addToCart`, `searchMenu`).

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5
- **Styling**: Tailwind CSS (v4)
- **Build Tool**: Vite
- **AI Model**: Google Gemini 2.5 Flash (via `@google/genai` SDK)
- **Audio Processing**: Web Audio API, AudioWorklets

## Prerequisites

- Node.js (v18 or higher)
- A Google Cloud Project with the Gemini API enabled
- An API Key for Gemini

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/gemini-live-order-system.git
   cd gemini-live-order-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to the local server address (usually `http://localhost:5173`).

3. Enter your Gemini API Key in the input field.

4. Click **Start** to begin the session.

5. Speak to the AI to order food!
   - "What's on the menu?"
   - "I'd like a burger and fries."
   - "What drinks do you have?"
   - "Remove the salad from my cart."
   - "I'm ready to checkout."

## Deployment

This project is configured for deployment to **GitHub Pages**.

1. Go to **Settings > Pages** in your GitHub repository.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. The included workflow `.github/workflows/deploy.yml` will automatically build and deploy the application on every push to the `master` branch.

**Note**: The `vite.config.js` is configured with `base: '/gemini-live-order-system/'` to support GitHub Pages hosting in a subdirectory. If you deploy to a custom domain or the root of a server, you may need to adjust this value.

## License

MIT

---

# Gemini Live 訂餐系統

這是一個由 Google Gemini Live API 驅動的即時語音訂餐系統。本應用程式展示了如何構建一個能夠理解自然語言、管理購物車並引導使用者瀏覽菜單的互動式語音代理。

## 功能特色

- **即時語音互動**：與 AI 自然對話以瀏覽菜單並下單。
- **即時音訊串流**：使用 WebSockets 和 AudioWorklets 實現低延遲的音訊輸入和輸出。
- **情境感知菜單**：AI 可以存取完整菜單，並回答有關成分、價格和推薦的問題。
- **購物車管理**：使用語音指令將商品加入購物車或從中移除。
- **視覺回饋**：即時音訊視覺化效果，以及購物車和菜單狀態的動態 UI 更新。
- **工具呼叫 (Tool Calling)**：展示 Gemini 的函式呼叫能力，以與應用程式狀態互動（例如：`addToCart`、`searchMenu`）。

## 技術堆疊

- **前端**：原生 JavaScript (ES Modules), HTML5
- **樣式**：Tailwind CSS (v4)
- **建置工具**：Vite
- **AI 模型**：Google Gemini 2.5 Flash (透過 `@google/genai` SDK)
- **音訊處理**：Web Audio API, AudioWorklets

## 先決條件

- Node.js (v18 或更高版本)
- 已啟用 Gemini API 的 Google Cloud 專案
- Gemini API 金鑰

## 安裝

1. 複製儲存庫：
   ```bash
   git clone https://github.com/YOUR_USERNAME/gemini-live-order-system.git
   cd gemini-live-order-system
   ```

2. 安裝依賴套件：
   ```bash
   npm install
   ```

## 使用方法

1. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

2. 開啟瀏覽器並前往本機伺服器位址（通常為 `http://localhost:5173`）。

3. 在輸入欄位中輸入您的 Gemini API 金鑰。

4. 點擊 **Start** 開始工作階段。

5. 對著 AI 說話來點餐！
   - "菜單上有什麼？" (What's on the menu?)
   - "我想要一個漢堡和薯條。" (I'd like a burger and fries.)
   - "你們有什麼飲料？" (What drinks do you have?)
   - "把沙拉從我的購物車移除。" (Remove the salad from my cart.)
   - "我準備好結帳了。" (I'm ready to checkout.)

## 部署

本專案已設定為部署至 **GitHub Pages**。

1. 前往 GitHub 儲存庫中的 **Settings > Pages**。
2. 在 **Build and deployment** 下方，選擇 **GitHub Actions** 作為來源。
3. 包含的 workflow `.github/workflows/deploy.yml` 將會在每次推送到 `master` 分支時自動建置並部署應用程式。

**注意**：`vite.config.js` 已設定 `base: '/gemini-live-order-system/'` 以支援 GitHub Pages 託管在子目錄中。如果您部署到自訂網域或伺服器根目錄，您可能需要調整此值。

## 授權

MIT
