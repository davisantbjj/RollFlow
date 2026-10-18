import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Colors } from '../../theme/colors';
import { CreditCard, CircleCheck, Clock, TriangleAlert, Lock, Plus, Pencil, Trash2, DollarSign, Wallet } from 'lucide-react-native';
import { Fonts, Type } from '../../theme/typography';
import { Text, StatCard, Screen, Header, Loading, ErrorState, Empty, Button, Field, Chip, Badge, cardStyle } from '../components/ui';
import { useAuthStore, isManagement } from '../../store/authStore';
import { api } from '../services/api';
import { notify, confirmAction, apiError } from '../utils/notify';
import { money, dateBR, INTERVALS } from '../utils/format';

interface PaymentMe {
  id: string;
  amount: number;
  status: 'PENDING' | 'PAID' | string;
  dueDate: string;
  paymentDate: string | null;
  isOverdue: boolean;
}

interface Me {
  subscription: {
    id: string;
    status: string;
    dueDate: string;
    plan: { id: string; name: string; price: number; interval: string };
  } | null;
  payments: PaymentMe[];
}

interface Overview {
  monthRevenue: number;
  overdueTotal: number;
  overdueCount: number;
  pendingCount: number;
  payments: {
    id: string;
    amount: number;
    status: string;
    dueDate: string;
    isOverdue: boolean;
    user: { id: string; name: string };
    plan: { id: string; name: string };
  }[];
}

interface Plan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  interval: string;
  isActive?: boolean;
}

const SUB_STATUS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Em dia', color: Colors.green },
  OVERDUE: { label: 'Em atraso', color: Colors.red },
  CANCELED: { label: 'Cancelada', color: Colors.muted },
};

export default function Finance() {
  const { user } = useAuthStore();
  return isManagement(user?.role) && !user?.isBlocked ? <ManagerFinance /> : <MyFinance />;
}

// ---------------------------------------------------------------- Aluno / Responsável
function MyFinance() {
  const blocked = useAuthStore((s) => !!s.user?.isBlocked);
  const setBlocked = useAuthStore((s) => s.setBlocked);
  const [data, setData] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [res, profile] = await Promise.all([api.get('/payments/me'), api.get('/users/profile')]);
      setData(res.data);
      // Se a academia registrou o pagamento, o acesso completo volta na hora
      setBlocked(!!profile.data.isBlocked);
    } catch (err) {
      setError(apiError(err, 'Não foi possível carregar seu financeiro.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setBlocked]);

  useEffect(() => {
    load();
  }, [load]);

  const sub = data?.subscription;
  // Fatura vencida conta como atraso mesmo antes de a assinatura virar OVERDUE (prazo de carência)
  const hasOverdue = !!data?.payments.some((p) => p.isOverdue);
  const subStatus = sub && sub.status === 'ACTIVE' && hasOverdue ? 'OVERDUE' : sub?.status;
  const status = subStatus ? SUB_STATUS[subStatus] || { label: subStatus, color: Colors.muted } : null;

  return (
    <Screen>
      <Header title="Financeiro" />
      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />
          }
        >
          {blocked && (
            <View style={styles.blockedBanner} accessibilityRole="alert">
              <View style={styles.bannerHead}>
                <Lock size={20} color={Colors.red} strokeWidth={2} />
                <Text style={styles.blockedTitle}>Acesso bloqueado</Text>
              </View>
              <Text style={styles.blockedText}>
                Sua mensalidade está em atraso. Regularize o pagamento com a academia para liberar as aulas e o
                restante do app. Depois, puxe a tela para baixo para atualizar.
              </Text>
            </View>
          )}
          {error ? (
            <ErrorState message={error} onRetry={load} />
          ) : !sub ? (
            <Empty icon={CreditCard} title="Você ainda não tem um plano" hint="Fale com a academia para contratar um plano." />
          ) : (
            <View style={[cardStyle, { borderColor: status?.color }]}>
              <View style={styles.rowBetween}>
                <Text style={styles.planName}>{sub.plan.name}</Text>
                {status && <Badge label={status.label} color={status.color} icon={status.color === Colors.red ? TriangleAlert : CircleCheck} />}
              </View>
              <Text style={styles.planPrice}>
                {money(sub.plan.price)} <Text style={styles.muted}>/ {(INTERVALS[sub.plan.interval] || sub.plan.interval).toLowerCase()}</Text>
              </Text>
              <Text style={styles.muted}>Próximo vencimento: {dateBR(sub.dueDate)}</Text>
            </View>
          )}

          {!error && (
            <>
              <Text style={styles.section}>Histórico</Text>
              {(data?.payments || []).length === 0 ? (
                <Empty icon={Wallet} title="Nenhuma cobrança ainda" />
              ) : (
                data!.payments.map((p) => {
                  const paid = p.status === 'PAID';
                  const color = paid ? Colors.green : p.isOverdue ? Colors.red : Colors.gold;
                  const label = paid ? 'Pago' : p.isOverdue ? 'Atrasado' : 'Pendente';
                  return (
                    <View key={p.id} style={cardStyle}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.amount}>{money(p.amount)}</Text>
                        <Badge label={label} color={color} icon={paid ? CircleCheck : p.isOverdue ? TriangleAlert : Clock} />
                      </View>
                      <Text style={styles.muted}>
                        Vence em {dateBR(p.dueDate)}
                        {paid && p.paymentDate ? ` · pago em ${dateBR(p.paymentDate)}` : ''}
                      </Text>
                      {!paid && (
                        <Button
                          label="Pagar"
                          variant="ghost"
                          style={{ marginTop: 12, alignSelf: 'flex-start' }}
                          onPress={() => notify.info('Em breve: pagamento por PIX.')}
                        />
                      )}
                    </View>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------- Gestão
function ManagerFinance() {
  const { user } = useAuthStore();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [payingId, setPayingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [ov, pl] = await Promise.all([api.get('/payments/overview'), api.get('/plans')]);
      setOverview(ov.data);
      setPlans((pl.data || []).filter((p: Plan) => p.isActive !== false));
    } catch (err) {
      setError(apiError(err, 'Não foi possível carregar o financeiro.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markPaid = async (id: string, name: string) => {
    const ok = await confirmAction({
      title: 'Marcar como pago',
      message: `Confirmar o recebimento da mensalidade de ${name}?`,
      confirmText: 'Marcar como pago',
    });
    if (!ok) return;
    setPayingId(id);
    try {
      await api.post(`/payments/${id}/pay`);
      notify.success('Pagamento registrado.');
      load();
    } catch (err) {
      notify.error(apiError(err, 'Não foi possível registrar o pagamento.'));
    } finally {
      setPayingId(null);
    }
  };

  return (
    <Screen>
      <Header title="Financeiro" />
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
          {error ? (
            <ErrorState message={error} onRetry={load} />
          ) : (
            <>
              <View style={styles.cardsRow}>
                <Summary icon={DollarSign} label="Receita do mês" value={money(overview?.monthRevenue)} color={Colors.green} />
                <Summary icon={TriangleAlert} label="Em atraso" value={money(overview?.overdueTotal)} color={(overview?.overdueCount ?? 0) > 0 ? Colors.red : Colors.text} />
              </View>
              <View style={styles.cardsRow}>
                <Summary icon={TriangleAlert} label="Atrasadas" value={String(overview?.overdueCount ?? 0)} />
                <Summary icon={Clock} label="Pendentes" value={String(overview?.pendingCount ?? 0)} />
              </View>

              <Text style={styles.section}>Cobranças abertas</Text>
              {(overview?.payments || []).length === 0 ? (
                <Empty icon={CircleCheck} title="Nenhuma cobrança pendente" hint="Quando houver mensalidades a receber, elas aparecem aqui." />
              ) : (
                overview!.payments.map((p) => (
                  <View key={p.id} style={[cardStyle, p.isOverdue && { borderColor: 'rgba(232,75,75,0.5)' }]}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.amount} numberOfLines={1}>{p.user.name}</Text>
                      <Badge label={p.isOverdue ? 'Atrasado' : 'Pendente'} color={p.isOverdue ? Colors.red : Colors.gold} icon={p.isOverdue ? TriangleAlert : Clock} />
                    </View>
                    <Text style={styles.muted}>
                      {p.plan.name} · {money(p.amount)} · vence em {dateBR(p.dueDate)}
                    </Text>
                    <Button
                      label="Marcar como pago"
                      icon={CircleCheck}
                      variant="green"
                      loading={payingId === p.id}
                      onPress={() => markPaid(p.id, p.user.name)}
                      style={{ marginTop: 12, alignSelf: 'flex-start' }}
                    />
                  </View>
                ))
              )}

              <PlansSection plans={plans} academyId={user?.academyId || undefined} onChanged={load} />
            </>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

function Summary({ label, value, color, icon }: { label: string; value: string; color?: string; icon?: any }) {
  return <StatCard label={label} value={value} color={color} icon={icon} small={value.length > 8} />;
}

// ---------------------------------------------------------------- Planos
const EMPTY_FORM = { name: '', price: '', description: '', interval: 'MONTHLY' };

function PlansSection({ plans, academyId, onChanged }: { plans: Plan[]; academyId?: string; onChanged: () => void }) {
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});
  const [saving, setSaving] = useState(false);

  const open = (plan?: Plan) => {
    setErrors({});
    if (plan) {
      setForm({ name: plan.name, price: String(plan.price).replace('.', ','), description: plan.description || '', interval: plan.interval });
      setEditing(plan.id);
    } else {
      setForm(EMPTY_FORM);
      setEditing('new');
    }
  };

  const save = async () => {
    const price = Number(form.price.replace(/\./g, '').replace(',', '.'));
    const next: typeof errors = {};
    if (form.name.trim().length < 2) next.name = 'Informe o nome do plano (mín. 2 letras).';
    if (!form.price.trim() || isNaN(price) || price <= 0) next.price = 'Informe um valor maior que zero.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        interval: form.interval,
      };
      if (editing === 'new') await api.post('/plans', { ...body, description: body.description || undefined, academyId });
      else await api.put(`/plans/${editing}`, body);
      notify.success(editing === 'new' ? 'Plano criado.' : 'Plano atualizado.');
      setEditing(null);
      onChanged();
    } catch (err) {
      notify.error(apiError(err, 'Não foi possível salvar o plano.'));
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (plan: Plan) => {
    const ok = await confirmAction({
      title: 'Desativar plano',
      message: `"${plan.name}" deixará de ser oferecido. Assinaturas existentes continuam.`,
      confirmText: 'Desativar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/plans/${plan.id}`);
      notify.success('Plano desativado.');
      onChanged();
    } catch (err) {
      notify.error(apiError(err, 'Não foi possível desativar o plano.'));
    }
  };

  return (
    <View>
      <View style={[styles.rowBetween, { marginTop: 16, marginBottom: 12 }]}>
        <Text style={[styles.section, { marginTop: 0, marginBottom: 0 }]}>Planos</Text>
        {editing === null && <Button label="Novo plano" icon={Plus} onPress={() => open()} />}
      </View>

      {editing !== null && (
        <View style={[cardStyle, { borderColor: Colors.gold }]}>
          <Text style={styles.formTitle}>{editing === 'new' ? 'Novo plano' : 'Editar plano'}</Text>
          <Field label="Nome" value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} error={errors.name} placeholder="Ex.: Mensal ilimitado" />
          <Field label="Valor (R$)" value={form.price} onChangeText={(t) => setForm({ ...form, price: t })} error={errors.price} keyboardType="decimal-pad" placeholder="170,00" />
          <Field label="Descrição (opcional)" value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
          <Text style={styles.chipLabel}>Cobrança</Text>
          <View style={styles.chips}>
            {Object.entries(INTERVALS).map(([k, v]) => (
              <Chip key={k} label={v} active={form.interval === k} onPress={() => setForm({ ...form, interval: k })} />
            ))}
          </View>
          <View style={styles.formActions}>
            <Button label="Cancelar" variant="ghost" onPress={() => setEditing(null)} />
            <Button label="Salvar plano" onPress={save} loading={saving} />
          </View>
        </View>
      )}

      {plans.length === 0 ? (
        <Empty title="Nenhum plano ativo" hint="Crie um plano para cobrar seus alunos." />
      ) : (
        plans.map((plan) => (
          <View key={plan.id} style={cardStyle}>
            <View style={styles.rowBetween}>
              <Text style={styles.amount}>{plan.name}</Text>
              <Text style={styles.planGold}>{money(plan.price)}</Text>
            </View>
            <Text style={styles.muted}>
              {INTERVALS[plan.interval] || plan.interval}
              {plan.description ? ` · ${plan.description}` : ''}
            </Text>
            <View style={styles.formActions}>
              <Button label="Editar" icon={Pencil} variant="ghost" onPress={() => open(plan)} />
              <Button label="Desativar" icon={Trash2} variant="danger" onPress={() => deactivate(plan)} />
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  blockedBanner: {
    backgroundColor: 'rgba(232,75,75,0.12)',
    borderColor: 'rgba(232,75,75,0.35)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  bannerHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  blockedTitle: { color: Colors.red, fontWeight: 'bold', fontSize: 16 },
  blockedText: { color: Colors.text, opacity: 0.85, lineHeight: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 6 },
  muted: { color: Colors.muted, fontFamily: Fonts.mono, fontSize: 12, lineHeight: 20 },
  section: { ...Type.section, color: Colors.text, marginTop: 12, marginBottom: 12 },
  planName: { color: Colors.text, fontSize: 18, fontWeight: 'bold', flex: 1 },
  planPrice: { color: Colors.gold, fontFamily: Fonts.monoBold, fontSize: 28, marginBottom: 8 },
  planGold: { color: Colors.gold, fontFamily: Fonts.monoBold, fontSize: 16 },
  amount: { color: Colors.text, fontSize: 16, fontWeight: 'bold', flexShrink: 1 },
  cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  formTitle: { color: Colors.gold, fontFamily: Fonts.display, fontSize: 24, letterSpacing: 1, marginBottom: 16 },
  chipLabel: { color: Colors.text, fontWeight: 'bold', fontSize: 13, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap' },
});
