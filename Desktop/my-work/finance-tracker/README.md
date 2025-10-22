# Personal Finance Tracker (INR)

A full-stack web application for tracking personal finances with income, expenses, and data visualization in Indian Rupees (₹).

## Features

- User registration and login (JWT-based authentication)
- Add, edit, and delete transactions (income or expense) in Indian Rupees (₹)
- Dashboard with financial summary and transaction list
- Data visualization with charts showing Rupees
- Responsive UI using React and Tailwind CSS
- RESTful API using Node.js and Express
- MongoDB database integration

## Tech Stack

- **Frontend**: React, Tailwind CSS, Chart.js
- **Backend**: Node.js, Express, MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure

```
finance-tracker/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page components
│       ├── services/       # API services
│       ├── utils/          # Utility functions
│       ├── App.js
│       └── index.js
├── server/                 # Node.js backend
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration files
│   └── server.js
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd finance-tracker
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   ```
   
   Create a `.env` file in the server directory based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your MongoDB URI and JWT secret:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=5000
   ```

3. **Frontend Setup:**
   ```bash
   cd ../client
   npm install
   npx tailwindcss init -p
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```
   
   The server will start on http://localhost:5000

2. **Start the frontend development server:**
   ```bash
   cd client
   npm start
   ```
   
   The frontend will start on http://localhost:3000

## API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Transactions

- `POST /api/transactions` - Create a new transaction (protected)
- `GET /api/transactions` - Get all transactions for user (protected)
- `GET /api/transactions/:id` - Get a specific transaction (protected)
- `PUT /api/transactions/:id` - Update a transaction (protected)
- `DELETE /api/transactions/:id` - Delete a transaction (protected)
- `GET /api/transactions/summary/financial` - Get financial summary (protected)

## Deployment

### Frontend Deployment

#### Vercel:
1. Push your code to a GitHub repository
2. Sign up/in to Vercel
3. Create a new project and import your repository
4. Set the build command to `npm run build`
5. Set the output directory to `build`
6. Add environment variables if needed
7. Deploy!

#### Netlify:
1. Push your code to a GitHub repository
2. Sign up/in to Netlify
3. Create a new site from Git
4. Select your repository
5. Set the build command to `npm run build`
6. Set the publish directory to `build`
7. Deploy!

### Backend Deployment

#### Heroku:
1. Create a new app on Heroku
2. Connect your GitHub repository
3. Set environment variables in Heroku settings:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret key
   - `PORT` - (Heroku will set this automatically)
4. Enable automatic deploys from GitHub
5. Deploy!

#### Render:
1. Create a new web service on Render
2. Connect your GitHub repository
3. Set the build command to `npm install`
4. Set the start command to `npm start`
5. Add environment variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret key
6. Deploy!

## Environment Variables

### Backend (.env)
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License.

## Contact

For any questions or feedback, please open an issue on the repository.