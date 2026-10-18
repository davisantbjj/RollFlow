import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../theme/colors';
import { CalendarDays, Users, Clock, GraduationCap, ChevronDown, ChevronUp, Plus, X, ClipboardCheck, Pencil, Trash2 } from 'lucide-react-native';
import { Fonts } from '../../theme/typography';
import { Text, Screen, Header, Loading, ErrorState, Empty, Button, Field, Chip, Badge, cardStyle } from '../components/ui';
import { useAuthStore, isManagement, isStaff } from '../../store/authStore';
import { api } from '../services/api';
import { notify, confirmAction, apiError } from '../utils/notify';
import { beltName } from '../utils/format';

interface ClassItem {
  id: string;
  name: string;
  description?: string | null;
  dayOfWeek?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  maxStudents?: number | null;
  teachers?: { id: string; name: string }[];
  _count?: { students: number; teachers: number };
}

interface ClassDetail extends ClassItem {
  teachers: { id: string; name: string }[];
  students: { id: string; name: string; beltColor?: string | null; beltDegree?: number | null; isBlocked: boolean }[];
}

interface Person {
  id: string;
  name: string;
}

const EMPTY_FORM = { name: '', description: '', dayOfWeek: '', startTime: '', endTime: '', maxStudents: '' };
type FormState = typeof EMPTY_FORM;

export default function Classes() {
  const { user } = useAuthStore();
  const manager = isManagement(user?.role);
  const staff = isStaff(user?.role);

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/classes');
      setClasses(res.data || []);
    } catch (err) {
      setError(apiError(err, 'Não foi possível carregar as turmas.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <Header
        title="Turmas"
        right={manager ? <Button label={showCreate ? 'Fechar' : 'Nova turma'} icon={showCreate ? X : Plus} variant={showCreate ? 'ghost' : 'gold'} onPress={() => setShowCreate(!showCreate)} /> : undefined}
      />
      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />
          }
        >
          {showCreate && (
            <ClassForm
              title="Nova turma"
              submitLabel="Criar turma"
              initial={EMPTY_FORM}
              onCancel={() => setShowCreate(false)}
              onSubmit={async (body) => {
                // na criação, campos vazios simplesmente não são enviados
                const clean = Object.fromEntries(Object.entries(body).filter(([, v]) => v !== null));
                await api.post('/classes', { ...clean, academyId: user?.academyId });
                notify.success('Turma criada.');
                setShowCreate(false);
                load();
              }}
            />
          )}

          {error ? (
            <ErrorState message={error} onRetry={load} />
          ) : classes.length === 0 ? (
            <Empty icon={CalendarDays} title="Nenhuma turma cadastrada" hint={manager ? 'Toque em "Nova turma" para criar a primeira.' : undefined} />
          ) : (
            classes.map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                staff={staff}
                manager={manager}
                open={expanded === cls.id}
                onToggle={() => setExpanded(expanded === cls.id ? null : cls.id)}
                onChanged={load}
              />
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

// ------------------------------------------------------------------ Card + detalhe
function ClassCard({ cls, staff, manager, open, onToggle, onChanged }: {
  cls: ClassItem; staff: boolean; manager: boolean; open: boolean; onToggle: () => void; onChanged: () => void;
}) {
  const router = useRouter();
  const teacherNames = (cls.teachers || []).map((t) => t.name).join(', ');

  return (
    <View style={cardStyle}>
      <TouchableOpacity
        onPress={staff ? onToggle : undefined}
        activeOpacity={staff ? 0.7 : 1}
        accessibilityRole={staff ? 'button' : undefined}
        accessibilityLabel={staff ? `${open ? 'Fechar' : 'Abrir'} detalhes de ${cls.name}` : undefined}
      >
        <View style={styles.head}>
          <View style={styles.timeBox}>
            <Text style={styles.timeText}>{cls.startTime || '--:--'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{cls.name}</Text>
            {cls.description ? <Text style={styles.desc}>{cls.description}</Text> : null}
          </View>
          {staff && (open ? <ChevronUp size={20} color={Colors.muted} strokeWidth={2} /> : <ChevronDown size={20} color={Colors.muted} strokeWidth={2} />)}
        </View>
        <View style={styles.badges}>
          {cls._count ? <Meta icon={Users} text={`${cls._count.students} ${cls._count.students === 1 ? 'aluno' : 'alunos'}`} /> : null}
          {cls.dayOfWeek ? <Meta icon={CalendarDays} text={cls.dayOfWeek} /> : null}
          {cls.endTime ? <Meta icon={Clock} mono text={`${cls.startTime}–${cls.endTime}`} /> : null}
          {teacherNames ? <Meta icon={GraduationCap} text={teacherNames} /> : null}
        </View>
      </TouchableOpacity>

      {staff && (
        <Button
          label="Fazer chamada"
          icon={ClipboardCheck}
          variant="blue"
          style={{ marginTop: 14 }}
          onPress={() => router.push({ pathname: '/checkin' as any, params: { classId: cls.id, className: cls.name } })}
        />
      )}

      {open && staff && <ClassDetailPanel cls={cls} manager={manager} onChanged={onChanged} />}
    </View>
  );
}

function Meta({ text, icon: Icon, mono }: { text: string; icon: any; mono?: boolean }) {
  return (
    <View style={styles.meta}>
      <Icon size={14} color={Colors.muted} strokeWidth={2} />
      <Text style={[styles.metaText, mono && { fontFamily: Fonts.mono }]}>{text}</Text>
    </View>
  );
}

function ClassDetailPanel({ cls, manager, onChanged }: { cls: ClassItem; manager: boolean; onChanged: () => void }) {
  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [picker, setPicker] = useState<null | 'teacher' | 'student'>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get(`/classes/${cls.id}`);
      setDetail(res.data);
    } catch (err) {
      setError(apiError(err, 'Não foi possível carregar a turma.'));
    } finally {
      setLoading(false);
    }
  }, [cls.id]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshAll = async () => {
    await load();
    onChanged();
  };

  const openPicker = async (kind: 'teacher' | 'student') => {
    if (picker === kind) {
      setPicker(null);
      return;
    }
    setPicker(kind);
    setPeopleLoading(true);
    try {
      const res = await api.get('/users', {
        params: kind === 'student' ? { filterRole: 'ALUNO' } : { filterRole: 'PROFESSOR', includeAdmins: true },
      });
      setPeople(res.data || []);
    } catch (err) {
      notify.error(apiError(err, 'Não foi possível carregar a lista.'));
      setPicker(null);
    } finally {
      setPeopleLoading(false);
    }
  };

  const run = async (fn: () => Promise<any>, okMsg: string, failMsg: string) => {
    setBusy(true);
    try {
      await fn();
      notify.success(okMsg);
      await refreshAll();
    } catch (err) {
      notify.error(apiError(err, failMsg));
    } finally {
      setBusy(false);
    }
  };

  const addTeacher = (p: Person) =>
    run(() => api.post(`/classes/${cls.id}/teachers`, { teacherId: p.id }), 'Professor vinculado.', 'Não foi possível vincular o professor.');
  const enroll = (p: Person) =>
    run(() => api.post(`/classes/${cls.id}/enroll`, { studentId: p.id }), 'Aluno matriculado.', 'Não foi possível matricular o aluno.');

  const removeTeacher = async (t: Person) => {
    if (!(await confirmAction({ title: 'Remover professor', message: `Remover ${t.name} desta turma?`, confirmText: 'Remover', destructive: true }))) return;
    run(() => api.delete(`/classes/${cls.id}/teachers/${t.id}`), 'Professor removido.', 'Não foi possível remover o professor.');
  };
  const removeStudent = async (s: Person) => {
    if (!(await confirmAction({ title: 'Remover aluno', message: `Remover ${s.name} desta turma?`, confirmText: 'Remover', destructive: true }))) return;
    run(() => api.delete(`/classes/${cls.id}/enroll/${s.id}`), 'Aluno removido da turma.', 'Não foi possível remover o aluno.');
  };

  const deleteClass = async () => {
    const ok = await confirmAction({
      title: 'Excluir turma',
      message: `"${cls.name}" será excluída junto com matrículas e presenças. Não dá para desfazer.`,
      confirmText: 'Excluir turma',
      destructive: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.delete(`/classes/${cls.id}`);
      notify.success('Turma excluída.');
      onChanged();
    } catch (err) {
      notify.error(apiError(err, 'Não foi possível excluir a turma.'));
      setBusy(false);
    }
  };

  if (loading) return <View style={styles.panel}><Loading /></View>;
  if (error || !detail) return <View style={styles.panel}><ErrorState message={error || 'Turma não encontrada.'} onRetry={load} /></View>;

  const enrolledIds = new Set(detail.students.map((s) => s.id));
  const teacherIds = new Set(detail.teachers.map((t) => t.id));
  const available = people.filter((p) => !(picker === 'teacher' ? teacherIds : enrolledIds).has(p.id));

  return (
    <View style={styles.panel}>
      {editing ? (
        <ClassForm
          title="Editar turma"
          submitLabel="Salvar alterações"
          initial={{
            name: detail.name,
            description: detail.description || '',
            dayOfWeek: detail.dayOfWeek || '',
            startTime: detail.startTime || '',
            endTime: detail.endTime || '',
            maxStudents: detail.maxStudents ? String(detail.maxStudents) : '',
          }}
          onCancel={() => setEditing(false)}
          onSubmit={async (body) => {
            await api.put(`/classes/${cls.id}`, body);
            notify.success('Turma atualizada.');
            setEditing(false);
            await refreshAll();
          }}
        />
      ) : null}

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Professores</Text>
        {manager && <Chip label={picker === 'teacher' ? 'Fechar' : 'Vincular'} onPress={() => openPicker('teacher')} />}
      </View>
      {picker === 'teacher' && (
        <Picker loading={peopleLoading} people={available} emptyText="Nenhum professor disponível para vincular." onPick={addTeacher} />
      )}
      {detail.teachers.length === 0 ? (
        <Text style={styles.emptyLine}>Nenhum professor vinculado.</Text>
      ) : (
        detail.teachers.map((t) => (
          <PersonRow key={t.id} name={t.name} onRemove={manager ? () => removeTeacher(t) : undefined} disabled={busy} />
        ))
      )}

      <View style={[styles.sectionRow, { marginTop: 18 }]}>
        <Text style={styles.sectionTitle}>Alunos ({detail.students.length})</Text>
        {manager && <Chip label={picker === 'student' ? 'Fechar' : 'Matricular'} onPress={() => openPicker('student')} />}
      </View>
      {picker === 'student' && (
        <Picker loading={peopleLoading} people={available} emptyText="Todos os alunos já estão nesta turma." onPick={enroll} />
      )}
      {detail.students.length === 0 ? (
        <Text style={styles.emptyLine}>Nenhum aluno matriculado.</Text>
      ) : (
        detail.students.map((s) => (
          <PersonRow
            key={s.id}
            name={s.name}
            sub={`Faixa ${beltName(s.beltColor)} · ${s.beltDegree || 0}º grau`}
            badge={s.isBlocked ? 'Bloqueado' : undefined}
            onRemove={manager ? () => removeStudent(s) : undefined}
            disabled={busy}
          />
        ))
      )}

      {manager && !editing && (
        <View style={styles.panelActions}>
          <Button label="Editar turma" icon={Pencil} variant="ghost" onPress={() => setEditing(true)} />
          <Button label="Excluir turma" icon={Trash2} variant="danger" onPress={deleteClass} loading={busy} />
        </View>
      )}
    </View>
  );
}

function PersonRow({ name, sub, badge, onRemove, disabled }: {
  name: string; sub?: string; badge?: string; onRemove?: () => void; disabled?: boolean;
}) {
  return (
    <View style={styles.person}>
      <View style={{ flex: 1 }}>
        <Text style={styles.personName}>{name}</Text>
        {sub ? <Text style={styles.personSub}>{sub}</Text> : null}
      </View>
      {badge ? <Badge label={badge} color={Colors.red} /> : null}
      {onRemove && (
        <TouchableOpacity onPress={onRemove} disabled={disabled} accessibilityRole="button" accessibilityLabel={`Remover ${name}`} style={styles.removeBtn}>
          <Text style={styles.removeText}>Remover</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Picker({ loading, people, emptyText, onPick }: {
  loading: boolean; people: Person[]; emptyText: string; onPick: (p: Person) => void;
}) {
  return (
    <View style={styles.picker}>
      {loading ? (
        <Text style={styles.emptyLine}>Carregando...</Text>
      ) : people.length === 0 ? (
        <Text style={styles.emptyLine}>{emptyText}</Text>
      ) : (
        <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
          {people.map((p) => (
            <TouchableOpacity key={p.id} style={styles.pickerItem} onPress={() => onPick(p)} accessibilityRole="button">
              <Text style={styles.personName}>{p.name}</Text>
              <Text style={styles.addText}>Adicionar</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ------------------------------------------------------------------ Formulário
function ClassForm({ title, submitLabel, initial, onSubmit, onCancel }: {
  title: string;
  submitLabel: string;
  initial: FormState;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof FormState) => (t: string) => setForm((f) => ({ ...f, [k]: t }));

  const submit = async () => {
    const next: Partial<FormState> = {};
    if (form.name.trim().length < 2) next.name = 'Informe o nome da turma (mín. 2 letras).';
    const timeRe = /^([01]?\d|2[0-3]):[0-5]\d$/;
    if (form.startTime.trim() && !timeRe.test(form.startTime.trim())) next.startTime = 'Use o formato 19:30.';
    if (form.endTime.trim() && !timeRe.test(form.endTime.trim())) next.endTime = 'Use o formato 20:30.';
    const max = form.maxStudents.trim() ? Number(form.maxStudents) : null;
    if (max !== null && (!Number.isInteger(max) || max <= 0)) next.maxStudents = 'Informe um número inteiro maior que zero.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim() || null,
        dayOfWeek: form.dayOfWeek.trim() || null,
        startTime: form.startTime.trim() || null,
        endTime: form.endTime.trim() || null,
        maxStudents: max,
      });
    } catch (err) {
      notify.error(apiError(err, 'Não foi possível salvar a turma.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[cardStyle, { borderColor: Colors.gold }]}>
      <Text style={styles.formTitle}>{title}</Text>
      <Field label="Nome da turma" value={form.name} onChangeText={set('name')} error={errors.name} />
      <Field label="Descrição (opcional)" value={form.description} onChangeText={set('description')} />
      <Field label="Dia da semana" value={form.dayOfWeek} onChangeText={set('dayOfWeek')} placeholder="Ex.: Segunda e quarta" />
      <View style={styles.twoCols}>
        <View style={{ flex: 1 }}>
          <Field label="Início" value={form.startTime} onChangeText={set('startTime')} error={errors.startTime} placeholder="19:30" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Fim" value={form.endTime} onChangeText={set('endTime')} error={errors.endTime} placeholder="20:30" />
        </View>
      </View>
      <Field label="Limite de alunos (opcional)" value={form.maxStudents} onChangeText={set('maxStudents')} error={errors.maxStudents} keyboardType="number-pad" />
      <View style={styles.panelActions}>
        <Button label="Cancelar" variant="ghost" onPress={onCancel} />
        <Button label={submitLabel} onPress={submit} loading={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  timeBox: { backgroundColor: Colors.gold, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12, minWidth: 58, alignItems: 'center' },
  timeText: { fontFamily: Fonts.monoBold, fontSize: 16, color: '#000' },
  name: { fontSize: 16, color: Colors.text, fontWeight: 'bold' },
  desc: { fontSize: 13, color: Colors.muted, marginTop: 4 },
  chevron: { color: Colors.muted, fontSize: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.card2, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  metaText: { color: Colors.muted, fontSize: 12, fontWeight: '600' },
  panel: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 16, paddingTop: 16 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { color: Colors.text, fontWeight: 'bold', fontSize: 15 },
  emptyLine: { color: Colors.muted, fontSize: 13, paddingVertical: 6 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  personName: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  personSub: { color: Colors.muted, fontSize: 12, marginTop: 2 },
  removeBtn: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  removeText: { color: Colors.red, fontWeight: 'bold', fontSize: 13 },
  panelActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  picker: { backgroundColor: Colors.card2, borderRadius: 12, paddingHorizontal: 12, marginBottom: 10 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, minHeight: 44 },
  addText: { color: Colors.gold, fontWeight: 'bold', fontSize: 13 },
  formTitle: { color: Colors.gold, fontFamily: Fonts.display, fontSize: 24, letterSpacing: 1, marginBottom: 16 },
  twoCols: { flexDirection: 'row', gap: 12 },
});
