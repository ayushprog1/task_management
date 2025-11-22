Task Management Dashboard

This is a fullstack application built with Next.js, React, and Prisma, featuring role-based access control (RBAC) for Admin, Manager, and User roles.

🚀 Setup Instructions

Follow these steps to get the project running locally.

1. Prerequisites

Ensure you have the following installed on your system:

Node.js (LTS version recommended, which includes npm)

Git

2. Install Dependencies

Navigate to the project directory in your terminal and install all required packages using npm:

npm install


3. Environment Configuration

Ensure your .env file is set up correctly. The following is required for local development:

# .env file

# CHANGE: Use local SQLite file for development
DATABASE_URL="file:./dev.db" 

# Security: Replace this with a strong, random key
JWT_SECRET="your_default_secret_key_but_make_it_a_strong_random_string"


4. Database Initialization (Crucial for First Login)

To ensure the initial Admin user is created correctly (which fixes the "Invalid credentials" error), you must reset the database and run the seed script.

Reset Database & Run Migrations: This wipes the local dev.db file and creates a fresh database structure based on your Prisma schema.

npx prisma migrate reset --skip-generate --force


Seed Initial Users: This command runs your prisma/seed.js script to populate the database with the initial Admin, Manager, and User accounts.

npx prisma db seed


5. Run the Application

Start the Next.js development server:

npm run dev


The application will be accessible at: http://localhost:3000

6. Default Login Credentials

After successfully running the seed command, you can log in with the following default credentials (if using the default seed data):

Role

Email

Password

Admin

admin@example.com

password123

Manager

manager@example.com

password123

User

user@example.com

password123
