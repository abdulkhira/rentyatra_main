# RentYatra Backends

A comprehensive backend API for the RentYatra rental marketplace platform with SMS-based OTP authentication.

## Features

- **User Authentication**: SMS-based OTP authentication using SMS India Hub
- **User Management**: Complete user profile management with rental-specific features
- **JWT Authentication**: Secure token-based authentication
- **MongoDB Integration**: Robust database operations with Mongoose
- **Rental Statistics**: Track user rental activities and earnings
- **Wallet System**: Built-in wallet for payments
- **Document Verification**: Aadhar and PAN verification for renters
- **Image Upload**: Cloudinary integration for document and profile image storage
- **File Management**: Multer-based file upload with validation

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/rentyatra

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# SMS India Hub Configuration
SMSINDIAHUB_API_KEY=your-sms-india-hub-api-key
SMSINDIAHUB_SENDER_ID=your-sender-id

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 3. SMS India Hub Setup

1. Sign up for SMS India Hub account
2. Get your API key and Sender ID
3. Add them to your `.env` file
4. Note: SMS template approval may be required for production use

### 4. Cloudinary Setup

1. Sign up for Cloudinary account
2. Get your Cloud Name, API Key, and API Secret
3. Add them to your `.env` file
4. Cloudinary will be used for storing document images and profile pictures

### 5. Database Setup

Make sure MongoDB is running on your system. The application will automatically connect to the database specified in `MONGODB_URI`.

### 6. Run the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /send-otp` - Send OTP to phone number
- `POST /verify-otp` - Verify OTP and login/signup
- `POST /register` - Register new user with complete information
- `POST /login` - Login with phone and OTP
- `POST /logout` - Logout user
- `GET /me` - Get current user profile

### User Routes (`/api/users`)

- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `GET /stats` - Get user statistics
- `PUT /preferences` - Update user preferences
- `PUT /deactivate` - Deactivate account
- `PUT /reactivate` - Reactivate account
- `POST /change-phone` - Change phone number
- `GET /activity` - Get user activity log
- `GET /export` - Export user data

### Document Routes (`/api/documents`)

- `POST /upload-aadhar` - Upload Aadhar card images (front & back)
- `POST /upload-pan` - Upload PAN card images (front & back)
- `POST /upload-profile` - Upload profile image
- `GET /status` - Get document verification status
- `DELETE /delete/:type` - Delete document images (aadhar/pan)

## User Model Features

### Basic Information
- Name, email, phone number
- Profile image support
- Address information
- Role-based access (user, vendor, admin)

### Authentication
- Phone number verification via OTP
- Email verification support
- JWT token-based authentication
- Account status management

### Rental-Specific Features
- Rental statistics tracking
- Renter profile management
- Document verification (Aadhar, PAN) with image upload
- Wallet system for payments
- Rating and review system
- Cloudinary image storage for documents

### Preferences
- Notification preferences (email, SMS, push)
- Language support
- Customizable user settings

## SMS Service

The application uses SMS India Hub for OTP delivery:

- Automatic phone number normalization
- Error handling and fallback mechanisms
- Template approval support
- Development mode with OTP in response

## Image Upload Service

The application uses Cloudinary for image storage:

- **Aadhar Card Upload**: Front and back images with validation
- **PAN Card Upload**: Front and back images with validation
- **Profile Image Upload**: Single image with face detection
- **Automatic Optimization**: Images are automatically optimized for web
- **Secure Storage**: All images stored securely in Cloudinary
- **File Validation**: Only image files allowed with size limits

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting ready
- Account status management

## Development Notes

- OTP is included in API responses during development
- SMS template approval may be required for production
- All phone numbers use randomly generated OTPs
- Comprehensive error handling and logging

## Production Considerations

1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure proper CORS origins
4. Set up SMS template approval
5. Use production MongoDB instance
6. Implement rate limiting
7. Set up proper logging
8. Configure SSL/HTTPS
