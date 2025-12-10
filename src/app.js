import { GoogleGenAI, Modality, Type } from '@google/genai';
import { CartManager } from './cart-manager.js';
import catalog from './data/catalog.json';

const MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

let audioContext;
let mediaStream;
let audioWorkletNode;
let sourceNode;
let session;
let isRecording = false;
let audioQueue = [];
let isPlaying = false;
const cartManager = new CartManager();

const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const apiKeyInput = document.getElementById('apiKey');
const statusElement = document.getElementById('status');
const visualizer = document.querySelector('.visualizer');
const cartPanel = document.getElementById('cart');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalElement = document.getElementById('cartTotal');
const conversationLog = document.getElementById('conversation-log');
const menuItemsContainer = document.getElementById('menu-items');

// Load API Key from local storage
const storedApiKey = localStorage.getItem('gemini_api_key');
if (storedApiKey) {
  apiKeyInput.value = storedApiKey;
}

startButton.addEventListener('click', start);
stopButton.addEventListener('click', stop);

// Render Menu
// Render Menu
function renderMenu(data = catalog) {
  menuItemsContainer.innerHTML = data.categories.map(category => `
    <div class="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div class="flex items-center gap-4 mb-6">
        <h3 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">${category.name}</h3>
        <div class="h-px flex-grow bg-gradient-to-r from-slate-800 to-transparent"></div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${category.products.map(product => `
          <div class="group bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 hover:bg-slate-800/40 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10 flex gap-4">
            ${product.image ? `
            <div class="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-800 relative">
                <img src="${product.image.url}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
            </div>` : ''}
            
            <div class="flex flex-col flex-grow min-w-0">
              <div class="flex justify-between items-start mb-1">
                <span class="font-semibold text-slate-200 truncate pr-2 group-hover:text-blue-400 transition-colors">${product.name}</span>
                <span class="font-bold text-emerald-400 shrink-0">$${product.price}</span>
              </div>
              <p class="text-sm text-slate-500 line-clamp-2 mb-auto leading-relaxed">${product.description}</p>
              
              <div class="mt-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                 <span class="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Voice Command</span>
                 <span class="text-xs text-blue-400 font-medium">"Add ${product.name}"</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

renderMenu();

// Cart Subscription
cartManager.subscribe((items, total) => {
  if (items.length > 0) {
    cartPanel.classList.remove('hidden');
    cartItemsContainer.innerHTML = items.map(item => `
      <div class="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 group hover:border-blue-500/30 transition-colors">
        <div class="flex flex-col">
          <span class="font-medium text-slate-200 group-hover:text-blue-300 transition-colors">${item.name}</span>
          <span class="text-xs text-slate-500">$${item.price} each</span>
        </div>
        <div class="flex items-center gap-3">
             <span class="text-xs font-bold text-slate-400">x${item.quantity}</span>
             <span class="font-semibold text-emerald-400">$${item.price * item.quantity}</span>
        </div>
      </div>
    `).join('');
  } else {
    cartItemsContainer.innerHTML = '<div class="text-center text-slate-500 py-8 italic text-sm">Your cart is empty.<br>Start speaking to order!</div>';
  }
  cartTotalElement.textContent = `$${total}`;
});

function updateStatus(text, type = 'normal') {
  statusElement.innerHTML = `
    <div class="w-2 h-2 rounded-full ${type === 'error' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}"></div>
    ${text}
  `;
  statusElement.className = `hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
    type === 'error' 
      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
      : 'bg-slate-800/50 border-slate-700/50 text-slate-400'
  }`;
}

function logMessage(text, sender = 'ai') {
  const messageDiv = document.createElement('div');
  const isUser = sender === 'user';
  
  messageDiv.className = `flex flex-col max-w-[90%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`;
  
  messageDiv.innerHTML = `
    <div class="px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
        isUser 
            ? 'bg-blue-600 text-white rounded-tr-sm' 
            : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
    }">
        ${text}
    </div>
    <span class="text-[10px] text-slate-600 mt-1 px-1">${isUser ? 'You' : 'Gemini'}</span>
  `;
  
  // Remove empty state if present
  if (conversationLog.children.length === 1 && conversationLog.firstElementChild.innerText.includes('history')) {
    conversationLog.innerHTML = '';
  }

  conversationLog.appendChild(messageDiv);
  conversationLog.scrollTop = conversationLog.scrollHeight;
}
const tools = [
  {
    functionDeclarations: [
      {
        name: "getMenu",
        description: "Get the list of available categories and products in the menu.",
      },
      {
        name: "searchMenu",
        description: "Search for items in the menu based on a query.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: {
              type: Type.STRING,
              description: "The search query (e.g., 'chicken', 'drinks')."
            }
          },
          required: ["query"]
        }
      },
      {
        name: "addToCart",
        description: "Add a product to the shopping cart.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            productName: {
              type: Type.STRING,
              description: "The name of the product to add."
            },
            quantity: {
              type: Type.NUMBER,
              description: "The quantity to add. Defaults to 1."
            }
          },
          required: ["productName"]
        }
      },
      {
        name: "removeFromCart",
        description: "Remove a product from the shopping cart.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            productName: {
              type: Type.STRING,
              description: "The name of the product to remove."
            },
            quantity: {
              type: Type.NUMBER,
              description: "The quantity to remove. Defaults to 1."
            }
          },
          required: ["productName"]
        }
      },
      {
        name: "checkout",
        description: "Checkout the current order.",
      }
    ]
  }
];

// Tool Implementations
async function handleToolCall(toolCall) {
  const functionCalls = toolCall.functionCalls;
  const toolResponses = [];

  for (const call of functionCalls) {
    let response = {};
    
    try {
      if (call.name === 'getMenu') {
        const menu = catalog.categories.map(cat => ({
          category: cat.name,
          products: cat.products.map(p => ({ name: p.name, price: p.price, description: p.description }))
        }));
        response = { menu };
        renderMenu(catalog); // Reset to full menu
      } else if (call.name === 'searchMenu') {
        const { query } = call.args;
        const results = [];
        for (const cat of catalog.categories) {
          const matchingProducts = cat.products.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) || 
            p.description.toLowerCase().includes(query.toLowerCase())
          );
          if (matchingProducts.length > 0) {
            results.push({
              ...cat, // Keep category metadata if any
              name: cat.name,
              products: matchingProducts
            });
          }
        }
        if (results.length > 0) {
            response = { results };
            renderMenu({ categories: results }); // Update UI with search results
        } else {
            response = { message: "No items found matching your query." };
            // Optional: Don't update UI if nothing found, or show empty state?
            // For now, let's keep the previous view or maybe show empty.
            // Let's keep previous view to be less jarring.
        }
      } else if (call.name === 'addToCart') {
        const { productName, quantity } = call.args;
        // Find product in catalog
        let product = null;
        for (const cat of catalog.categories) {
          const found = cat.products.find(p => p.name.toLowerCase().includes(productName.toLowerCase()));
          if (found) {
            product = found;
            break;
          }
        }

        if (product) {
          cartManager.addItem(product, quantity || 1);
          response = { success: true, message: `Added ${quantity || 1} ${product.name} to cart.` };
        } else {
          response = { success: false, message: `Product ${productName} not found.` };
        }
      } else if (call.name === 'removeFromCart') {
        const { productName, quantity } = call.args;
        const success = cartManager.removeItem(productName, quantity || 1);
        if (success) {
          response = { success: true, message: `Removed ${quantity || 1} ${productName} from cart.` };
        } else {
          response = { success: false, message: `Item ${productName} not found in cart.` };
        }
      } else if (call.name === 'checkout') {
        const total = cartManager.getTotal();
        const items = cartManager.items;
        cartManager.clear();
        response = { success: true, message: `Order placed! Total: $${total}. Items: ${items.map(i => i.name).join(', ')}` };
      }
    } catch (e) {
      console.error(e);
      response = { error: e.message };
    }

    toolResponses.push({
      id: call.id,
      name: call.name,
      response: response
    });
  }

  return toolResponses;
}

async function start() {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    updateStatus('Please enter an API Key', 'error');
    return;
  }
  
  // Save to local storage
  localStorage.setItem('gemini_api_key', apiKey);

  try {
    updateStatus('Connecting...');
    startButton.disabled = true;
    apiKeyInput.disabled = true;
    conversationLog.innerHTML = ''; // Clear log on new session

    // Initialize Audio Context
    audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    await audioContext.audioWorklet.addModule('./src/pcm-processor.js');

    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      audio: { 
        channelCount: 1, 
        sampleRate: 16000 
      } 
    });

    sourceNode = audioContext.createMediaStreamSource(mediaStream);
    audioWorkletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
    sourceNode.connect(audioWorkletNode);

    // Connect to Live API
    console.log("Connecting to Live API...")
    const client = new GoogleGenAI({ apiKey });
    session = await client.live.connect({
      model: MODEL,
      config: {
        responseModalities: [Modality.AUDIO],
        tools: tools,
        systemInstruction: `
<system_instructions>
<role>
You are the AI Order Fulfillment System for "AI Delivery".

**Core Responsibilities:**
1. Menu Navigation: Guide users through the menu using simple, bite-sized questions.
2. State Management: Ensure the user's intent matches the tool outputs exactly.
3. Order Management: Help users add items to their cart and checkout.

**Tone:** Helpful, clear, and action-oriented. Avoid long monologues; ask single, direct questions to move the state forward.
</role>

<rules>
1. Keep questions and answers as short as possible.
2. Start with a greeting.
3. Never expose internal IDs.
4. Do not mention prices or descriptions unless explicitly asked.
5. Do not provide reference information or fabricated details or any instruction unless explicitly asked.
6. Limit lists of items or options to a maximum of 3.
7. Ask the user to complete the form and payment at checkout.
</rules>

<tool_usage_rules>
1. getMenu: Retrieve the full list of available categories and products. Use this when the user asks to see the menu or "what do you have".
2. searchMenu: Search for specific items. Use this when the user asks for a specific type of food (e.g. "chicken", "spicy").
3. addToCart: Add the item to the cart.
4. removeFromCart: Remove an item from the cart.
5. checkout: Proceed to checkout.
</tool_usage_rules>

<error_handling>
- If no results: "Not found."
- If tool error: "System Error."
</error_handling>
</system_instructions>
`,
      },
      callbacks: {
        onopen: () => {
          updateStatus('Connected! Listening...');
          stopButton.disabled = false;
          visualizer.classList.add('active');
          isRecording = true;
        },
        onmessage: async (message) => {
          if (message.toolCall) {
            const toolResponses = await handleToolCall(message.toolCall);
            session.sendToolResponse({ functionResponses: toolResponses });
          } else {
            handleMessage(message);
          }
        },
        onerror: (e) => {
          console.error(e);
          updateStatus('Error: ' + e.message, 'error');
          stop();
        },
        onclose: (e) => {
          console.error("Disconnected", e);
          updateStatus('Disconnected');
          stop();
        },
      },
    });

    console.log("Connected to Live API", session);

    audioWorkletNode.port.onmessage = (event) => {
      if (isRecording && session) {
        const inputData = event.data;
        const pcm16 = floatTo16BitPCM(inputData);
        const base64 = arrayBufferToBase64(pcm16);
        try {
          session.sendRealtimeInput({
            audio: {
              data: base64,
              mimeType: "audio/pcm;rate=16000"
            }
          });
        } catch (e) {
          console.error("Error sending audio:", e);
          // If socket is closed, we should stop
          if (!isRecording) return; // Already stopping
          // Don't call stop() here recursively if we can avoid it, or just let the onerror/onclose handle it
        }
      }
    };

  } catch (error) {
    console.error(error);
    updateStatus('Failed to start: ' + error.message, 'error');
    stop();
  }
}

function stop() {
  isRecording = false;
  visualizer.classList.remove('active');
  
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }
  
  if (audioContext) {
    audioContext.close();
  }
  
  session = null; // Clear session to prevent further sends

  startButton.disabled = false;
  stopButton.disabled = true;
  apiKeyInput.disabled = false;
  updateStatus('Stopped');
}

function handleMessage(message) {
  if (message.serverContent && message.serverContent.interrupted) {
    audioQueue = [];
    isPlaying = false;
    return;
  }

  if (message.serverContent && message.serverContent.modelTurn && message.serverContent.modelTurn.parts) {
    for (const part of message.serverContent.modelTurn.parts) {
      if (part.text) {
        logMessage(part.text, 'ai');
      }
      if (part.inlineData && part.inlineData.data) {
        const audioData = base64ToArrayBuffer(part.inlineData.data);
        audioQueue.push(audioData);
        if (!isPlaying) {
          playAudioQueue();
        }
      }
    }
  }
}

async function playAudioQueue() {
  if (audioQueue.length === 0) {
    isPlaying = false;
    return;
  }

  isPlaying = true;
  const audioData = audioQueue.shift();
  
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const pcm16 = new Int16Array(audioData);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / 32768;
  }

  const buffer = audioContext.createBuffer(1, float32.length, 24000);
  buffer.getChannelData(0).set(float32);

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();

  source.onended = () => {
    playAudioQueue();
  };
}

function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(i * 2, s, true);
  }
  return buffer;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
