# Portfolio Platform with Authentication and Role-Based Access

This is a web application that allows users to register, log in, and manage their portfolio items. It includes role-based access control (admin and editor roles) and integrates with external APIs to display country and currency data.

## Features

- **User Authentication**: Registration, login, and private key-based verification.
- **Role-based Access Control**: Two roles (admin and editor) with different levels of permissions.
- **Portfolio Management**: Users can create, edit, and delete portfolio items.
- **Country Data Integration**: Fetches data about the user's country, including population, capital, and flag image.
- **Currency Data Integration**: Displays exchange rates for KZT to EUR for the last 6 months.

## Technologies Used

- **Node.js**: Backend runtime.
- **Express**: Web framework for Node.js.
- **MongoDB**: Database for storing user and portfolio data.
- **EJS**: Templating engine for rendering HTML views.
- **Bcrypt.js**: For password hashing.
- **RSA Encryption**: For secure user registration and login using public/private keys.
- **Axios**: For making HTTP requests to external APIs.
- **File Upload**: Allows users to upload private key files for login verification.

## Setup Instructions

1. Install the dependencies:
   ```bash
   cd portfolio-platform
    npm install

2. Create a .env file in the root directory and add the following::
    MONGO_URI=mongodb+srv://rbitchees:130505@finalprojectdb.kkgi1.mongodb.net/

3. Start the application:
   ```bash
    npm start

4. Open your browser and go to http://localhost:3000.


### Endpoints
- **GET /**
Displays the homepage (index) with the login and registration forms.

- **POST /register**
Registers a new user with the following fields:

- username: The user's chosen username.
- password: The user's password (will be hashed).
- firstName: The user's first name.
- lastName: The user's last name.
- age: The user's age.
- city: The user's city.
- country: The user's country.
- gender: The user's gender.
- role: The user's role (admin or editor).
On successful registration, the user will be prompted to download their private key in .pem format.

- **POST /login**
Logs a user in by verifying the username, password, and private key file:

- username: The user's username.
- password: The user's password.
- privateKeyFile: The .pem file containing the user's private key.
On successful login, the user will be redirected to their portfolio page.

#### Security

- Passwords are hashed using bcrypt before being stored.
- Private key-based authentication is used for login.
- Role-based access control ensures that only authorized users can access certain features (like creating or editing portfolio items).

##### Folder Structure

/final project
│
├── /keys/                   # Keys
├── /node_modules/           # Project dependencies
├── /public/                 # Static files (CSS, JS, images)
│   ├── /images/             # Images
├── /views/                  # EJS views
│   ├── index.ejs            # Homepage (login/registration)
│   ├── portfolio.ejs        # Portfolio page
│   ├── port.ejs             # APIs
├── /models/                 # MongoDB models
│   ├── User.js              # User model
│   └── PortfolioItem.js     # Portfolio item model
├── /routes/                 # Routes for handling requests
│   ├── authRoutes.js        # Authentication routes
│   └── portfolioRoutes.js   # Portfolio management routes
├── /middleware/             # Middleware for role checking and validation
│   ├── authMiddleware.js    # Auth check middleware
│   └── roleMiddleware.js    # Role-based access control
├── .env                     # Environment variables (Mongo URI, etc.)
├── app.js                   # Main server setup
└── package.json             # Project metadata and dependencies
