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
import { useStats, useCertificates } from '@/hooks/useCourses';
import { Button, Card, Icon, Input, ProgressBar, Typography } from '@/components/common';
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

  // Wochentags-Punkte (Mo–So): ein Tag gilt als "erledigt", wenn er nicht in der
  // Zukunft liegt und innerhalb der aktuellen Streak-Länge bis heute zurückreicht.
  const weekdays = t('dashboard.streak.weekdaysShort', { returnObjects: true }) as string[];
  const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Montag … 6 = Sonntag
  const isFilled = (i: number) => i <= todayIndex && todayIndex - i < currentStreak;

  return (
    <Card>
      <Typography variant="caption" color="tertiary" style={styles.eyebrow}>
        {t('dashboard.streak.title')}
      </Typography>
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: Spacing.sm }} />
      ) : (
        <>
          <View style={styles.streakValueRow}>
            <Typography color={colors.primary} style={styles.streakBig}>
              {currentStreak}
            </Typography>
            <Typography variant="body" color="secondary" style={styles.streakUnit}>
              {t('dashboard.streak.daysInARow')}
            </Typography>
          </View>
          <Typography variant="bodySm" color="tertiary">
            {t('dashboard.streak.personalRecord', { count: longestStreak })}
          </Typography>
          <View style={styles.weekRow}>
            {weekdays.map((label, i) => (
              <View key={label} style={styles.weekDay}>
                <View
                  style={[
                    styles.weekDot,
                    {
                      backgroundColor: isFilled(i) ? colors.accent : 'transparent',
                      borderColor: isFilled(i) ? colors.accent : colors.border,
                    },
                  ]}
                />
                <Typography variant="caption" color="tertiary">
                  {label}
                </Typography>
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
}

/** Kurs-Initialen für das Badge, z. B. ".NET Grundlagen" → "NG", "SQL" → "SQL". */
function courseInitials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function ContinueLearningSection() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { data: stats, isLoading } = useStats();

  // Nur laufende Kurse (angefangen, noch nicht abgeschlossen) – "weiter lernen".
  const inProgress = (stats?.courses ?? []).filter((c) => !c.completed && c.progressPercent > 0);

  return (
    <Card>
      <View style={styles.cardHeaderRow}>
        <Typography variant="h3">{t('dashboard.continue.title')}</Typography>
        <TouchableOpacity onPress={() => navigation.navigate('Courses', { screen: 'CoursesList' })}>
          <Typography variant="label" color="accent">
            {t('dashboard.continue.allCourses')}
          </Typography>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: Spacing.sm }} />
      ) : inProgress.length === 0 ? (
        <Typography variant="bodySm" color="secondary" style={{ marginTop: Spacing.xs }}>
          {t('dashboard.continue.empty')}
        </Typography>
      ) : (
        <View style={styles.continueList}>
          {inProgress.map((c) => (
            <TouchableOpacity
              key={c.courseId}
              style={styles.continueRow}
              onPress={() =>
                navigation.navigate('Courses', {
                  screen: 'CourseDetail',
                  params: { courseId: c.courseId },
                })
              }
            >
              <View style={[styles.courseBadge, { backgroundColor: colors.primarySurface }]}>
                <Typography variant="label" color={colors.primary}>
                  {courseInitials(c.courseName)}
                </Typography>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.continueTitleRow}>
                  <Typography variant="label" numberOfLines={1} style={{ flex: 1 }}>
                    {c.courseName}
                  </Typography>
                  <Typography variant="label" color={colors.primary}>
                    {c.progressPercent}%
                  </Typography>
                </View>
                <Typography
                  variant="caption"
                  color="tertiary"
                  numberOfLines={1}
                  style={{ marginBottom: 6 }}
                >
                  {t('dashboard.continue.chapterOf', {
                    current: Math.min(c.chaptersPassed + 1, c.totalChapters),
                    total: c.totalChapters,
                  })}
                </Typography>
                <ProgressBar progress={c.progressPercent} height={8} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Card>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statRow, { borderBottomColor: colors.borderLight }]}>
      <Typography variant="body" color="secondary">
        {label}
      </Typography>
      <Typography variant="label" color={colors.textPrimary} style={styles.statRowValue}>
        {value}
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
      <Typography variant="caption" color="tertiary" style={styles.eyebrow}>
        {t('dashboard.stats.title')}
      </Typography>

      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: Spacing.sm }} />
      ) : !stats ? (
        <Typography variant="bodySm" color="secondary" style={{ marginTop: Spacing.xs }}>
          {t('dashboard.stats.empty')}
        </Typography>
      ) : (
        <View style={{ marginTop: Spacing.sm }}>
          <StatRow label={t('dashboard.stats.activeCourses')} value={String(stats.activeCourses)} />
          <StatRow
            label={t('dashboard.stats.completedCourses')}
            value={String(stats.completedCourses)}
          />
          <StatRow
            label={t('dashboard.stats.accuracy')}
            value={`${stats.quizAccuracyPercent}%`}
          />
          <View style={styles.overallBlock}>
            <View style={styles.overallHeader}>
              <Typography variant="body" color="secondary">
                {t('dashboard.stats.overallProgress')}
              </Typography>
              <Typography variant="label" color={colors.textPrimary}>
                {stats.overallProgressPercent}%
              </Typography>
            </View>
            <ProgressBar progress={stats.overallProgressPercent} height={8} color={colors.primary} />
          </View>
        </View>
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

        <ContinueLearningSection />
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
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs },

  // Lern-Streak
  streakValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  streakBig: { fontSize: 44, fontWeight: FontWeight.extrabold, lineHeight: 48 },
  streakUnit: { marginBottom: 8 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md },
  weekDay: { alignItems: 'center', gap: 6 },
  weekDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },

  // Weiter lernen
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  continueList: { gap: Spacing.lg, marginTop: Spacing.xs },
  continueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  courseBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },

  // Statistik
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statRowValue: { fontSize: FontSize.md },
  overallBlock: { marginTop: Spacing.md, gap: Spacing.xs },
  overallHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

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
