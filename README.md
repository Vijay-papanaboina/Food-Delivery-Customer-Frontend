# Food Delivery Frontend

A modern, responsive food delivery application built with React, TypeScript, and Tailwind CSS.

## Features

- 🍽️ **Restaurant Discovery**: Browse restaurants with search and filtering
- 📱 **Menu Browsing**: View restaurant menus with categories and item details
- 🛒 **Shopping Cart**: Add items to cart with quantity management
- 💳 **Checkout**: Secure checkout with multiple payment methods
- 📍 **Order Tracking**: Real-time order status updates with timeline
- 📋 **Order History**: View past orders and reorder functionality
- 📱 **Responsive Design**: Mobile-first design that works on all devices

## Tech Stack

- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **Zustand** for state management
- **React Query** for API calls
- **Vite** for build tooling

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5001
VITE_PAYMENT_API_URL=http://localhost:5002
VITE_RESTAURANT_API_URL=http://localhost:5006
VITE_DELIVERY_API_URL=http://localhost:5004
VITE_USER_ID=user-123
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── layout/         # Layout components (Header, Footer)
│   └── cart/           # Cart-related components
├── pages/              # Page components
│   ├── Home.tsx        # Restaurant listing
│   ├── RestaurantMenu.tsx
│   ├── Cart.tsx
│   ├── Checkout.tsx
│   ├── OrderTracking.tsx
│   └── OrderHistory.tsx
├── hooks/              # Custom React hooks
│   ├── useRestaurants.ts
│   ├── useOrders.ts
│   ├── usePayments.ts
│   └── useDelivery.ts
├── store/              # Zustand stores
│   ├── cartStore.ts
│   └── userStore.ts
├── services/           # API services
│   └── api.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── lib/                # Utility functions
│   └── queryClient.ts
└── config/             # Configuration
    └── env.ts
```

## Key Features

### Restaurant Discovery

- Search restaurants by name
- Filter by cuisine type
- Sort by rating, delivery time, or delivery fee
- Responsive grid layout

### Menu Browsing

- Organized by categories
- Item details with images and descriptions
- Add to cart functionality
- Quantity selection

### Shopping Cart

- Persistent cart storage
- Quantity management
- Item removal
- Real-time total calculation
- Cart drawer for quick access

### Checkout Process

- Delivery address form
- Payment method selection
- Order summary
- Integration with backend APIs

### Order Tracking

- Real-time status updates
- Visual timeline
- Driver information
- Estimated delivery time
- Auto-refresh every 10 seconds

### Order History

- List of past orders
- Order details and status
- Reorder functionality
- Search and filter options

## API Integration

The frontend integrates with the following microservices:

- **Order Service** (Port 5001): Order creation and management
- **Payment Service** (Port 5002): Payment processing
- **Restaurant Service** (Port 5006): Restaurant and menu data
- **Delivery Service** (Port 5004): Delivery tracking

## State Management

- **Cart Store**: Manages shopping cart state with persistence
- **User Store**: Manages user information and preferences
- **React Query**: Handles server state and caching

## Styling

- **Tailwind CSS 4**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **Custom Design System**: Consistent colors, typography, and spacing
- **Responsive Design**: Mobile-first approach with breakpoints

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Consistent naming conventions

## Production Deployment

1. Build the application:

```bash
npm run build
```

2. The `dist` folder contains the production build
3. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
