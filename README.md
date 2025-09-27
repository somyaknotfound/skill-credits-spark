# 🎓 SkillSwap - P2P Learning Platform

A comprehensive peer-to-peer learning platform built with React, TypeScript, and Supabase, featuring real-time chat, course management, progress tracking, and dynamic leaderboards.

## 🚀 Project Overview

SkillSwap is a full-stack learning platform where users can teach skills, earn credits, and learn from others in a gamified environment. The platform features real-time collaboration, course management, and comprehensive progress tracking.

## ✨ Key Features

### 🎯 Core Functionality
- **Skill Marketplace** - Browse and purchase skills from instructors
- **Course Management** - Create and manage courses with assignments and materials
- **Real-time Chat** - WebRTC-powered video calls and messaging
- **Progress Tracking** - Monitor learning progress and completion
- **Dynamic Leaderboards** - Time-based rankings (Weekly/Monthly/All-Time)
- **Credit System** - Earn and spend credits for skills

### 🔧 Technical Features
- **Authentication** - Supabase Auth with magic links
- **File Uploads** - Course materials and assignments
- **Real-time Updates** - Live chat and progress tracking
- **Responsive Design** - Mobile-friendly UI with dark theme
- **Database Optimization** - Materialized views and atomic transactions

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development
- **React Router** for navigation
- **Shadcn UI** for components
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend Stack
- **Supabase** for database and authentication
- **PostgreSQL** with optimized schema
- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live updates
- **Storage** for file uploads

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn UI components
│   ├── CourseChat.tsx  # Real-time chat component
│   ├── FileUpload.tsx  # File upload component
│   └── Leaderboard.tsx # Leaderboard display
├── hooks/              # Custom React hooks
│   ├── useLeaderboard.ts      # Leaderboard data
│   ├── useMarketplace.ts      # Marketplace data
│   ├── useSkillPurchase.ts    # Purchase logic
│   └── useProgress.ts         # Progress tracking
├── pages/              # Page components
│   ├── Marketplace.tsx        # Skill marketplace
│   ├── CourseManagement.tsx   # Course management
│   ├── CourseDetail.tsx      # Course progress
│   ├── MySkills.tsx          # User's skills
│   └── Leaderboard.tsx       # Rankings
├── integrations/       # External integrations
│   └── supabase/       # Supabase client
└── App.tsx            # Main application
```

## 🗄️ Database Schema

### Core Tables
- **`profiles`** - User profiles with credit balances
- **`skills`** - Instructor skills with pricing
- **`transactions`** - P2P credit transactions
- **`ratings`** - Student ratings for instructors
- **`progress`** - Learning progress tracking
- **`assignments`** - Course assignments
- **`course_materials`** - Uploaded course files
- **`chat_messages`** - Real-time messaging

### Materialized Views
- **`weekly_leaderboard`** - Last 7 days performance
- **`monthly_leaderboard`** - Last 30 days performance
- **`all_time_leaderboard`** - Historical performance

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd skill-credits-spark
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Update `src/integrations/supabase/client.ts`

4. **Apply database migrations**
   ```sql
   -- Run the comprehensive schema optimization migration
   -- Copy contents of: supabase/migrations/20250926210000_comprehensive_schema_optimization.sql
   -- Paste into Supabase Dashboard SQL Editor and execute
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📊 Database Migrations

### Applied Migrations
1. **Initial Schema** - Basic tables and RLS policies
2. **Course Management** - Assignments, materials, chat
3. **Progress Tracking** - Student progress and activity
4. **Leaderboard Optimization** - Materialized views and indexes
5. **P2P Transactions** - Atomic credit system
6. **Comprehensive Optimization** - Full schema redesign

### Key Optimizations
- **Materialized Views** for fast leaderboard queries
- **Atomic Transactions** for credit balance updates
- **Performance Indexes** for large datasets
- **RLS Policies** for secure data access
- **Triggers** for automatic balance updates

## 🎨 UI Components

### Design System
- **Dark Theme** with glassmorphism effects
- **Gradient Backgrounds** for visual appeal
- **Responsive Layout** for all screen sizes
- **Loading States** and error handling
- **Toast Notifications** for user feedback

### Key Components
- **SkillCard** - Marketplace skill display
- **CourseChat** - Real-time messaging with WebRTC
- **FileUpload** - Drag & drop file uploads
- **ProgressBar** - Learning progress visualization
- **Leaderboard** - Time-based rankings

## 🔐 Security Features

### Authentication
- **Magic Link Login** via Supabase Auth
- **Protected Routes** with RequireAuth component
- **Session Management** with automatic refresh

### Data Protection
- **Row Level Security (RLS)** on all tables
- **User-specific data access** policies
- **Secure file uploads** with proper validation
- **Transaction validation** before processing

## 📈 Performance Optimizations

### Database
- **Materialized Views** for instant leaderboards
- **Strategic Indexes** for fast queries
- **Atomic Transactions** for data consistency
- **Connection Pooling** for scalability

### Frontend
- **Code Splitting** with React.lazy
- **Memoization** with useMemo and useCallback
- **Optimistic Updates** for better UX
- **Error Boundaries** for graceful failures

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Skill creation and marketplace display
- [ ] Course purchase and enrollment
- [ ] Real-time chat functionality
- [ ] File upload and download
- [ ] Progress tracking updates
- [ ] Leaderboard time filtering
- [ ] Credit balance updates

## 🚀 Deployment

### Production Setup
1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting platform**
   - Vercel (recommended)
   - Netlify
   - AWS Amplify

3. **Configure environment variables**
   - Supabase URL and keys
   - Storage bucket settings
   - Real-time configuration

## 📝 API Documentation

### Key Functions
- **`purchase_skill_p2p`** - P2P skill purchase with atomic transactions
- **`refresh_leaderboards`** - Update materialized views
- **`update_credit_balance`** - Automatic balance updates
- **`get_leaderboard_data`** - Optimized leaderboard queries

### Real-time Subscriptions
- **Chat Messages** - Live messaging updates
- **Progress Updates** - Real-time progress tracking
- **Leaderboard Changes** - Live ranking updates

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for pre-commit hooks

## 🐛 Troubleshooting

### Common Issues
1. **Database Connection** - Check Supabase credentials
2. **RLS Policies** - Ensure proper permissions
3. **File Uploads** - Verify storage bucket setup
4. **Real-time Chat** - Check WebRTC permissions

### Debug Mode
- Enable Supabase debug logging
- Check browser console for errors
- Verify network requests in DevTools

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Standards
- Follow TypeScript best practices
- Use meaningful variable names
- Add comments for complex logic
- Write tests for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Supabase** for the backend infrastructure
- **Shadcn UI** for the component library
- **React** for the frontend framework
- **Tailwind CSS** for styling utilities

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

---

**Built with ❤️ for the learning community**