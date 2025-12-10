export class CartManager {
  constructor() {
    this.items = [];
    this.subscribers = [];
  }

  addItem(product, quantity = 1) {
    const existingItem = this.items.find(item => item.id === product.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({ ...product, quantity });
    }
    this.notify();
  }

  removeItem(productName, quantity = 1) {
    // Fuzzy search for product name to be more forgiving with voice input
    const itemIndex = this.items.findIndex(item => 
      item.name.toLowerCase().includes(productName.toLowerCase())
    );

    if (itemIndex > -1) {
      const item = this.items[itemIndex];
      if (item.quantity > quantity) {
        item.quantity -= quantity;
      } else {
        this.items.splice(itemIndex, 1);
      }
      this.notify();
      return true;
    }
    return false;
  }

  clear() {
    this.items = [];
    this.notify();
  }

  getTotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    // Initial call
    callback(this.items, this.getTotal());
  }

  notify() {
    const total = this.getTotal();
    this.subscribers.forEach(callback => callback(this.items, total));
  }
}
