function renderReportSummaryCard(c) {
  const clientReports = MOCK_DATA.reports.filter(r => r.clientName === c.name);
  if (clientReports.length === 0) return '<div style="text-align:center;color:var(--gray-400);padding:16px;">この顧客の報告書はまだありません</div>';
  const sorted = [...clientReports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const cardStyle = 'background:#fff;padding:10px;border-radius:6px;border:1px solid var(--gray-200);';

  // 実データから集計
  const categories = {};
  const authors = {};
  const recent5 = sorted.slice(0, 5);
  clientReports.forEach(r => {
    categories[r.category || '未分類'] = (categories[r.category || '未分類'] || 0) + 1;
    if (r.authorId) {
      const author = getUserById(r.authorId);
      if (author) authors[author.name] = (authors[author.name] || 0) + 1;
    }
  });
  const catSummary = Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}件`).join('、');
  const authorSummary = Object.entries(authors).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}(${v}件)`).join('、');

  // 関連タスク（未完了）
  const openTasks = MOCK_DATA.tasks.filter(t => t.clientId === c.id && t.status !== '完了');

  return `
    <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:8px;padding:16px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:18px;">🤖</span>
        <span style="font-size:13px;font-weight:600;color:var(--gray-600);">顧客状況サマリー</span>
        <span style="font-size:11px;color:var(--gray-400);margin-left:auto;">報告書${clientReports.length}件から自動生成</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
        <div style="${cardStyle}">
          <div style="font-weight:600;color:var(--gray-600);margin-bottom:6px;">📋 直近の対応</div>
          ${recent5.map(r => `<div style="font-size:12px;color:var(--gray-500);margin-bottom:2px;">${formatDate(r.createdAt)} ${escapeHtml(r.title?.slice(0, 30) || r.category || '')}</div>`).join('')}
        </div>
        <div style="${cardStyle}">
          <div style="font-weight:600;color:var(--gray-600);margin-bottom:6px;">📊 業務内訳</div>
          <div style="font-size:12px;color:var(--gray-500);">${catSummary || 'データなし'}</div>
          <div style="font-size:12px;color:var(--gray-400);margin-top:4px;">担当: ${authorSummary || '-'}</div>
        </div>
        <div style="${cardStyle}">
          <div style="font-weight:600;color:var(--gray-600);margin-bottom:6px;">⚠️ 未完了タスク</div>
          ${openTasks.length === 0 ? '<div style="font-size:12px;color:var(--success);">未完了タスクなし</div>' :
            openTasks.slice(0, 3).map(t => `<div style="font-size:12px;color:var(--gray-500);margin-bottom:2px;">${escapeHtml(t.title?.slice(0, 25))} <span style="color:var(--gray-400);">${formatDate(t.dueDate)}</span></div>`).join('') +
            (openTasks.length > 3 ? `<div style="font-size:11px;color:var(--gray-400);">他${openTasks.length - 3}件</div>` : '')}
        </div>
        <div style="${cardStyle}">
          <div style="font-weight:600;color:var(--gray-600);margin-bottom:6px;">💡 基本情報</div>
          <div style="font-size:12px;color:var(--gray-500);">月額: ${(c.monthlySales || 0).toLocaleString()}円</div>
          <div style="font-size:12px;color:var(--gray-500);">決算: ${c.fiscalMonth === 'personal' ? '個人(12月)' : c.fiscalMonth + '月'}</div>
          <div style="font-size:12px;color:var(--gray-500);">種別: ${c.clientType} / ${c.industry || '-'}</div>
        </div>
      </div>
    </div>
    <div style="font-size:12px;color:var(--gray-400);">関連報告書: ${clientReports.length}件（直近: ${formatDate(sorted[0]?.createdAt)}）</div>
  `;
}

// ── 顧客詳細: 納付スケジュールカード ──
function renderTaxScheduleCard(client) {
  if (!client || !client.fiscalMonth) return '';

  const settings = MOCK_DATA.taxAlertSettings;
  if (!settings || !settings.enabled) return '';

  const now = new Date();
  const currentMonth = parseInt(now.toLocaleDateString('en-US', { timeZone: 'Asia/Tokyo', month: 'numeric' }));
  const leadMonths = settings.leadMonths || 0;

  const deadlines = getTaxDeadlines(client.fiscalMonth);

  const rows = deadlines.map(function(d) {
    if (!settings.types[d.type]) return '';

    let statusLabel = '対応不要';
    let rowStyle = '';
    for (var i = 0; i <= leadMonths; i++) {
      const checkMonth = ((currentMonth - 1 + i) % 12) + 1;
      if (d.deadlineMonth === checkMonth) {
        if (i === 0) {
          statusLabel = '今月対応';
          rowStyle = 'background:var(--danger-light);';
        } else {
          statusLabel = '来月対応';
          rowStyle = 'background:var(--warning-light);';
        }
        break;
      }
    }

    const typeColor = d.type === 'settlement' ? 'var(--primary)' : (d.type === 'interimPayment' ? 'var(--danger)' : 'var(--warning)');

    return `<tr style="${rowStyle}">
      <td><span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:500;background:${typeColor};color:#fff;">${escapeHtml(d.label)}</span></td>
      <td>${d.deadlineMonth}月</td>
      <td>${escapeHtml(statusLabel)}</td>
    </tr>`;
  }).join('');

  return `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><h3>納付スケジュール</h3><span style="font-size:11px;color:var(--gray-400);margin-left:8px;">決算月: ${client.fiscalMonth}月</span></div>
      <div class="card-body">
        <div class="table-wrapper">
          <table>
            <thead><tr><th>種別</th><th>期限月</th><th>ステータス</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
