'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './AdminClient.module.css';

type PlanId = 'danisman' | 'ofis' | 'kurumsal';
type SubscriptionStatusFilter = 'all' | 'active' | 'cancelled' | 'none';
type CreditFilter = 'all' | 'positive' | 'zero';
type AdminTab = 'overview' | 'credits' | 'history' | 'subscription' | 'account';

type SubscriptionStatus = 'active' | 'cancelled' | 'none';

interface AdminOverviewMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  totalCredits: number;
  recentRuns24h: number;
}

interface UserListItem {
  userId: string;
  email: string;
  createdAt: number;
  credits: number;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlanName: string | null;
  lastActivityAt: number | null;
  totalUsedCredits: number;
}

interface CreditLedgerEntry {
  id: number;
  delta: number;
  reason: string;
  createdAt: number;
}

interface AdminToolRunEntry {
  entryId: string;
  runId: string;
  toolId: string;
  status: string;
  failCode: string | null;
  usedCredits: number;
  refunded: boolean;
  createdAt: number;
  title: string | null;
  detail: string | null;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  roomType: string | null;
  style: string | null;
}

interface ToolBreakdownItem {
  toolId: string;
  runCount: number;
  usedCredits: number;
}

interface SubscriptionInfo {
  planId: PlanId;
  planName: string;
  monthlyCredits: number;
  monthlyPrice: number;
  status: 'active' | 'cancelled';
  startDate: string;
  nextBillingDate: string;
  cancelledAt?: string;
  lastUsedCredits?: number;
}

interface AdminUserDetail {
  userId: string;
  email: string;
  createdAt: number;
  credits: number;
  subscriptionStatus: SubscriptionStatus;
  lastActivityAt: number | null;
  totalCreditsUsed: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  recent30dRuns: number;
  recent30dCreditsUsed: number;
  subscription: SubscriptionInfo | null;
  ledger: CreditLedgerEntry[];
  runs: AdminToolRunEntry[];
  toolBreakdown: ToolBreakdownItem[];
}

const PLAN_OPTIONS: Array<{ id: PlanId; label: string }> = [
  { id: 'danisman', label: 'Danışman' },
  { id: 'ofis', label: 'Ofis' },
  { id: 'kurumsal', label: 'Kurumsal' },
];

const TAB_ITEMS: Array<{ id: AdminTab; label: string }> = [
  { id: 'overview', label: 'Özet' },
  { id: 'credits', label: 'Krediler' },
  { id: 'history', label: 'Kullanım Geçmişi' },
  { id: 'subscription', label: 'Abonelik' },
  { id: 'account', label: 'Hesap' },
];

function formatDateTime(value: number | string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('tr-TR').format(Math.max(0, Number(value) || 0));
}

function statusLabel(status: SubscriptionStatus): string {
  if (status === 'active') return 'Aktif';
  if (status === 'cancelled') return 'İptal';
  return 'Paket yok';
}

function toolLabel(toolId: string): string {
  switch (toolId) {
    case 'stage': return 'Sanal Dekorasyon';
    case 'listing-text': return 'İlan Metni';
    case 'ai-tour-guide': return 'Sanal Sunucu';
    case 'enhance': return 'Fotoğraf Geliştirme';
    case 'remove-object': return 'Akıllı Eşya Silme';
    case 'virtual-renovation':
    case 'sanal-tadilat': return 'Sanal Tadilat';
    default: return toolId;
  }
}

export default function AdminClient() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [overview, setOverview] = useState<AdminOverviewMetrics | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [query, setQuery] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusFilter>('all');
  const [creditFilter, setCreditFilter] = useState<CreditFilter>('all');
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [setAmount, setSetAmount] = useState('0');
  const [addAmount, setAddAmount] = useState('50');
  const [deductAmount, setDeductAmount] = useState('50');
  const [creditReason, setCreditReason] = useState('');
  const [planReason, setPlanReason] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('danisman');
  const [resetCredits, setResetCredits] = useState(false);

  const selectedUser = useMemo(
    () => users.find((item) => item.userId === selectedUserId) || null,
    [users, selectedUserId]
  );

  const loadList = async (preserveSelected = true) => {
    setListLoading(true);
    setError('');
    try {
      const search = new URLSearchParams({
        view: 'list',
        q: query,
        subscriptionStatus,
        creditFilter,
        limit: '50',
      });
      const response = await fetch(`/api/admin/account?${search.toString()}`, { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setError(data.error || 'Kullanıcı listesi alınamadı.');
        return;
      }
      const nextUsers = Array.isArray(data.users) ? data.users as UserListItem[] : [];
      setUsers(nextUsers);
      setOverview(data.overview || null);
      if (!preserveSelected || !selectedUserId || !nextUsers.some((item) => item.userId === selectedUserId)) {
        const nextSelected = nextUsers[0]?.userId || '';
        setSelectedUserId(nextSelected);
      }
    } catch {
      setError('Kullanıcı listesi alınamadı.');
    } finally {
      setListLoading(false);
    }
  };

  const loadDetail = async (userId: string) => {
    if (!userId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/account?view=detail&userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setDetail(null);
        setError(data.error || 'Kullanıcı detayı alınamadı.');
        return;
      }
      const nextDetail = data.detail as AdminUserDetail;
      setDetail(nextDetail);
      setSetAmount(String(nextDetail.credits ?? 0));
      if (nextDetail.subscription?.planId) {
        setSelectedPlan(nextDetail.subscription.planId);
      }
    } catch {
      setDetail(null);
      setError('Kullanıcı detayı alınamadı.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void loadList(false);
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    void loadDetail(selectedUserId);
  }, [selectedUserId]);

  const runAction = async (payload: Record<string, unknown>, successMessage: string) => {
    if (!selectedUserId) return;
    setActionLoading(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, ...payload }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setError(data.error || 'İşlem başarısız oldu.');
        return;
      }
      setDetail(data.detail || null);
      setNotice(successMessage);
      setCreditReason('');
      setPlanReason('');
      await loadList();
    } catch {
      setError('İşlem başarısız oldu.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmAction = (message: string): boolean => window.confirm(message);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Super Admin</p>
            <h1 className={styles.title}>Kullanıcı kredileri ve kullanım hareketleri tek ekranda</h1>
            <p className={styles.subtitle}>Kimin kaç kredisi var, hangi tool’da ne kadar harcamış, aboneliği ne durumda ve müdahale gereken hesaplar hangileri burada yönetilir.</p>
          </div>
          <div className={styles.metrics}>
            <div className={styles.metricCard}><span>Toplam kullanıcı</span><strong>{overview ? formatMoney(overview.totalUsers) : '—'}</strong></div>
            <div className={styles.metricCard}><span>Aktif abonelik</span><strong>{overview ? formatMoney(overview.activeSubscriptions) : '—'}</strong></div>
            <div className={styles.metricCard}><span>Toplam kredi</span><strong>{overview ? formatMoney(overview.totalCredits) : '—'}</strong></div>
            <div className={styles.metricCard}><span>Son 24 saat run</span><strong>{overview ? formatMoney(overview.recentRuns24h) : '—'}</strong></div>
          </div>
        </section>

        <section className={styles.workspace}>
          <aside className={styles.sidebar}>
            <div className={styles.panelHeader}>
              <h2>Kullanıcılar</h2>
              <button type="button" className={styles.ghostBtn} onClick={() => void loadList()} disabled={listLoading}>Yenile</button>
            </div>

            <div className={styles.filters}>
              <input
                className={styles.input}
                placeholder="E-posta ile ara"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className={styles.filterRow}>
                <select className={styles.select} value={subscriptionStatus} onChange={(e) => setSubscriptionStatus(e.target.value as SubscriptionStatusFilter)}>
                  <option value="all">Tüm paketler</option>
                  <option value="active">Aktif paket</option>
                  <option value="cancelled">İptal paket</option>
                  <option value="none">Paketsiz</option>
                </select>
                <select className={styles.select} value={creditFilter} onChange={(e) => setCreditFilter(e.target.value as CreditFilter)}>
                  <option value="all">Tüm krediler</option>
                  <option value="positive">Kredisi olan</option>
                  <option value="zero">Kredisi sıfır</option>
                </select>
              </div>
              <button type="button" className={styles.primaryBtn} onClick={() => void loadList(false)} disabled={listLoading}>Filtreyi Uygula</button>
            </div>

            <div className={styles.userList}>
              {listLoading ? <p className={styles.empty}>Kullanıcılar yükleniyor...</p> : null}
              {!listLoading && users.length === 0 ? <p className={styles.empty}>Filtreye uygun kullanıcı bulunamadı.</p> : null}
              {users.map((user) => (
                <button
                  key={user.userId}
                  type="button"
                  className={`${styles.userCard} ${selectedUserId === user.userId ? styles.userCardActive : ''}`}
                  onClick={() => setSelectedUserId(user.userId)}
                >
                  <div className={styles.userCardTop}>
                    <strong>{user.email}</strong>
                    <span className={`${styles.badge} ${styles[`badge${user.subscriptionStatus.charAt(0).toUpperCase()}${user.subscriptionStatus.slice(1)}`] || ''}`}>{statusLabel(user.subscriptionStatus)}</span>
                  </div>
                  <div className={styles.userMeta}>
                    <span>{user.subscriptionPlanName || 'Paket yok'}</span>
                    <span>{formatMoney(user.credits)} kredi</span>
                  </div>
                  <div className={styles.userMetaMuted}>
                    <span>Son aktivite: {formatDateTime(user.lastActivityAt)}</span>
                    <span>Harcanan: {formatMoney(user.totalUsedCredits)}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className={styles.detailPanel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>{detail?.email || selectedUser?.email || 'Kullanıcı seçin'}</h2>
                <p className={styles.panelSub}>Kredi, abonelik ve kullanım hareketlerini buradan yönet.</p>
              </div>
              {selectedUserId ? (
                <button type="button" className={styles.ghostBtn} onClick={() => void loadDetail(selectedUserId)} disabled={detailLoading}>Detayı Yenile</button>
              ) : null}
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}
            {notice ? <div className={styles.notice}>{notice}</div> : null}

            {!selectedUserId ? <div className={styles.emptyState}>Detayları görmek için soldan bir kullanıcı seç.</div> : null}
            {selectedUserId && detailLoading ? <div className={styles.emptyState}>Kullanıcı detayı yükleniyor...</div> : null}

            {detail && !detailLoading ? (
              <>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryCard}><span>Kalan kredi</span><strong>{formatMoney(detail.credits)}</strong></div>
                  <div className={styles.summaryCard}><span>Toplam run</span><strong>{formatMoney(detail.totalRuns)}</strong></div>
                  <div className={styles.summaryCard}><span>Toplam harcanan kredi</span><strong>{formatMoney(detail.totalCreditsUsed)}</strong></div>
                  <div className={styles.summaryCard}><span>Son 30 gün</span><strong>{formatMoney(detail.recent30dCreditsUsed)} kredi</strong></div>
                </div>

                <div className={styles.tabs}>
                  {TAB_ITEMS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === 'overview' ? (
                  <div className={styles.tabPanel}>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}><span>E-posta</span><strong>{detail.email}</strong></div>
                      <div className={styles.infoItem}><span>User ID</span><strong>{detail.userId}</strong></div>
                      <div className={styles.infoItem}><span>Kayıt tarihi</span><strong>{formatDateTime(detail.createdAt)}</strong></div>
                      <div className={styles.infoItem}><span>Son aktivite</span><strong>{formatDateTime(detail.lastActivityAt)}</strong></div>
                      <div className={styles.infoItem}><span>Başarılı run</span><strong>{formatMoney(detail.successfulRuns)}</strong></div>
                      <div className={styles.infoItem}><span>Başarısız run</span><strong>{formatMoney(detail.failedRuns)}</strong></div>
                    </div>
                    <div className={styles.sectionCard}>
                      <h3>Tool dağılımı</h3>
                      <div className={styles.breakdownList}>
                        {detail.toolBreakdown.length === 0 ? <p className={styles.emptyInline}>Henüz kullanım kaydı yok.</p> : null}
                        {detail.toolBreakdown.map((item) => (
                          <div key={item.toolId} className={styles.breakdownRow}>
                            <span>{toolLabel(item.toolId)}</span>
                            <span>{formatMoney(item.runCount)} run • {formatMoney(item.usedCredits)} kredi</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeTab === 'credits' ? (
                  <div className={styles.tabPanel}>
                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span>Bakiyeyi set et</span>
                        <input className={styles.input} value={setAmount} inputMode="numeric" onChange={(e) => setSetAmount(e.target.value.replace(/\D/g, ''))} />
                      </label>
                      <label className={styles.field}>
                        <span>Kredi ekle</span>
                        <input className={styles.input} value={addAmount} inputMode="numeric" onChange={(e) => setAddAmount(e.target.value.replace(/\D/g, ''))} />
                      </label>
                      <label className={styles.field}>
                        <span>Kredi düş</span>
                        <input className={styles.input} value={deductAmount} inputMode="numeric" onChange={(e) => setDeductAmount(e.target.value.replace(/\D/g, ''))} />
                      </label>
                      <label className={styles.field}>
                        <span>İşlem notu</span>
                        <input className={styles.input} value={creditReason} onChange={(e) => setCreditReason(e.target.value)} placeholder="Destek notu / neden" />
                      </label>
                    </div>
                    <div className={styles.actionRow}>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        disabled={actionLoading}
                        onClick={() => {
                          if (!confirmAction('Kullanıcının kredi bakiyesini yeni değere sabitlemek istediğine emin misin?')) return;
                          void runAction({ action: 'set_credits', amount: Number(setAmount || 0), reason: creditReason }, 'Kredi bakiyesi güncellendi.');
                        }}
                      >
                        Krediyi Sabitle
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        disabled={actionLoading}
                        onClick={() => {
                          if (!confirmAction('Kullanıcıya ek kredi vermek istediğine emin misin?')) return;
                          void runAction({ action: 'add_credits', amount: Number(addAmount || 0), reason: creditReason }, 'Ek kredi hesaba işlendi.');
                        }}
                      >
                        Kredi Ekle
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        disabled={actionLoading}
                        onClick={() => {
                          if (!confirmAction('Kullanıcının kredisini düşmek istediğine emin misin?')) return;
                          void runAction({ action: 'deduct_credits', amount: Number(deductAmount || 0), reason: creditReason }, 'Kredi düşümü tamamlandı.');
                        }}
                      >
                        Kredi Düş
                      </button>
                    </div>
                    <div className={styles.sectionCard}>
                      <h3>Kredi ledger</h3>
                      <div className={styles.ledgerList}>
                        {detail.ledger.length === 0 ? <p className={styles.emptyInline}>Kredi ledger kaydı yok.</p> : null}
                        {detail.ledger.map((entry) => (
                          <div key={entry.id} className={styles.ledgerRow}>
                            <div>
                              <strong className={entry.delta >= 0 ? styles.positive : styles.negative}>{entry.delta >= 0 ? `+${entry.delta}` : entry.delta}</strong>
                              <p>{entry.reason}</p>
                            </div>
                            <span>{formatDateTime(entry.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeTab === 'history' ? (
                  <div className={styles.tabPanel}>
                    <div className={styles.sectionCard}>
                      <h3>Kredi kullanım zaman akışı</h3>
                      <div className={styles.runList}>
                        {detail.runs.length === 0 ? <p className={styles.emptyInline}>Henüz kullanım kaydı yok.</p> : null}
                        {detail.runs.map((run) => (
                          <article key={run.entryId} className={styles.runCard}>
                            <div className={styles.runHeader}>
                              <div>
                                <strong>{run.title || toolLabel(run.toolId)}</strong>
                                <p>{formatDateTime(run.createdAt)}</p>
                              </div>
                              <div className={styles.runBadges}>
                                <span className={`${styles.badge} ${run.status === 'success' ? styles.badgeActive : styles.badgeCancelled}`}>{run.status}</span>
                                <span className={styles.badgeNeutral}>{run.usedCredits} kredi</span>
                              </div>
                            </div>
                            <div className={styles.runMeta}>
                              <span>Tool: {toolLabel(run.toolId)}</span>
                              {run.roomType ? <span>Oda: {run.roomType}</span> : null}
                              {run.style ? <span>Tarz: {run.style}</span> : null}
                              {run.failCode ? <span>Hata: {run.failCode}</span> : null}
                              {run.refunded ? <span>İade edildi</span> : null}
                            </div>
                            {run.detail ? <p className={styles.runDetail}>{run.detail}</p> : null}
                            {(run.beforeImageUrl || run.afterImageUrl) ? (
                              <div className={styles.imageLinks}>
                                {run.beforeImageUrl ? <a href={run.beforeImageUrl} target="_blank" rel="noreferrer">Önce görseli</a> : null}
                                {run.afterImageUrl ? <a href={run.afterImageUrl} target="_blank" rel="noreferrer">Sonra görseli</a> : null}
                              </div>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeTab === 'subscription' ? (
                  <div className={styles.tabPanel}>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoItem}><span>Plan</span><strong>{detail.subscription?.planName || 'Paket yok'}</strong></div>
                      <div className={styles.infoItem}><span>Durum</span><strong>{statusLabel(detail.subscriptionStatus)}</strong></div>
                      <div className={styles.infoItem}><span>Aylık kredi</span><strong>{detail.subscription ? formatMoney(detail.subscription.monthlyCredits) : '—'}</strong></div>
                      <div className={styles.infoItem}><span>Sonraki faturalama</span><strong>{formatDateTime(detail.subscription?.nextBillingDate)}</strong></div>
                    </div>
                    <div className={styles.formGrid}>
                      <label className={styles.field}>
                        <span>Plan seç</span>
                        <select className={styles.select} value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value as PlanId)}>
                          {PLAN_OPTIONS.map((plan) => <option key={plan.id} value={plan.id}>{plan.label}</option>)}
                        </select>
                      </label>
                      <label className={styles.field}>
                        <span>Operasyon notu</span>
                        <input className={styles.input} value={planReason} onChange={(e) => setPlanReason(e.target.value)} placeholder="Paket değişim notu" />
                      </label>
                      <label className={`${styles.field} ${styles.checkboxField}`}>
                        <input type="checkbox" checked={resetCredits} onChange={(e) => setResetCredits(e.target.checked)} />
                        <span>Paket kredisi ile bakiyeyi hizala</span>
                      </label>
                    </div>
                    <div className={styles.actionRow}>
                      <button
                        type="button"
                        className={styles.primaryBtn}
                        disabled={actionLoading}
                        onClick={() => {
                          if (!confirmAction('Kullanıcının abonelik planını güncellemek istediğine emin misin?')) return;
                          void runAction({ action: 'set_plan', planId: selectedPlan, resetCredits, reason: planReason }, 'Abonelik planı güncellendi.');
                        }}
                      >
                        Planı Güncelle
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryBtn}
                        disabled={actionLoading || detail.subscriptionStatus !== 'cancelled'}
                        onClick={() => {
                          if (!confirmAction('İptal olmuş aboneliği yeniden aktifleştirmek istediğine emin misin?')) return;
                          void runAction({ action: 'reactivate_subscription', resetCredits, reason: planReason }, 'Abonelik yeniden aktifleştirildi.');
                        }}
                      >
                        Aboneliği Aktifleştir
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        disabled={actionLoading || detail.subscriptionStatus === 'none' || detail.subscriptionStatus === 'cancelled'}
                        onClick={() => {
                          if (!confirmAction('Aboneliği iptal edip kredi bakiyesini sıfırlamak istediğine emin misin?')) return;
                          void runAction({ action: 'cancel_subscription', reason: planReason }, 'Abonelik iptal edildi.');
                        }}
                      >
                        Aboneliği İptal Et
                      </button>
                    </div>
                  </div>
                ) : null}

                {activeTab === 'account' ? (
                  <div className={styles.tabPanel}>
                    <div className={styles.sectionCard}>
                      <h3>Hesap bilgileri</h3>
                      <div className={styles.infoGrid}>
                        <div className={styles.infoItem}><span>E-posta</span><strong>{detail.email}</strong></div>
                        <div className={styles.infoItem}><span>Normalize user ID</span><strong>{detail.userId}</strong></div>
                        <div className={styles.infoItem}><span>Kayıt tarihi</span><strong>{formatDateTime(detail.createdAt)}</strong></div>
                        <div className={styles.infoItem}><span>Son aktivite</span><strong>{formatDateTime(detail.lastActivityAt)}</strong></div>
                      </div>
                    </div>
                    <div className={styles.sectionCard}>
                      <h3>İleri operasyonlar</h3>
                      <p className={styles.accountNote}>Hesap birleştirme, manuel ödeme müdahaleleri ve geri döndürülemez kullanıcı işlemleri bu ilk sürüme bilinçli olarak dahil edilmedi. Bu panel güvenli kredi ve abonelik operasyonlarına odaklanıyor.</p>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
          </section>
        </section>
      </div>
    </div>
  );
}
