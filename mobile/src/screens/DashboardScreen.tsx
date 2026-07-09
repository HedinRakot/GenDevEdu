import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

import { useStreak } from '@/hooks/useStreak';
import { useNotes } from '@/hooks/useNotes';
import { useProgress, useStats, useCertificates } from '@/hooks/useCourses';
import { Badge, Button, Card, Icon, Input, ProgressBar, Typography } from '@/components/common';
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
        <Icon name="streak" size={28} color={colors.accent} />
        <View style={{ flex: 1 }}>
          <Typography variant="h3">{t('dashboard.streak.title')}</Typography>
          <Typography variant="bodySm" color="secondary">
            {currentStreak > 0 ? t('dashboard.streak.keepGoing') : t('dashboard.streak.startStreak')}
          </Typography>
        </View>
      </View>
      <View style={styles.streakStats}>
        <View style={styles.statBox}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Typography color={colors.primary} style={styles.statValue}>
              {currentStreak}
            </Typography>
          )}
          <Typography variant="caption" color="tertiary" style={styles.statLabel}>
            {t('dashboard.streak.current')}
          </Typography>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
        <View style={styles.statBox}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <Typography color="primary" style={styles.statValue}>
              {longestStreak}
            </Typography>
          )}
          <Typography variant="caption" color="tertiary" style={styles.statLabel}>
            {t('dashboard.streak.best')}
          </Typography>
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
      <Typography variant="h3">{t('dashboard.progress.title')}</Typography>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: Spacing.sm }} />
      ) : enrolledCourses === 0 ? (
        <Typography variant="bodySm" color="secondary" style={{ marginTop: Spacing.xs }}>
          {t('dashboard.progress.empty')}
        </Typography>
      ) : (
        <>
          <View style={styles.progressRow}>
            <Typography color={colors.primary} style={styles.progressText}>
              {completedItems}
            </Typography>
            <Typography variant="bodySm" color="secondary" style={{ marginBottom: 4 }}>
              {t('dashboard.progress.itemsCompletedLabel')}
            </Typography>
          </View>
          <Typography variant="caption" color="tertiary">
            {t('dashboard.progress.coursesEnrolled', { count: enrolledCourses })}
          </Typography>
        </>
      )}
    </Card>
  );
}

function StatTile({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: colors.surfaceElevated }]}>
      <Typography color={colors.primary} style={styles.tileValue}>
        {value}
      </Typography>
      <Typography variant="caption" color="secondary" center numberOfLines={2}>
        {label}
      </Typography>
    </View>
  );
}

export function StatsSection() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { data: stats, isLoading } = useStats();

  return (
    <Card>
      <Typography variant="h3">{t('dashboard.stats.title')}</Typography>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: Spacing.sm }} />
      ) : !stats ? (
        <Typography variant="bodySm" color="secondary" style={{ marginTop: Spacing.xs }}>
          {t('dashboard.stats.empty')}
        </Typography>
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
            <Typography variant="bodySm" color="secondary" style={{ marginTop: Spacing.sm }}>
              {t('dashboard.stats.empty')}
            </Typography>
          ) : (
            <View style={styles.courseStatsList}>
              {stats.courses.map((c) => (
                <View key={c.courseId} style={styles.courseStatRow}>
                  <View style={styles.courseStatHeader}>
                    <Typography variant="label" style={styles.courseStatName} numberOfLines={1}>
                      {c.courseName}
                    </Typography>
                    <Badge
                      label={c.completed ? t('dashboard.stats.done') : `${c.progressPercent}%`}
                      tone={c.completed ? 'success' : 'muted'}
                    />
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
      <Typography variant="h3">{t('dashboard.certificates.title')}</Typography>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: Spacing.sm }} />
      ) : !certs || certs.length === 0 ? (
        <Typography variant="bodySm" color="secondary" style={{ marginTop: Spacing.xs }}>
          {t('dashboard.certificates.empty')}
        </Typography>
      ) : (
        <View style={styles.certList}>
          {certs.map((c) => (
            <View key={c.id} style={[styles.certBadge, { backgroundColor: colors.surfaceElevated }]}>
              <Icon name="certificate" size={26} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Typography variant="label" numberOfLines={1}>
                  {c.courseName}
                </Typography>
                <Typography variant="caption" color="tertiary" numberOfLines={1}>
                  {t('dashboard.certificates.issuedOn', { date: new Date(c.issuedAt).toLocaleDateString() })}
                  {`  ·  ${t('dashboard.certificates.code')}: ${c.verificationCode}`}
                </Typography>
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
        <Typography variant="h1" style={{ marginBottom: Spacing.lg }}>
          {user ? t('dashboard.greeting', { name: user.name.split(' ')[0] }) : t('dashboard.title')}
        </Typography>

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
            <Icon name="courses" size={26} color={colors.primary} />
            <Typography variant="label">{t('glossary.title')}</Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('Snippets')}
          >
            <Icon name="snippets" size={26} color={colors.primary} />
            <Typography variant="label">{t('snippets.title')}</Typography>
          </TouchableOpacity>
        </View>

        {/* Notizen */}
        <View style={styles.sectionHeader}>
          <Typography variant="h3">{t('dashboard.notes.title')}</Typography>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => openModal()}
          >
            <Icon name="add" size={22} color={colors.textInverted} strokeWidth={2} />
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
            <Typography variant="body" color="tertiary">
              {t('dashboard.notes.empty')}
            </Typography>
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
                <Typography variant="label" numberOfLines={1} style={{ marginBottom: 4 }}>
                  {note.title}
                </Typography>
                <Typography variant="bodySm" color="secondary" numberOfLines={2}>
                  {note.content}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">
                {editingNote ? t('dashboard.notes.editNote') : t('dashboard.notes.addNote')}
              </Typography>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="close" size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <Input
              placeholder={t('dashboard.notes.noteTitlePlaceholder')}
              value={noteTitle}
              onChangeText={setNoteTitle}
              maxLength={100}
              containerStyle={{ marginBottom: Spacing.md }}
            />
            <Input
              placeholder={t('dashboard.notes.noteContentPlaceholder')}
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              textAlignVertical="top"
              containerStyle={{ flex: 1 }}
              style={{ minHeight: 200 }}
            />

            <Button
              title={t('common.save')}
              variant="primary"
              fullWidth
              onPress={handleSaveNote}
              style={{ marginTop: Spacing.md }}
            />
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
  streakHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  streakStats: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  statBox: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: '70%' },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold },
  statLabel: { textTransform: 'uppercase' },

  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.xs },
  progressText: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold },

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
  courseStatsList: { marginTop: Spacing.lg, gap: Spacing.md },
  courseStatRow: { gap: 6 },
  courseStatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courseStatName: { flex: 1, marginRight: Spacing.sm },

  certList: { marginTop: Spacing.sm, gap: Spacing.sm },
  certBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.md },

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

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  addButton: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  emptyNotes: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderStyle: 'dashed',
    borderWidth: 2,
  },

  notesList: { gap: Spacing.md },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Spacing.lg,
    minHeight: '60%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
});
