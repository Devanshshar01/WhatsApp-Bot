# Finance Tracker API Documentation (INR)

## Authentication (INR)

### Register a new user
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "_id": "string",
  "username": "string",
  "email": "string",
  "token": "string"
}
```

### Login user
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "_id": "string",
  "username": "string",
  "email": "string",
  "token": "string"
}
```

### Get user profile
**GET** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "string",
  "username": "string",
  "email": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## Transactions (INR)

### Create a new transaction
**POST** `/api/transactions`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body (Amount in Rupees):**
```json
{
  "amount": "number", // in Indian Rupees (₹)
  "type": "string", // 'income' or 'expense'
  "category": "string",
  "date": "date",
  "description": "string" // optional
}
```

**Response (Amount in Rupees):**
```json
{
  "_id": "string",
  "user": "string",
  "amount": "number", // in Indian Rupees (₹)
  "type": "string",
  "category": "string",
  "date": "date",
  "description": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Get all transactions
**GET** `/api/transactions`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Amounts in Rupees):**
```json
[
  {
    "_id": "string",
    "user": "string",
    "amount": "number", // in Indian Rupees (₹)
    "type": "string",
    "category": "string",
    "date": "date",
    "description": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
]
```

### Get a specific transaction
**GET** `/api/transactions/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Amount in Rupees):**
```json
{
  "_id": "string",
  "user": "string",
  "amount": "number", // in Indian Rupees (₹)
  "type": "string",
  "category": "string",
  "date": "date",
  "description": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Update a transaction
**PUT** `/api/transactions/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body (Amount in Rupees):**
```json
{
  "amount": "number", // in Indian Rupees (₹)
  "type": "string", // 'income' or 'expense'
  "category": "string",
  "date": "date",
  "description": "string" // optional
}
```

**Response (Amount in Rupees):**
```json
{
  "_id": "string",
  "user": "string",
  "amount": "number", // in Indian Rupees (₹)
  "type": "string",
  "category": "string",
  "date": "date",
  "description": "string",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Delete a transaction
**DELETE** `/api/transactions/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Transaction deleted successfully"
}
```

### Get financial summary
**GET** `/api/transactions/summary/financial`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Amounts in Rupees):**
```json
{
  "totalIncome": "number", // in Indian Rupees (₹)
  "totalExpenses": "number", // in Indian Rupees (₹)
  "balance": "number" // in Indian Rupees (₹)
}
```