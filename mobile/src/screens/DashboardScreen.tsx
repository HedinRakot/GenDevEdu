import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { useStreak } from '@/hooks/useStreak';
import { useNotes } from '@/hooks/useNotes';
import { useProgress, useStats, useCertificates } from '@/hooks/useCourses';
import { Card } from '@/components/common/Card';
import { ProgressBar } from '@/components/common/ProgressBar';
import { DailyChallengeCard } from '@/components/widgets/DailyChallengeCard';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { FontSize, FontWeight, Radius, Spacing, type Palette } from '@/config/theme';
import { FEATURES } from '@/config/features';

function StreakCard({
  currentStreak,
  longestStreak,
  isLoading,
}: {
  currentStreak: number;
  longestStreak: number;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Card>
      <View style={styles.streakHeader}>
        <Text style={styles.cardEmoji}>🔥</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {t('dashboard.streak.title')}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {currentStreak > 0 ? t('dashboard.streak.keepGoing') : t('dashboard.streak.startStreak')}
          </Text>
        </View>
      </View>
      <View style={styles.streakStats}>
        <View style={styles.statBox}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.statValue, { color: colors.primary }]}>{currentStreak}</Text>
          )}
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
            {t('dashboard.streak.current')}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
        <View style={styles.statBox}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{longestStreak}</Text>
          )}
          <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
            {t('dashboard.streak.best')}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function ProgressCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { data: progress, isLoading } = useProgress();

  const enrolledCourses = progress?.length ?? 0;
  const completedItems =
    progress?.reduce((sum, p) => sum + p.completedChapterContentIds.length, 0) ?? 0;

  return (
    <Card>
      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
        {t('dashboard.progress.title')}
      </Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: Spacing.sm }} />
      ) : enrolledCourses === 0 ? (
        <Text style={[styles.progressDetail, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
          {t('dashboard.progress.empty')}
        </Text>
      ) : (
        <>
          <View style={styles.progressRow}>
            <Text style={[styles.progressText, { color: colors.primary }]}>{completedItems}</Text>
            <Text style={[styles.progressDetail, { color: colors.textSecondary }]}>
              {t('dashboard.progress.itemsCompletedLabel')}
            </Text>
          </View>
          <Text style={[styles.cardSubtitle, { color: colors.textTertiary }]}>
            {t('dashboard.progress.coursesEnrolled', { count: enrolledCourses })}
          </Text>
        </>
      )}
    </Card>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: colors.surfaceElevated }]}>
      <Text style={[styles.tileValue, { color: colors.primary }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: colors.textSecondary }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export function StatsSection() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { data: stats, isLoading } = useStats();

  return (
    <Card>
      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
        {t('dashboard.stats.title')}
      </Text>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: Spacing.sm }} />
      ) : !stats ? (
        <Text style={[styles.progressDetail, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
          {t('dashboard.stats.empty')}
        </Text>
      ) : (
        <>
          <View style={styles.tileGrid}>
            <StatTile value={String(stats.activeCourses)} label={t('dashboard.stats.activeCourses')} />
            <StatTile value={String(stats.completedCourses)} label={t('dashboard.stats.completedCourses')} />
            <StatTile value={`${stats.quizAccuracyPercent}%`} label={t('dashboard.stats.accuracy')} />
            <StatTile
              value={`${stats.chapterQuizzesPassed}/${stats.chapterQuizzesTaken}`}
              label={t('dashboard.stats.quizzesPassed')}
            />
            <StatTile
              value={`${stats.codeTasksSolved}/${stats.codeTasksAttempted}`}
              label={t('dashboard.stats.codeSolved')}
            />
          </View>

          {stats.courses.length === 0 ? (
            <Text style={[styles.progressDetail, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
              {t('dashboard.stats.empty')}
            </Text>
          ) : (
            <View style={styles.courseStatsList}>
              {stats.courses.map((c) => (
                <View key={c.courseId} style={styles.courseStatRow}>
                  <View style={styles.courseStatHeader}>
                    <Text style={[styles.courseStatName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {c.courseName}
                    </Text>
                    <Text
                      style={[
                        styles.courseStatBadge,
                        {
                          color: c.completed ? colors.success : colors.textTertiary,
                        },
                      ]}
                    >
                      {c.completed ? t('dashboard.stats.done') : `${c.progressPercent}%`}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={c.progressPercent}
                    height={8}
                    color={c.completed ? colors.success : colors.primary}
                  />
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </Card>
  );
}

export function CertificatesSection() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { data: certs, isLoading } = useCertificates();

  return (
    <Card>
      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
        {t('dashboard.certificates.title')}
      </Text>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: Spacing.sm }} />
      ) : !certs || certs.length === 0 ? (
        <Text style={[styles.progressDetail, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
          {t('dashboard.certificates.empty')}
        </Text>
      ) : (
        <View style={styles.certList}>
          {certs.map((c) => (
            <View key={c.id} style={[styles.certBadge, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={styles.certEmoji}>🏅</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.certName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {c.courseName}
                </Text>
                <Text style={[styles.certMeta, { color: colors.textTertiary }]} numberOfLines={1}>
                  {t('dashboard.certificates.issuedOn', { date: new Date(c.issuedAt).toLocaleDateString() })}
                  {`  ·  ${t('dashboard.certificates.code')}: ${c.verificationCode}`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

export function DashboardScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { currentStreak, longestStreak, isLoading: streakLoading, refresh } = useStreak();
  const { notes, addNote, editNote, removeNote, isLoading: notesLoading } = useNotes();

  const styles2 = useMemo(() => makeStyles(colors), [colors]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<{ id: string; title: string; content: string } | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) return;
    if (editingNote) {
      await editNote(editingNote.id, { title: noteTitle, content: noteContent });
    } else {
      await addNote(noteTitle, noteContent);
    }
    closeModal();
  };

  const openModal = (note?: { id: string; title: string; content: string }) => {
    if (note) {
      setEditingNote(note);
      setNoteTitle(note.title);
      setNoteContent(note.content);
    } else {
      setEditingNote(null);
      setNoteTitle('');
      setNoteContent('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNoteTitle('');
    setNoteContent('');
    setEditingNote(null);
  };

  const handleDeleteNote = (id: string) => {
    Alert.alert(t('dashboard.notes.deleteTitle'), t('dashboard.notes.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeNote(id) },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
          {user ? t('dashboard.greeting', { name: user.name.split(' ')[0] }) : t('dashboard.title')}
        </Text>

        <DailyChallengeCard onCompleted={refresh} />
        <View style={{ height: Spacing.lg }} />

        <StreakCard
          currentStreak={currentStreak}
          longestStreak={longestStreak}
          isLoading={streakLoading}
        />
        <View style={{ height: Spacing.lg }} />

        <ProgressCard />
        <View style={{ height: Spacing.lg }} />

        <StatsSection />
        <View style={{ height: Spacing.lg }} />

        {FEATURES.certificates && (
          <>
            <CertificatesSection />
            <View style={{ height: Spacing.lg }} />
          </>
        )}

        {/* Quick-Links */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Courses', { screen: 'Glossary' })}
          >
            <Text style={styles.quickEmoji}>📖</Text>
            <Text style={[styles.quickTitle, { color: colors.textPrimary }]}>
              {t('glossary.title')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Snippets')}
          >
            <Text style={styles.quickEmoji}>📌</Text>
            <Text style={[styles.quickTitle, { color: colors.textPrimary }]}>
              {t('snippets.title')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notizen */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('dashboard.notes.title')}
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => openModal()}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {notesLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: Spacing.xl }} />
        ) : notes.length === 0 ? (
          <View
            style={[
              styles.emptyNotes,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.emptyNotesText, { color: colors.textTertiary }]}>
              {t('dashboard.notes.empty')}
            </Text>
          </View>
        ) : (
          <View style={styles.notesList}>
            {notes.map((note) => (
              <TouchableOpacity
                key={note.id}
                style={[styles2.noteCard]}
                onPress={() => openModal(note)}
                onLongPress={() => handleDeleteNote(note.id)}
              >
                <Text style={[styles.noteTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {note.title}
                </Text>
                <Text
                  style={[styles.noteSnippet, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {note.content}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {editingNote ? t('dashboard.notes.editNote') : t('dashboard.notes.addNote')}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={[styles.closeIcon, { color: colors.textTertiary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.inputTitle,
                { color: colors.textPrimary, borderBottomColor: colors.border },
              ]}
              placeholder={t('dashboard.notes.noteTitlePlaceholder')}
              placeholderTextColor={colors.textTertiary}
              value={noteTitle}
              onChangeText={setNoteTitle}
              maxLength={100}
            />
            <TextInput
              style={[styles.inputContent, { color: colors.textPrimary }]}
              placeholder={t('dashboard.notes.noteContentPlaceholder')}
              placeholderTextColor={colors.textTertiary}
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveNote}
            >
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    noteCard: {
      backgroundColor: colors.surface,
      padding: Spacing.md,
      borderRadius: Radius.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },
  });

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  welcomeText: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    marginBottom: Spacing.lg,
  },
  cardEmoji: { fontSize: 32, marginRight: Spacing.md },
  streakHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  cardTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  cardSubtitle: { fontSize: FontSize.sm },
  streakStats: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  statBox: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: '70%' },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold },
  statLabel: { fontSize: FontSize.xs, textTransform: 'uppercase' },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.xs },
  progressText: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },
  progressDetail: { fontSize: FontSize.sm, marginBottom: 4 },

  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    gap: 2,
  },
  tileValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  tileLabel: { fontSize: FontSize.xs, textAlign: 'center' },
  courseStatsList: { marginTop: Spacing.lg, gap: Spacing.md },
  courseStatRow: { gap: 6 },
  courseStatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courseStatName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, flex: 1, marginRight: Spacing.sm },
  courseStatBadge: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  certList: { marginTop: Spacing.sm, gap: Spacing.sm },
  certBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md },
  certEmoji: { fontSize: 28 },
  certName: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  certMeta: { fontSize: FontSize.xs, marginTop: 2 },

  quickRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  quickCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  quickEmoji: { fontSize: 28 },
  quickTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  addButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: 'white', fontSize: 24, fontWeight: FontWeight.bold },

  emptyNotes: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  emptyNotesText: { fontSize: FontSize.md },

  notesList: { gap: Spacing.md },
  noteTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: 4 },
  noteSnippet: { fontSize: FontSize.sm, lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Spacing.lg,
    minHeight: '60%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  closeIcon: { fontSize: 24 },
  inputTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  inputContent: { flex: 1, fontSize: FontSize.md, lineHeight: 24, minHeight: 200 },
  saveButton: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonText: { color: 'white', fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
