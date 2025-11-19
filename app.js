const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

const HomeComponent = {
  template: `
    <div class="home-container">
      <div class="hero-section">
        <h1 class="animated-title">Welcome to After School Activities</h1>
        <router-link to="/lessons" class="btn btn-primary btn-lg animated-button">Browse Lessons</router-link>
        <p class="hero-subtitle">Book After School Sessions Now</p>
      </div>
      <div class="features-section">
        <div class="feature-card">
          <i class="fas fa-book-open fa-3x"></i>
          <h3>Wide Range of Subjects</h3>
          <p>From Art to Sports, find the perfect after-school activity for your child.</p>
        </div>
        <div class="feature-card">
          <i class="fas fa-clock fa-3x"></i>
          <h3>Flexible Scheduling</h3>
          <p>Choose from various time slots that fit your family's schedule.</p>
        </div>
        <div class="feature-card">
          <i class="fas fa-users fa-3x"></i>
          <h3>Expert Instructors</h3>
          <p>Learn from qualified professionals in a safe and engaging environment.</p>
        </div>
      </div>
    </div>
  `
};

const LessonsComponent = {
  template: `
    <div>
      <div v-if="$root.cart.length > 0" class="alert alert-info">
        <strong>Cart:</strong> {{ $root.cart.length }} items
        <router-link to="/cart" class="btn btn-sm btn-primary ms-2">View Cart</router-link>
      </div>
      <div class="mb-3">
        <input type="text" v-model="searchTerm" @input="searchLessons" class="form-control" placeholder="Search lessons...">
      </div>
      <div class="mb-3">
        <button @click="sortBy('subject')" class="btn btn-outline-primary me-2">Sort by Subject {{ sortOrder.subject === 'asc' ? '↑' : '↓' }}</button>
        <button @click="sortBy('location')" class="btn btn-outline-primary me-2">Sort by Location {{ sortOrder.location === 'asc' ? '↑' : '↓' }}</button>
        <button @click="sortBy('price')" class="btn btn-outline-primary me-2">Sort by Price {{ sortOrder.price === 'asc' ? '↑' : '↓' }}</button>
        <button @click="sortBy('spaces')" class="btn btn-outline-primary">Sort by Spaces {{ sortOrder.spaces === 'asc' ? '↑' : '↓' }}</button>
      </div>
      <div class="row">
        <div v-for="lesson in lessons" :key="lesson._id" class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100" style="border: 2px solid purple; background-color: #f0f0f0;">
            <img :src="'images/' + lesson.image" class="card-img-top" :alt="lesson.subject" style="height: 200px; object-fit: contain;">
            <div class="card-body">
              <h5 class="card-title" style="color: purple;">{{ lesson.subject }}</h5>
              <p class="card-text" style="color: black;">Location: {{ lesson.location }}</p>
              <p class="card-text" style="color: black;">Price: £{{ lesson.price }}</p>
              <p class="card-text" style="color: black;">Spaces: {{ lesson.spaces }}</p>
              <button @click="$root.addToCart(lesson)" :disabled="lesson.spaces === 0" class="btn" style="background-color: purple; color: white;">Add to Cart</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      lessons: [],
      searchTerm: '',
      sortOrder: {
        subject: 'asc',
        location: 'asc',
        price: 'asc',
        spaces: 'asc'
      }
    };
  },
  mounted() {
    this.lessons = this.$root.lessons.slice();
  },
  watch: {
    '$root.lessons': function(newLessons) {
      this.lessons = newLessons.slice();
    }
  },
  methods: {
    async searchLessons() {
      if (this.searchTerm.trim() === '') {
        await this.$root.fetchLessons();
        return;
      }
      try {
        const response = await fetch(`${this.$root.apiBase}/search?q=${encodeURIComponent(this.searchTerm)}`);
        this.lessons = await response.json();
      } catch (error) {
        console.error('Search failed:', error);
      }
    },
    sortBy(attribute) {
      this.sortOrder[attribute] = this.sortOrder[attribute] === 'asc' ? 'desc' : 'asc';
      const order = this.sortOrder[attribute] === 'asc' ? 1 : -1;
      if (['subject', 'location'].includes(attribute)) {
        // Case-insensitive alphabetical sorting for strings
        this.lessons.sort((a, b) => {
          const aVal = a[attribute].toLowerCase();
          const bVal = b[attribute].toLowerCase();
          if (aVal < bVal) return -order;
          if (aVal > bVal) return order;
          return 0;
        });
      } else {
        this.lessons.sort((a, b) => {
          if (a[attribute] < b[attribute]) return -order;
          if (a[attribute] > b[attribute]) return order;
          return 0;
        });
      }
    }
  }
};

const CartComponent = {
  template: `
    <div>
      <h2>Shopping Cart</h2>
      <div v-if="cart.length === 0" class="alert alert-info">Your cart is empty.</div>
      <div v-else>
        <div v-for="(item, index) in cart" :key="index" class="card mb-3">
          <div class="card-body">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="selectedItems" :value="index" :id="'item-' + index">
              <label class="form-check-label" :for="'item-' + index">
                <h5>{{ item.subject }}</h5>
                <p>Quantity: {{ item.qty }}</p>
                <p>Price: £{{ item.price * item.qty }}</p>
              </label>
            </div>
            <button @click="removeFromCart(index)" class="btn btn-danger">Remove</button>
          </div>
        </div>
        <h4>Total: £{{ selectedTotalPrice }}</h4>
        <form @submit.prevent="checkout" class="mt-4">
          <div class="mb-3">
            <label for="name" class="form-label">Name</label>
            <input type="text" id="name" v-model="orderForm.name" class="form-control" required>
          </div>
          <div class="mb-3">
            <label for="phone" class="form-label">Phone (at least 10 digits)</label>
            <input type="text" id="phone" v-model="orderForm.phone" class="form-control" required>
          </div>
          <div class="mb-3">
            <label class="form-label">Payment Method</label>
            <div class="form-check">
              <input class="form-check-input" type="radio" v-model="orderForm.paymentMethod" value="online" id="online" required>
              <label class="form-check-label" for="online">Online</label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="radio" v-model="orderForm.paymentMethod" value="cash" id="cash" required>
              <label class="form-check-label" for="cash">Cash</label>
            </div>
          </div>
          <div v-if="orderForm.paymentMethod === 'online'">
            <div class="mb-3">
              <label for="cardNumber" class="form-label">Card Number (16 digits)</label>
              <input type="text" id="cardNumber" v-model="orderForm.cardNumber" class="form-control" required>
            </div>
            <div class="mb-3">
              <label for="cardName" class="form-label">Name on Card</label>
              <input type="text" id="cardName" v-model="orderForm.cardName" class="form-control" required>
            </div>
            <div class="mb-3">
              <label for="expiryDate" class="form-label">Expiry Date (MM/YY)</label>
              <input type="text" id="expiryDate" v-model="orderForm.expiryDate" class="form-control" required>
            </div>
            <div class="mb-3">
              <label for="securityCode" class="form-label">Security Code (3 digits)</label>
              <input type="text" id="securityCode" v-model="orderForm.securityCode" class="form-control" required>
            </div>
          </div>
          <button type="submit" :disabled="!isFormValid || selectedItems.length === 0" class="btn btn-success">Checkout Selected Items</button>
          <div v-if="checkoutError" class="alert alert-danger mt-3">{{ checkoutError }}</div>
        </form>
      </div>
    </div>
  `,
  data() {
    return {
      selectedItems: [],
      orderForm: {
        name: '',
        phone: '',
        paymentMethod: '',
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        securityCode: ''
      },
      checkoutError: ''
    };
  },
  computed: {
    cart() {
      return this.$root.cart;
    },
    selectedTotalPrice() {
      return this.selectedItems.reduce((total, index) => {
        const item = this.cart[index];
        return total + item.price * item.qty;
      }, 0);
    },
    isFormValid() {
      const nameRegex = /^[a-zA-Z\s]+$/;
      const phoneRegex = /^\d{10,}$/;
      if (!nameRegex.test(this.orderForm.name) || !phoneRegex.test(this.orderForm.phone) || !this.orderForm.paymentMethod) {
        return false;
      }
      if (this.orderForm.paymentMethod === 'online') {
        const cardNumberRegex = /^\d{16}$/;
        const cardNameRegex = /^[a-zA-Z\s]+$/;
        const expiryDateRegex = /^\d{2}\/\d{2}$/;
        const securityCodeRegex = /^\d{3}$/;
        return cardNumberRegex.test(this.orderForm.cardNumber) &&
               cardNameRegex.test(this.orderForm.cardName) &&
               expiryDateRegex.test(this.orderForm.expiryDate) &&
               securityCodeRegex.test(this.orderForm.securityCode);
      }
      return true;
    }
  },
  methods: {
    async removeFromCart(index) {
      const item = this.cart[index];
      try {
        const response = await fetch(`${this.$root.apiBase}/cart/remove`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ lessonId: item._id })
        });
        const result = await response.json();
        if (result.ok) {
          await this.$root.fetchCart();
          await this.$root.fetchLessons();
        } else {
          console.error('Failed to remove from cart:', result.error);
        }
      } catch (error) {
        console.error('Remove from cart error:', error);
      }
    },
    async checkout() {
      this.checkoutError = '';
      if (!this.isFormValid || this.selectedItems.length === 0) return;
      const selectedCartItems = this.selectedItems.map(index => this.cart[index]);
      const order = {
        name: this.orderForm.name,
        phone: this.orderForm.phone,
        paymentMethod: this.orderForm.paymentMethod,
        items: selectedCartItems.map(item => ({ lessonId: item._id, qty: item.qty }))
      };
      if (this.orderForm.paymentMethod === 'online') {
        order.cardNumber = this.orderForm.cardNumber;
        order.cardName = this.orderForm.cardName;
        order.expiryDate = this.orderForm.expiryDate;
        order.securityCode = this.orderForm.securityCode;
      }
      try {
        const response = await fetch(`${this.$root.apiBase}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(order)
        });
        const result = await response.json();
        if (result.ok) {
          this.$root.showSuccessMessage('Order booked successfully!');
          this.selectedItems = [];
          this.orderForm = { name: '', phone: '', paymentMethod: '', cardNumber: '', cardName: '', expiryDate: '', securityCode: '' };
          await this.$root.fetchLessons();
          await this.$root.fetchOrders();
          await this.$root.fetchCart(); // Refresh cart to reflect backend changes
        } else {
          this.checkoutError = result.error || 'Order failed';
        }
      } catch (error) {
        console.error('Checkout failed:', error);
        this.checkoutError = 'Network error. Please try again.';
      }
    }
  }
};

const OrdersComponent = {
  template: `
    <div>
      <h2>My Orders</h2>
      <div v-if="orders.length === 0" class="alert alert-info">No orders found.</div>
      <div v-else>
        <div v-for="order in orders" :key="order._id" class="card mb-3">
          <div class="card-body">
            <h5>Order ID: {{ order._id }}</h5>
            <p>Name: {{ order.name }}</p>
            <p>Phone: {{ order.phone }}</p>
            <p>Total: £{{ order.total }}</p>
            <p>Date: {{ new Date(order.createdAt).toLocaleDateString() }}</p>
            <h6>Items:</h6>
            <ul>
              <li v-for="item in order.items" :key="item.lessonId">{{ item.qty }} x {{ getLessonName(item.lessonId) }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      orders: []
    };
  },
  async mounted() {
    await this.fetchOrders();
  },
  methods: {
    async fetchOrders() {
      try {
        const response = await fetch(`${this.$root.apiBase}/orders`);
        this.orders = await response.json();
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    },
    getLessonName(lessonId) {
      const lesson = this.$root.lessons.find(l => l._id === lessonId);
      return lesson ? lesson.subject : 'Unknown Lesson';
    }
  }
};

const routes = [
  { path: '/', component: HomeComponent },
  { path: '/lessons', component: LessonsComponent },
  { path: '/cart', component: CartComponent },
  { path: '/orders', component: OrdersComponent }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

const App = {
  template: `
    <div style="background-color: #f8f9fa; min-height: 100vh;">
      <nav class="navbar navbar-expand-lg navbar-dark" style="background-color: black;">
        <div class="container-fluid">
          <router-link to="/" class="navbar-brand" style="color: purple; font-size: 1.8em; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">🚀 After School App</router-link>
          <div class="navbar-nav">
            <router-link to="/lessons" class="nav-link" style="color: white;">Lessons</router-link>
            <router-link to="/cart" class="nav-link" style="color: white;"><i class="fas fa-shopping-cart"></i> <span v-if="cart.length > 0" class="badge" style="background-color: purple;">{{ cart.length }}</span></router-link>
            <router-link to="/orders" class="nav-link" style="color: white;">Orders</router-link>
          </div>
        </div>
      </nav>
      <div class="container" style="max-width: 1200px;">
        <router-view></router-view>
      </div>
    </div>
  `,
  data() {
    return {
      lessons: [],
      cart: [],
      orders: [],
      searchTerm: '',
      sortOrder: {
        subject: 'asc',
        location: 'asc',
        price: 'asc',
        spaces: 'asc'
      },
      apiBase: localStorage.getItem('apiBase') || 'https://express-app-7jpo.onrender.com'
    };
  },
  async mounted() {
    await this.fetchLessons();
    await this.fetchCart();
    await this.fetchOrders();
  },
  methods: {
    async fetchOrders() {
      try {
        const response = await fetch(`${this.apiBase}/orders`);
        this.orders = await response.json();
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    },
    async fetchCart() {
      try {
        const response = await fetch(`${this.apiBase}/cart`);
        this.cart = await response.json();
      } catch (error) {
        console.error('Failed to fetch cart:', error);
      }
    },
    async fetchLessons() {
      try {
        const response = await fetch(`${this.apiBase}/lessons`);
        this.lessons = await response.json();
      } catch (error) {
        console.error('Failed to fetch lessons:', error);
      }
    },
    async searchLessons() {
      if (this.searchTerm.trim() === '') {
        await this.fetchLessons();
        return;
      }
      try {
        const response = await fetch(`${this.apiBase}/search?q=${encodeURIComponent(this.searchTerm)}`);
        this.lessons = await response.json();
      } catch (error) {
        console.error('Search failed:', error);
      }
    },
    sortBy(attribute) {
      this.sortOrder[attribute] = this.sortOrder[attribute] === 'asc' ? 'desc' : 'asc';
      const order = this.sortOrder[attribute] === 'asc' ? 1 : -1;
      this.lessons.sort((a, b) => {
        if (a[attribute] < b[attribute]) return -order;
        if (a[attribute] > b[attribute]) return order;
        return 0;
      });
    },
    async addToCart(lesson) {
      if (lesson.spaces > 0) {
        try {
          const response = await fetch(`${this.apiBase}/cart/add`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lessonId: lesson._id, qty: 1 })
          });
          const result = await response.json();
          if (result.ok) {
            await this.fetchCart();
            await this.fetchLessons();
            this.showSuccessMessage('Item added to cart successfully!');
          } else {
            console.error('Failed to add to cart:', result.error);
            alert('Failed to add to cart: ' + result.error);
          }
        } catch (error) {
          console.error('Add to cart error:', error);
          alert('Network error: Failed to add to cart. Please try again.');
        }
      } else {
        alert('No spaces available for this lesson.');
      }
    },
    showSuccessMessage(message) {
      // Create a small green box message
      const messageDiv = document.createElement('div');
      messageDiv.textContent = message;
      messageDiv.style.position = 'fixed';
      messageDiv.style.top = '80px';
      messageDiv.style.left = '50%';
      messageDiv.style.transform = 'translateX(-50%)';
      messageDiv.style.backgroundColor = 'green';
      messageDiv.style.color = 'white';
      messageDiv.style.padding = '10px';
      messageDiv.style.borderRadius = '5px';
      messageDiv.style.zIndex = '1000';
      messageDiv.style.fontSize = '14px';
      document.body.appendChild(messageDiv);
      // Remove after 3 seconds
      setTimeout(() => {
        document.body.removeChild(messageDiv);
      }, 3000);
    },
    getLessonName(lessonId) {
      const lesson = this.lessons.find(l => l._id === lessonId);
      return lesson ? lesson.subject : 'Unknown Lesson';
    }
  }
};

createApp(App).use(router).mount('#app');
