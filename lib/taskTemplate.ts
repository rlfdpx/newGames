export type TaskTemplate = { category: string; name: string; priority: string; sort_order: number }

export const TASK_TEMPLATE: TaskTemplate[] = [
  { category: '1. Game Basics', name: 'Name Game',    priority: 'High',   sort_order: 0 },
  { category: '1. Game Basics', name: 'Theme Game',   priority: 'High',   sort_order: 1 },
  { category: '1. Game Basics', name: 'Game Music',   priority: 'Medium', sort_order: 2 },
  { category: '1. Game Basics', name: 'Thumbnail',    priority: 'Medium', sort_order: 3 },
  { category: '1. Game Basics', name: 'Game Rules',   priority: 'High',   sort_order: 4 },

  { category: '2. How-To Content Prep', name: 'How-To Script',    priority: 'High',   sort_order: 5 },
  { category: '2. How-To Content Prep', name: 'Storyboard',       priority: 'Medium', sort_order: 6 },
  { category: '2. How-To Content Prep', name: 'Audio Recording',  priority: 'Medium', sort_order: 7 },
  { category: '2. How-To Content Prep', name: 'Video Production', priority: 'Medium', sort_order: 8 },

  { category: '3. Announcement', name: 'Game Banner Announcement', priority: 'Medium', sort_order: 9 },
  { category: '3. Announcement', name: 'Banner Coming Soon',       priority: 'Medium', sort_order: 10 },

  { category: '4. Communication / Distribution', name: 'WhatsApp Message',  priority: 'Medium', sort_order: 11 },
  { category: '4. Communication / Distribution', name: 'Push Notification', priority: 'Medium', sort_order: 12 },
  { category: '4. Communication / Distribution', name: 'Social Media Post', priority: 'Medium', sort_order: 13 },

  { category: '5. Launch & Follow-up', name: 'Release Date',                          priority: 'High',   sort_order: 14 },
  { category: '5. Launch & Follow-up', name: 'Post-launch Monitoring – Feedback Users', priority: 'Medium', sort_order: 15 },
]

export const CATEGORIES = [...new Set(TASK_TEMPLATE.map((t) => t.category))]
