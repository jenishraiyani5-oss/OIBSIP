document.addEventListener('DOMContentLoaded', () => {
  // Local storage keys
  const STORAGE_KEY = 'taskflow_data';
  const THEME_KEY = 'taskflow_theme';

  // App State
  let tasks = [];
  let searchQuery = '';
  let categoryFilter = 'all';
  let priorityFilter = 'all';
  let sortBy = 'newest';

  // DOM Elements
  const elForm = document.getElementById('todo-form');
  const elInput = document.getElementById('todo-input');
  const elPriority = document.getElementById('todo-priority');
  const elCategory = document.getElementById('todo-category');
  const elDueDate = document.getElementById('todo-duedate');

  const elSearch = document.getElementById('search-input');
  const elFilterCat = document.getElementById('filter-category');
  const elFilterPri = document.getElementById('filter-priority');
  const elSortBy = document.getElementById('sort-by');

  const elPendingList = document.getElementById('pending-list');
  const elCompletedList = document.getElementById('completed-list');
  const elPendingCount = document.getElementById('pending-count');
  const elCompletedCount = document.getElementById('completed-count');
  const elPendingEmpty = document.getElementById('pending-empty');
  const elCompletedEmpty = document.getElementById('completed-empty');

  const elProgressFill = document.getElementById('progress-fill');
  const elProgressText = document.getElementById('progress-text');
  const elProgressSummary = document.getElementById('progress-summary');
  const elClearCompletedBtn = document.getElementById('clear-completed-btn');
  const elThemeBtn = document.getElementById('theme-btn');
  const elToastRoot = document.getElementById('toast-root');

  // Load saved state
  function init() {
    setupTheme();
    loadState();
    attachEventListeners();
    render();
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const loaded = JSON.parse(raw);
        // Filter out legacy sample tasks if any exist
        tasks = loaded.filter(t => t.id !== 'task-101' && t.id !== 'task-102' && t.id !== 'task-103');
      } else {
        tasks = [];
        saveState();
      }
    } catch (err) {
      console.warn('Failed to parse localStorage tasks:', err);
      tasks = [];
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }

  // Theme Toggle
  function setupTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }

  elThemeBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    showToast(`Switched to ${next} mode`);
  });

  // Task Operations
  function addTask(title, priority, category, dueDate) {
    const newTask = {
      id: 'task-' + Date.now(),
      title: title.trim(),
      completed: false,
      priority,
      category,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      isEditing: false
    };

    tasks.unshift(newTask);
    saveState();
    render();
    showToast('Task added');
  }

  function toggleTask(id) {
    const item = tasks.find(t => t.id === id);
    if (!item) return;

    item.completed = !item.completed;
    item.completedAt = item.completed ? new Date().toISOString() : null;

    saveState();
    render();
    showToast(item.completed ? 'Task completed!' : 'Moved back to pending');
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveState();
    render();
    showToast('Task deleted');
  }

  function enableInlineEdit(id) {
    tasks.forEach(t => {
      t.isEditing = (t.id === id);
    });
    render();
  }

  function saveInlineEdit(id, newTitle) {
    const item = tasks.find(t => t.id === id);
    if (!item) return;

    const trimmed = newTitle.trim();
    if (trimmed.length > 0) {
      item.title = trimmed;
      showToast('Task updated');
    }
    item.isEditing = false;
    saveState();
    render();
  }

  function cancelInlineEdit(id) {
    const item = tasks.find(t => t.id === id);
    if (item) item.isEditing = false;
    render();
  }

  function clearCompletedTasks() {
    const count = tasks.filter(t => t.completed).length;
    if (count === 0) return;

    if (confirm(`Clear all ${count} completed task(s)?`)) {
      tasks = tasks.filter(t => !t.completed);
      saveState();
      render();
      showToast('Completed tasks cleared');
    }
  }

  // Filter & Sort Logic
  function getVisibleTasks() {
    return tasks.filter(task => {
      const matchSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'all' || task.category === categoryFilter;
      const matchPri = priorityFilter === 'all' || task.priority === priorityFilter;
      return matchSearch && matchCat && matchPri;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'priority') {
        const order = { high: 3, medium: 2, low: 1 };
        return order[b.priority] - order[a.priority];
      }
      if (sortBy === 'duedate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return 0;
    });
  }

  // Render Engine
  function render() {
    const visible = getVisibleTasks();
    const pending = visible.filter(t => !t.completed);
    const completed = visible.filter(t => t.completed);

    renderList(elPendingList, pending);
    renderList(elCompletedList, completed);

    // Update Counts & Badges
    const totalPending = tasks.filter(t => !t.completed).length;
    const totalCompleted = tasks.filter(t => t.completed).length;
    const totalAll = tasks.length;

    elPendingCount.textContent = `${totalPending} pending`;
    elCompletedCount.textContent = `${totalCompleted} completed`;

    // Toggle Empty States
    elPendingEmpty.classList.toggle('hidden', pending.length > 0);
    elCompletedEmpty.classList.toggle('hidden', completed.length > 0);

    // Update Overall Progress
    const pct = totalAll === 0 ? 0 : Math.round((totalCompleted / totalAll) * 100);
    elProgressFill.style.width = `${pct}%`;
    elProgressText.textContent = `${pct}% Done`;
    elProgressSummary.textContent = `${totalCompleted} of ${totalAll} tasks completed`;
  }

  function renderList(container, list) {
    container.innerHTML = '';

    list.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'done' : ''}`;
      li.dataset.id = task.id;

      if (task.isEditing) {
        // Inline Edit UI
        li.innerHTML = `
          <div style="flex:1; display:flex; gap:0.5rem;">
            <input type="text" class="edit-input" id="edit-${task.id}" value="${escapeHtml(task.title)}" />
            <button class="icon-btn" data-action="save"><i class="ri-check-line"></i></button>
            <button class="icon-btn" data-action="cancel"><i class="ri-close-line"></i></button>
          </div>
        `;

        setTimeout(() => {
          const input = document.getElementById(`edit-${task.id}`);
          if (input) {
            input.focus();
            input.select();
            input.addEventListener('keydown', e => {
              if (e.key === 'Enter') saveInlineEdit(task.id, input.value);
              if (e.key === 'Escape') cancelInlineEdit(task.id);
            });
          }
        }, 0);

      } else {
        // Regular Task Display UI
        const timeAgo = task.completed ? formatTimeAgo(task.completedAt) : formatTimeAgo(task.createdAt);
        const due = formatDueDate(task.dueDate, task.completed);

        li.innerHTML = `
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-action="toggle" />
          <div class="task-body">
            <span class="task-title">${escapeHtml(task.title)}</span>
            <div class="task-details">
              <span class="badge badge-${task.priority}">${task.priority}</span>
              <span class="badge badge-cat">${escapeHtml(task.category)}</span>
              ${due ? `<span class="due-badge ${due.overdue ? 'overdue' : ''}"><i class="ri-calendar-line"></i> ${due.label}</span>` : ''}
              <span class="time-stamp">${task.completed ? 'Completed ' : 'Added '}${timeAgo}</span>
            </div>
          </div>
          <div class="task-actions">
            <button class="icon-btn edit-btn" data-action="edit" title="Edit"><i class="ri-edit-line"></i></button>
            <button class="icon-btn delete-btn" data-action="delete" title="Delete"><i class="ri-delete-bin-line"></i></button>
          </div>
        `;
      }

      // Event Delegation
      li.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        if (action === 'toggle') toggleTask(task.id);
        if (action === 'edit') enableInlineEdit(task.id);
        if (action === 'delete') deleteTask(task.id);
        if (action === 'save') {
          const inp = document.getElementById(`edit-${task.id}`);
          if (inp) saveInlineEdit(task.id, inp.value);
        }
        if (action === 'cancel') cancelInlineEdit(task.id);
      });

      container.appendChild(li);
    });
  }

  // Helpers
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatTimeAgo(isoString) {
    if (!isoString) return '';
    const diffSec = Math.floor((new Date() - new Date(isoString)) / 1000);
    if (diffSec < 60) return 'just now';
    const min = Math.floor(diffSec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    return `${day}d ago`;
  }

  function formatDueDate(dateStr, isCompleted) {
    if (!dateStr) return null;
    const due = new Date(dateStr + 'T23:59:59');
    const overdue = !isCompleted && due < new Date();
    const formatted = new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return {
      label: overdue ? `Overdue (${formatted})` : `Due ${formatted}`,
      overdue
    };
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="ri-information-line"></i> ${escapeHtml(message)}`;
    elToastRoot.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2500);
  }

  // Event Handlers Setup
  function attachEventListeners() {
    elForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = elInput.value.trim();
      if (!val) return;

      addTask(val, elPriority.value, elCategory.value, elDueDate.value);
      elInput.value = '';
      elDueDate.value = '';
      elInput.focus();
    });

    elSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });

    elFilterCat.addEventListener('change', (e) => {
      categoryFilter = e.target.value;
      render();
    });

    elFilterPri.addEventListener('change', (e) => {
      priorityFilter = e.target.value;
      render();
    });

    elSortBy.addEventListener('change', (e) => {
      sortBy = e.target.value;
      render();
    });

    elClearCompletedBtn.addEventListener('click', clearCompletedTasks);
  }

  init();
});
