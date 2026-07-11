import { el, escapeHtml } from '../utils/dom.js';
import { spinner, emptyState } from '../components/spinner.js';
import { avatarHtml } from '../components/avatar.js';
import { requireAdmin } from '../utils/guards.js';
import { getSession } from '../session.js';
import { showToast } from '../components/toast.js';
import { formatDate } from '../utils/format.js';
import {
  listEventsForModeration, setEventStatus, listUsers, setUserRole, getStats,
} from '../services/adminService.js';
import { listCategories, createCategory, deleteCategory } from '../services/categoryService.js';

const STATUS_BADGE = { approved: 'bg-success', pending: 'bg-warning text-dark', rejected: 'bg-danger' };

export async function render() {
  if (!requireAdmin()) return el('div');

  const page = el('div', { class: 'container py-5 min-vh-content' });
  page.innerHTML = `
    <div class="d-flex align-items-center gap-2 mb-1">
      <i class="bi bi-shield-lock-fill text-gradient fs-3"></i>
      <h1 class="fw-bold mb-0">Admin panel</h1>
    </div>
    <p class="text-muted">Moderate events, manage categories and users.</p>`;

  // ---- Stats ----
  const statsRow = el('div', { class: 'row g-3 mb-4' });
  page.append(statsRow);
  getStats().then((s) => {
    statsRow.replaceChildren(
      statCard('bi-calendar-event', s.events, 'Events', 'primary'),
      statCard('bi-hourglass-split', s.pending, 'Pending review', 'warning'),
      statCard('bi-people', s.users, 'Users', 'success'),
      statCard('bi-tags', s.categories, 'Categories', 'info'),
    );
  }).catch(() => {});

  // ---- Tabs ----
  const nav = el('ul', { class: 'nav nav-pills gap-2 mb-4' });
  const pane = el('div', {});
  page.append(nav, pane);

  const tabs = [
    { id: 'moderation', label: 'Moderation', icon: 'bi-check2-square', render: renderModeration },
    { id: 'categories', label: 'Categories', icon: 'bi-tags', render: renderCategories },
    { id: 'users', label: 'Users', icon: 'bi-people', render: renderUsers },
  ];

  tabs.forEach((tab, i) => {
    const li = el('li', { class: 'nav-item' });
    const btn = el('button', { class: `nav-link ${i === 0 ? 'active' : ''}` });
    btn.innerHTML = `<i class="bi ${tab.icon} me-1"></i> ${tab.label}`;
    btn.addEventListener('click', () => {
      nav.querySelectorAll('.nav-link').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      openTab(tab);
    });
    li.append(btn);
    nav.append(li);
  });

  async function openTab(tab) {
    pane.replaceChildren(spinner());
    try {
      pane.replaceChildren(await tab.render());
    } catch (err) {
      pane.replaceChildren(emptyState({ icon: 'bi-exclamation-triangle', title: 'Could not load', message: err?.message }));
    }
  }
  openTab(tabs[0]);

  return page;
}

function statCard(icon, value, label, color) {
  const col = el('div', { class: 'col-6 col-lg-3' });
  col.innerHTML = `
    <div class="card p-3 h-100">
      <div class="d-flex align-items-center gap-3">
        <span class="d-inline-flex align-items-center justify-content-center rounded-3 bg-${color} bg-opacity-10 text-${color}" style="width:48px;height:48px">
          <i class="bi ${icon} fs-4"></i>
        </span>
        <div>
          <div class="fs-3 fw-bold lh-1">${value}</div>
          <div class="text-muted small">${escapeHtml(label)}</div>
        </div>
      </div>
    </div>`;
  return col;
}

// ---------------------------------------------------------------------------
// Moderation
// ---------------------------------------------------------------------------
async function renderModeration() {
  const wrap = el('div', {});
  const filters = el('div', { class: 'd-flex flex-wrap gap-2 mb-3' });
  const list = el('div', {});
  wrap.append(filters, list);

  let current = 'pending';
  const options = [
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: null, label: 'All' },
  ];
  options.forEach((o) => {
    const btn = el('button', { class: `btn btn-sm ${o.key === current ? 'btn-gradient' : 'btn-outline-brand'}` }, o.label);
    btn.addEventListener('click', () => {
      current = o.key;
      filters.querySelectorAll('button').forEach((b) => (b.className = 'btn btn-sm btn-outline-brand'));
      btn.className = 'btn btn-sm btn-gradient';
      load();
    });
    filters.append(btn);
  });

  async function load() {
    list.replaceChildren(spinner());
    const events = await listEventsForModeration(current);
    if (!events.length) {
      list.replaceChildren(emptyState({ icon: 'bi-inbox', title: 'Nothing here', message: 'No events in this state.' }));
      return;
    }
    list.replaceChildren(...events.map((ev) => moderationRow(ev, load)));
  }
  await load();
  return wrap;
}

function moderationRow(ev, reload) {
  const row = el('div', { class: 'card p-3 mb-2' });
  row.innerHTML = `
    <div class="d-flex flex-wrap align-items-center gap-3">
      <div class="rounded-3 overflow-hidden flex-shrink-0" style="width:64px;height:64px">
        ${ev.banner_url
          ? `<img src="${escapeHtml(ev.banner_url)}" alt="" style="width:64px;height:64px;object-fit:cover">`
          : `<div class="w-100 h-100 bg-gradient-brand d-flex align-items-center justify-content-center"><i class="bi ${escapeHtml(ev.category?.icon || 'bi-calendar-event')} text-white"></i></div>`}
      </div>
      <div class="flex-grow-1" style="min-width:200px">
        <a href="#/events/${ev.id}" class="fw-bold text-reset text-decoration-none">${escapeHtml(ev.title)}</a>
        <div class="small text-muted">
          <i class="bi bi-person me-1"></i>@${escapeHtml(ev.organizer?.username || 'user')}
          <span class="mx-1">·</span><i class="bi bi-calendar-event me-1"></i>${escapeHtml(formatDate(ev.event_date))}
        </div>
        <span class="badge ${STATUS_BADGE[ev.status] || 'bg-secondary'} mt-1 text-capitalize">${escapeHtml(ev.status)}</span>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-success" data-act="approve" ${ev.status === 'approved' ? 'disabled' : ''}><i class="bi bi-check-lg"></i> Approve</button>
        <button class="btn btn-sm btn-outline-danger" data-act="reject" ${ev.status === 'rejected' ? 'disabled' : ''}><i class="bi bi-x-lg"></i> Reject</button>
      </div>
    </div>`;
  row.querySelectorAll('[data-act]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const status = btn.dataset.act === 'approve' ? 'approved' : 'rejected';
      btn.disabled = true;
      try {
        await setEventStatus(ev.id, status);
        showToast(`Event ${status}.`, 'success');
        reload();
      } catch (err) {
        showToast(err?.message || 'Could not update event.', 'error');
        btn.disabled = false;
      }
    });
  });
  return row;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
async function renderCategories() {
  const wrap = el('div', {});
  const list = el('div', { class: 'row g-2 mb-4' });

  const form = el('form', { class: 'card p-3 mb-4' });
  form.innerHTML = `
    <h6 class="fw-bold mb-3">Add a category</h6>
    <div class="row g-2 align-items-end">
      <div class="col-md-4"><label class="form-label small">Name</label><input class="form-control" id="c-name" required placeholder="e.g. Networking"></div>
      <div class="col-md-4"><label class="form-label small">Icon <span class="text-muted">(Bootstrap Icon class)</span></label><input class="form-control" id="c-icon" placeholder="bi-diagram-3" value="bi-calendar-event"></div>
      <div class="col-md-2"><label class="form-label small">Color</label><input type="color" class="form-control form-control-color w-100" id="c-color" value="#7c3aed"></div>
      <div class="col-md-2"><button class="btn btn-gradient w-100" type="submit"><i class="bi bi-plus-lg"></i> Add</button></div>
    </div>`;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.querySelector('#c-name').value.trim();
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      await createCategory({
        name,
        slug,
        icon: form.querySelector('#c-icon').value.trim() || 'bi-calendar-event',
        color: form.querySelector('#c-color').value,
      });
      showToast('Category added.', 'success');
      form.reset();
      form.querySelector('#c-icon').value = 'bi-calendar-event';
      form.querySelector('#c-color').value = '#7c3aed';
      await load();
    } catch (err) {
      showToast(err?.message || 'Could not add category.', 'error');
    }
  });

  wrap.append(form, list);

  async function load() {
    list.replaceChildren(spinner());
    const cats = await listCategories();
    list.replaceChildren(...cats.map((c) => {
      const col = el('div', { class: 'col-md-6 col-lg-4' });
      col.innerHTML = `
        <div class="card p-3 d-flex flex-row align-items-center justify-content-between">
          <span class="chip" style="background:${escapeHtml(c.color)}1a;color:${escapeHtml(c.color)}">
            <i class="bi ${escapeHtml(c.icon)}"></i> ${escapeHtml(c.name)}
          </span>
          <button class="btn btn-sm btn-outline-danger" title="Delete"><i class="bi bi-trash"></i></button>
        </div>`;
      col.querySelector('button').addEventListener('click', async () => {
        if (!confirm(`Delete category "${c.name}"? Events keep working but lose this category.`)) return;
        try {
          await deleteCategory(c.id);
          showToast('Category deleted.', 'success');
          await load();
        } catch (err) {
          showToast(err?.message || 'Could not delete.', 'error');
        }
      });
      return col;
    }));
  }
  await load();
  return wrap;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
async function renderUsers() {
  const wrap = el('div', {});
  const list = el('div', {});
  wrap.append(list);
  const myId = getSession().user.id;

  async function load() {
    list.replaceChildren(spinner());
    const users = await listUsers();
    const table = el('div', { class: 'card p-0 overflow-hidden' });
    table.innerHTML = `
      <div class="table-responsive">
        <table class="table align-middle mb-0">
          <thead class="table-light"><tr>
            <th>User</th><th>Joined</th><th>Role</th><th class="text-end">Actions</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>`;
    const tbody = table.querySelector('tbody');
    users.forEach((u) => {
      const tr = el('tr', {});
      const isMe = u.id === myId;
      tr.innerHTML = `
        <td>
          <div class="d-flex align-items-center gap-2">
            ${avatarHtml(u, 36)}
            <div>
              <div class="fw-semibold">@${escapeHtml(u.username)}</div>
              <div class="small text-muted">${escapeHtml(u.full_name || '')}</div>
            </div>
          </div>
        </td>
        <td class="small text-muted">${escapeHtml(formatDate(u.created_at))}</td>
        <td><span class="badge ${u.role === 'admin' ? 'bg-gradient-brand' : 'bg-secondary'} text-capitalize">${escapeHtml(u.role)}</span></td>
        <td class="text-end"></td>`;
      const actionCell = tr.querySelector('td:last-child');
      if (isMe) {
        actionCell.innerHTML = '<span class="small text-muted">(you)</span>';
      } else {
        const makeAdmin = u.role !== 'admin';
        const btn = el('button', { class: `btn btn-sm ${makeAdmin ? 'btn-outline-brand' : 'btn-outline-secondary'}` });
        btn.innerHTML = makeAdmin ? '<i class="bi bi-shield-plus me-1"></i>Make admin' : '<i class="bi bi-shield-minus me-1"></i>Revoke admin';
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            await setUserRole(u.id, makeAdmin ? 'admin' : 'user');
            showToast(`@${u.username} is now ${makeAdmin ? 'an admin' : 'a user'}.`, 'success');
            await load();
          } catch (err) {
            showToast(err?.message || 'Could not update role.', 'error');
            btn.disabled = false;
          }
        });
        actionCell.append(btn);
      }
      tbody.append(tr);
    });
    list.replaceChildren(table);
  }
  await load();
  return wrap;
}
