// app/(tabs)/home.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { userState } from '../../constants/userState';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

// ==== Dummy Data ====

const DUMMY_EVENTS = [
  {
    id: '1',
    title: 'Moklet Cup 2024',
    image: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?w=600',
    status: 'Pendaftaran Buka',
    dateRange: '15 - 20 Aug 2024',
    location: 'Sport Hall',
    category: 'Olahraga',
  },
  {
    id: '2',
    title: 'Pekan Raya Akademik',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600',
    status: 'Pendaftaran Buka',
    dateRange: '25 - 28 Aug 2024',
    location: 'Aula Utama',
    category: 'Akademik',
  },
  {
    id: '3',
    title: 'Moklet Hackathon 2024',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600',
    status: 'Pendaftaran Buka',
    dateRange: '02 - 05 Sep 2024',
    location: 'Lab Komputer',
    category: 'Akademik',
  },
];

const DUMMY_ANNOUNCEMENTS = [
  {
    id: '1',
    title: 'Jadwal Ujian Tengah Semester',
    description: 'Informasi lengkap mengenai jadwal ujian tengah semester ganjil.',
    icon: 'document-text-outline',
    timeAgo: 'Tersisa 2 hari lagi',
    type: 'Akademik',
  },
  {
    id: '2',
    title: 'Seminar Karir IT',
    description: 'Wajib bagi kelas XII untuk mengikuti pengenalan industri digital.',
    icon: 'megaphone-outline',
    timeAgo: 'Baru saja',
    type: 'Lainnya',
  },
];

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const username = userState.getNama();

  // Filter events based on search query
  const filteredEvents = DUMMY_EVENTS.filter((event) => {
    return event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filter announcements based on search query
  const filteredAnnouncements = DUMMY_ANNOUNCEMENTS.filter((ann) => {
    return ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBadge}>
              <Ionicons name="school" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.headerTitle}>Moklet Event Center</Text>
          </View>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' }}
            style={styles.avatar}
          />
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Halo, {username}!</Text>
          <Text style={styles.welcomeSubtitle}>
            Ayo ikut serta dalam event seru di sekolah hari ini.
          </Text>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.textPlaceholder} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari event atau pengumuman..."
            placeholderTextColor={Colors.textPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>



        {/* EVENT AKTIF SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Event Aktif</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.sectionLink}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {filteredEvents.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + Spacing.base}
            style={styles.eventsScroll}
            contentContainerStyle={styles.eventsContainer}
          >
            {filteredEvents.map((event) => (
              <TouchableOpacity key={event.id} style={styles.eventCard} activeOpacity={0.95}>
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: event.image }} style={styles.eventImage} />

                  {/* Status Badge */}
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>{event.status}</Text>
                  </View>

                  {/* Overlay Title */}
                  <View style={styles.gradientOverlay}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                  </View>
                </View>

                {/* Card Info Details */}
                <View style={styles.eventInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.textSubtitle} />
                    <Text style={styles.infoText}>{event.dateRange}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="pin-outline" size={14} color={Colors.textSubtitle} />
                    <Text style={styles.infoText}>{event.location}</Text>
                  </View>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{event.category}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={40} color={Colors.textPlaceholder} />
            <Text style={styles.emptyStateText}>Tidak ada event untuk kategori ini</Text>
          </View>
        )}

        {/* PENGUMUMAN TERBARU SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pengumuman Terbaru</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.sectionLink}>Lainnya</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.announcementsList}>
          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map((ann) => {
              const isAcademic = ann.type === 'Akademik';
              const indicatorColor = isAcademic ? Colors.primary : '#FFA000'; // Red for academic, Orange for other
              const bgIconColor = isAcademic ? '#FFEBEE' : '#FFF8E1'; // Soft pinkish/red or soft yellow

              return (
                <View key={ann.id} style={[styles.annCard, { borderLeftColor: indicatorColor }]}>
                  <View style={[styles.annIconWrapper, { backgroundColor: bgIconColor }]}>
                    <Ionicons
                      name={ann.icon as any}
                      size={20}
                      color={indicatorColor}
                    />
                  </View>
                  <View style={styles.annContent}>
                    <Text style={styles.annTitle}>{ann.title}</Text>
                    <Text style={styles.annDescription}>{ann.description}</Text>
                    <Text style={styles.annTime}>{ann.timeAgo}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={40} color={Colors.textPlaceholder} />
              <Text style={styles.emptyStateText}>Tidak ada pengumuman untuk kategori ini</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.round,
    backgroundColor: '#E0E0E0',
  },
  welcomeSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    marginBottom: Spacing.base,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: Colors.textSubtitle,
    lineHeight: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textMain,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textMain,
  },
  sectionLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  eventsScroll: {
    marginBottom: Spacing.xl,
  },
  eventsContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.base,
  },
  eventCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrapper: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  eventImage: {
    height: '100%',
    width: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: '#E8F5E9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.round,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2E7D32',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.4)', // Basic dark overlay for text readability
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  eventInfo: {
    padding: Spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSubtitle,
  },
  categoryBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSubtitle,
  },
  announcementsList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  annCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderLeftWidth: 4,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  annIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  annContent: {
    flex: 1,
  },
  annTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMain,
    marginBottom: 4,
  },
  annDescription: {
    fontSize: 12,
    color: Colors.textSubtitle,
    lineHeight: 16,
    marginBottom: 8,
  },
  annTime: {
    fontSize: 11,
    color: Colors.textSubtitle,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyStateText: {
    fontSize: 13,
    color: Colors.textSubtitle,
  },
});
