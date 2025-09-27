import { supabase } from '@/integrations/supabase/client';

// Sample data for seeding
const sampleUsers = [
  { full_name: 'Alice Johnson', username: 'alice_dev', email: 'alice@example.com' },
  { full_name: 'Bob Smith', username: 'bob_teaches', email: 'bob@example.com' },
  { full_name: 'Carol Davis', username: 'carol_codes', email: 'carol@example.com' },
  { full_name: 'David Wilson', username: 'david_designs', email: 'david@example.com' },
  { full_name: 'Eva Brown', username: 'eva_teaches', email: 'eva@example.com' },
  { full_name: 'Frank Miller', username: 'frank_skills', email: 'frank@example.com' },
  { full_name: 'Grace Lee', username: 'grace_learns', email: 'grace@example.com' },
  { full_name: 'Henry Chen', username: 'henry_teaches', email: 'henry@example.com' },
  { full_name: 'Iris Taylor', username: 'iris_codes', email: 'iris@example.com' },
  { full_name: 'Jack Anderson', username: 'jack_designs', email: 'jack@example.com' },
  { full_name: 'Kate Wilson', username: 'kate_teaches', email: 'kate@example.com' },
  { full_name: 'Liam O\'Connor', username: 'liam_skills', email: 'liam@example.com' },
  { full_name: 'Maya Patel', username: 'maya_learns', email: 'maya@example.com' },
  { full_name: 'Noah Garcia', username: 'noah_teaches', email: 'noah@example.com' },
  { full_name: 'Olivia Kim', username: 'olivia_codes', email: 'olivia@example.com' }
];

const sampleSkills = [
  { name: 'JavaScript Fundamentals', category: 'Programming', difficulty_level: 'beginner' },
  { name: 'React Development', category: 'Programming', difficulty_level: 'intermediate' },
  { name: 'Python for Data Science', category: 'Programming', difficulty_level: 'intermediate' },
  { name: 'UI/UX Design', category: 'Design', difficulty_level: 'beginner' },
  { name: 'Digital Marketing', category: 'Business', difficulty_level: 'beginner' },
  { name: 'Machine Learning', category: 'Programming', difficulty_level: 'advanced' },
  { name: 'Web Design', category: 'Design', difficulty_level: 'beginner' },
  { name: 'Project Management', category: 'Business', difficulty_level: 'intermediate' },
  { name: 'Node.js Backend', category: 'Programming', difficulty_level: 'intermediate' },
  { name: 'Graphic Design', category: 'Design', difficulty_level: 'beginner' },
  { name: 'SQL Database', category: 'Programming', difficulty_level: 'intermediate' },
  { name: 'Content Writing', category: 'Business', difficulty_level: 'beginner' },
  { name: 'DevOps Basics', category: 'Programming', difficulty_level: 'intermediate' },
  { name: 'Photography', category: 'Creative', difficulty_level: 'beginner' },
  { name: 'Financial Planning', category: 'Business', difficulty_level: 'intermediate' },
  { name: 'Mobile App Development', category: 'Programming', difficulty_level: 'advanced' },
  { name: 'Video Editing', category: 'Creative', difficulty_level: 'intermediate' },
  { name: 'Public Speaking', category: 'Communication', difficulty_level: 'beginner' },
  { name: 'Cybersecurity', category: 'Programming', difficulty_level: 'advanced' },
  { name: 'Music Production', category: 'Creative', difficulty_level: 'intermediate' }
];

const sampleSkillListings = [
  { title: 'Learn JavaScript from Scratch', description: 'Complete beginner course for JavaScript programming', credit_price: 50, duration_minutes: 480 },
  { title: 'React Masterclass', description: 'Build modern web applications with React', credit_price: 75, duration_minutes: 600 },
  { title: 'Python Data Analysis', description: 'Analyze data with Python and pandas', credit_price: 60, duration_minutes: 360 },
  { title: 'UI Design Principles', description: 'Master the fundamentals of user interface design', credit_price: 40, duration_minutes: 240 },
  { title: 'Digital Marketing Strategy', description: 'Learn effective digital marketing techniques', credit_price: 55, duration_minutes: 300 },
  { title: 'Machine Learning Basics', description: 'Introduction to ML algorithms and applications', credit_price: 100, duration_minutes: 720 },
  { title: 'Web Design Fundamentals', description: 'Create beautiful and functional websites', credit_price: 45, duration_minutes: 300 },
  { title: 'Project Management Essentials', description: 'Manage projects effectively with proven methodologies', credit_price: 65, duration_minutes: 420 },
  { title: 'Node.js Backend Development', description: 'Build scalable server-side applications', credit_price: 80, duration_minutes: 540 },
  { title: 'Graphic Design Mastery', description: 'Create stunning visual designs', credit_price: 50, duration_minutes: 360 }
];

export class DataSeeder {
  private static instance: DataSeeder;
  private seededUsers: any[] = [];
  private seededSkills: any[] = [];
  private seededSkillListings: any[] = [];

  static getInstance(): DataSeeder {
    if (!DataSeeder.instance) {
      DataSeeder.instance = new DataSeeder();
    }
    return DataSeeder.instance;
  }

  async seedAllData(): Promise<void> {
    console.log('🌱 Starting comprehensive data seeding...');
    
    try {
      // Step 1: Create user profiles
      await this.seedUserProfiles();
      
      // Step 2: Create skills
      await this.seedSkills();
      
      // Step 3: Create skill listings
      await this.seedSkillListings();
      
      // Step 4: Create transactions (purchases and teaching)
      await this.seedTransactions();
      
      // Step 5: Create course progress
      await this.seedCourseProgress();
      
      // Step 6: Create reviews and ratings
      await this.seedReviews();
      
      // Step 7: Refresh leaderboards
      await this.refreshLeaderboards();
      
      console.log('✅ Data seeding completed successfully!');
      
    } catch (error) {
      console.error('❌ Error during data seeding:', error);
      throw error;
    }
  }

  private async seedUserProfiles(): Promise<void> {
    console.log('👥 Creating user profiles...');
    
    for (const user of sampleUsers) {
      try {
        // Create auth user first
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: 'password123',
          email_confirm: true
        });

        if (authError) {
          console.warn(`⚠️ Could not create auth user for ${user.email}:`, authError.message);
          continue;
        }

        // Create profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            full_name: user.full_name,
            username: user.username,
            credits_balance: Math.floor(Math.random() * 500) + 100, // Random credits between 100-600
            level: Math.floor(Math.random() * 10) + 1, // Random level 1-10
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
          })
          .select()
          .single();

        if (profileError) {
          console.warn(`⚠️ Could not create profile for ${user.username}:`, profileError.message);
          continue;
        }

        this.seededUsers.push(profileData);
        console.log(`✅ Created profile for ${user.full_name}`);
        
      } catch (error) {
        console.warn(`⚠️ Error creating user ${user.username}:`, error);
      }
    }
    
    console.log(`👥 Created ${this.seededUsers.length} user profiles`);
  }

  private async seedSkills(): Promise<void> {
    console.log('📚 Creating skills...');
    
    for (const skill of sampleSkills) {
      try {
        const { data: skillData, error: skillError } = await supabase
          .from('skills')
          .insert({
            name: skill.name,
            category: skill.category,
            difficulty_level: skill.difficulty_level,
            description: `Learn ${skill.name} with hands-on projects and real-world examples.`
          })
          .select()
          .single();

        if (skillError) {
          console.warn(`⚠️ Could not create skill ${skill.name}:`, skillError.message);
          continue;
        }

        this.seededSkills.push(skillData);
        console.log(`✅ Created skill: ${skill.name}`);
        
      } catch (error) {
        console.warn(`⚠️ Error creating skill ${skill.name}:`, error);
      }
    }
    
    console.log(`📚 Created ${this.seededSkills.length} skills`);
  }

  private async seedSkillListings(): Promise<void> {
    console.log('📋 Creating skill listings...');
    
    for (let i = 0; i < sampleSkillListings.length; i++) {
      const listing = sampleSkillListings[i];
      const skill = this.seededSkills[i % this.seededSkills.length];
      const instructor = this.seededUsers[i % this.seededUsers.length];
      
      try {
        const { data: listingData, error: listingError } = await supabase
          .from('skill_listings')
          .insert({
            user_id: instructor.user_id,
            skill_id: skill.id,
            title: listing.title,
            description: listing.description,
            credit_price: listing.credit_price,
            duration_minutes: listing.duration_minutes,
            is_active: true
          })
          .select()
          .single();

        if (listingError) {
          console.warn(`⚠️ Could not create skill listing ${listing.title}:`, listingError.message);
          continue;
        }

        this.seededSkillListings.push(listingData);
        console.log(`✅ Created skill listing: ${listing.title}`);
        
      } catch (error) {
        console.warn(`⚠️ Error creating skill listing ${listing.title}:`, error);
      }
    }
    
    console.log(`📋 Created ${this.seededSkillListings.length} skill listings`);
  }

  private async seedTransactions(): Promise<void> {
    console.log('💰 Creating transactions...');
    
    let transactionCount = 0;
    
    // Create purchase transactions (students buying courses)
    for (let i = 0; i < this.seededSkillListings.length; i++) {
      const listing = this.seededSkillListings[i];
      const instructor = this.seededUsers[i % this.seededUsers.length];
      
      // Create 1-3 random students for each course
      const numStudents = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numStudents; j++) {
        const student = this.seededUsers[Math.floor(Math.random() * this.seededUsers.length)];
        
        // Skip if student is the instructor
        if (student.user_id === instructor.user_id) continue;
        
        try {
          // Create purchase transaction (student pays)
          const { error: purchaseError } = await supabase
            .from('transactions')
            .insert({
              user_id: student.user_id,
              skill_listing_id: listing.id,
              transaction_type: 'learn',
              amount: -listing.credit_price, // Negative for student
              created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date in last 90 days
            });

          if (purchaseError) {
            console.warn(`⚠️ Could not create purchase transaction:`, purchaseError.message);
            continue;
          }

          // Create teaching transaction (instructor earns)
          const { error: teachError } = await supabase
            .from('transactions')
            .insert({
              user_id: instructor.user_id,
              skill_listing_id: listing.id,
              transaction_type: 'teach',
              amount: listing.credit_price, // Positive for instructor
              created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date in last 90 days
            });

          if (teachError) {
            console.warn(`⚠️ Could not create teaching transaction:`, teachError.message);
            continue;
          }

          transactionCount += 2;
          console.log(`✅ Created transaction pair for ${listing.title}`);
          
        } catch (error) {
          console.warn(`⚠️ Error creating transactions for ${listing.title}:`, error);
        }
      }
    }
    
    console.log(`💰 Created ${transactionCount} transactions`);
  }

  private async seedCourseProgress(): Promise<void> {
    console.log('📈 Creating course progress...');
    
    let progressCount = 0;
    
    // Get all transactions to create progress entries
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('user_id, skill_listing_id')
      .eq('transaction_type', 'learn');

    if (transactionError || !transactions) {
      console.warn('⚠️ Could not fetch transactions for progress:', transactionError);
      return;
    }

    for (const transaction of transactions) {
      try {
        // Random progress between 0-100%
        const progressPercent = Math.floor(Math.random() * 101);
        
        const { error: progressError } = await supabase
          .from('course_progress')
          .insert({
            student_id: transaction.user_id,
            skill_listing_id: transaction.skill_listing_id,
            progress_percent: progressPercent,
            last_accessed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
          });

        if (progressError) {
          console.warn(`⚠️ Could not create progress entry:`, progressError.message);
          continue;
        }

        progressCount++;
        
      } catch (error) {
        console.warn(`⚠️ Error creating progress entry:`, error);
      }
    }
    
    console.log(`📈 Created ${progressCount} progress entries`);
  }

  private async seedReviews(): Promise<void> {
    console.log('⭐ Creating reviews and ratings...');
    
    let reviewCount = 0;
    
    // Get all completed courses (progress >= 100%)
    const { data: completedCourses, error: completedError } = await supabase
      .from('course_progress')
      .select('student_id, skill_listing_id')
      .gte('progress_percent', 100);

    if (completedError || !completedCourses) {
      console.warn('⚠️ Could not fetch completed courses for reviews:', completedError);
      return;
    }

    for (const course of completedCourses) {
      try {
        // Get instructor for this course
        const { data: listing, error: listingError } = await supabase
          .from('skill_listings')
          .select('user_id')
          .eq('id', course.skill_listing_id)
          .single();

        if (listingError || !listing) {
          console.warn(`⚠️ Could not find instructor for course:`, listingError);
          continue;
        }

        // Create review
        const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
        const feedbacks = [
          'Excellent course! Learned a lot.',
          'Great instructor, very helpful.',
          'Well-structured content.',
          'Highly recommended!',
          'Perfect for beginners.',
          'Amazing course, worth every credit!',
          'Clear explanations and good examples.',
          'Best course I\'ve taken on this topic.'
        ];

        const { error: reviewError } = await supabase
          .from('reviews')
          .insert({
            reviewer_id: course.student_id,
            reviewed_id: listing.user_id,
            skill_listing_id: course.skill_listing_id,
            rating: rating,
            feedback: feedbacks[Math.floor(Math.random() * feedbacks.length)],
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
          });

        if (reviewError) {
          console.warn(`⚠️ Could not create review:`, reviewError.message);
          continue;
        }

        reviewCount++;
        
      } catch (error) {
        console.warn(`⚠️ Error creating review:`, error);
      }
    }
    
    console.log(`⭐ Created ${reviewCount} reviews`);
  }

  private async refreshLeaderboards(): Promise<void> {
    console.log('🔄 Refreshing leaderboards...');
    
    try {
      const { error } = await supabase.rpc('refresh_all_leaderboards');
      if (error) {
        console.warn('⚠️ Could not refresh leaderboards:', error.message);
        return;
      }
      
      console.log('✅ Leaderboards refreshed');
    } catch (error) {
      console.warn('⚠️ Error refreshing leaderboards:', error);
    }
  }

  async clearAllData(): Promise<void> {
    console.log('🧹 Clearing all seeded data...');
    
    try {
      // Clear in reverse order to respect foreign key constraints
      await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('course_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('skill_listings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('skills').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      // Note: We don't delete profiles as they might be needed for other functionality
      console.log('✅ All seeded data cleared');
      
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      throw error;
    }
  }

  getStats(): { users: number; skills: number; listings: number } {
    return {
      users: this.seededUsers.length,
      skills: this.seededSkills.length,
      listings: this.seededSkillListings.length
    };
  }
}

// Export convenience functions
export const seedData = () => DataSeeder.getInstance().seedAllData();
export const clearData = () => DataSeeder.getInstance().clearAllData();
export const getSeedingStats = () => DataSeeder.getInstance().getStats();
