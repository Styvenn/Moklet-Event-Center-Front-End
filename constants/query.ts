export const cacheTime = {
  hot: 0,
  reactive: 1000 * 60 * 1,
  warm: 1000 * 60 * 5,
  cold: 1000 * 60 * 15,
} as const;

export const queryKeys = {
  home: (studentId?: string, userId?: string) => ['home', studentId, userId] as const,
  events: (studentId?: string, userId?: string) => ['events', studentId, userId] as const,
  eventDetail: (eventId?: string) => ['event-detail', eventId] as const,
  eventCategories: (eventId?: string) => ['event-categories', eventId] as const,
  registrationHistory: ['registration-history'] as const,
  team: (teamId?: string) => ['team', teamId] as const,

  // ─── Admin ───
  adminStats: ['admin', 'stats'] as const,
  adminStudents: ['admin', 'students'] as const,
  adminPanitia: ['admin', 'panitia'] as const,
  adminAkademik: ['admin', 'akademik'] as const,

  // ─── Panitia ───
  panitiaDashboard: ['panitia', 'dashboard'] as const,
  managedEvents: ['panitia', 'events'] as const,
  panitiaEventDetail: (eventId?: string) =>
    ['panitia-event-detail', eventId || ''] as const,
  announcementsList: ['panitia-announcements'] as const,
} as const;
