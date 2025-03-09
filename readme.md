## Project Description
Build a comprehensive dashboard using **Next.js** (frontend) and **Node.js** (backend) with the following features:

## Features & Requirements

### 1. Authentication (Login & Signup)
- Implement basic **JWT-based** authentication.
- Users should only access the dashboard after logging in (Protected routes).
- Ensure users are automatically logged out when the JWT token expires.

### 2. Dashboard with Table (Google Sheets Integration)
- Users can create a table by clicking on the **Create Table** button.
- Specify the number of columns and define each column's header name with data types (**Text** / **Date**).
- Integrate **Google Sheets** to fetch and display data in a table.
- Rows should dynamically increase as new data is added to the Google Sheet.
- Ensure real-time updates are reflected in the table efficiently without excessive API calls.

### 3. Dynamic Column Addition
- Users can add new columns dynamically within the dashboard (not in Google Sheets).
- Columns should be appended at the end of the existing columns.
- While adding a new column, users can choose the type:
  - **Text** (default input)
  - **Date** (date picker input)
- Ensure dynamically added columns are permanently saved.

## Tech Stack
- **Frontend:** Next.js, Tailwind CSS, ShadcnUI
- **Backend:** Node.js (Express), MongoDB
- **Authentication:** JWT for secure login/logout functionality

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone <repository-link>
   cd <project-folder>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file and include the following variables:
   ```env
   MONGO_URI=<Your MongoDB URI>
   JWT_SECRET=<Your JWT Secret Key>
   GOOGLE_SERVICE_ACCOUNT_KEY=<Your Google Service API Key>
   NEXT_PUBLIC_WS_URL=localhost:3000
   WS_PORT=553
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.