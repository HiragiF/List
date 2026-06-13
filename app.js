// 状態管理
let todos = JSON.parse(localStorage.getItem('todos')) || [
    { id: '1', text: 'サンプルタスク (優先度高)', priority: 1 },
    { id: '2', text: '上下にスワイプして並べ替えできます', priority: 2 },
    { id: '3', text: '右スワイプで完了、左スワイプで削除ボタン露出', priority: 3 }
];

let editingTodoId = null;
let deletingTodoId = null;

const todoList = document.getElementById('todo-list');
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const priorityInput = document.getElementById('priority-input');

// 🛠 アップデートしたメニュー用のDOM取得
const fabTrigger = document.getElementById('fab-trigger');
const fabMenu = document.getElementById('fab-menu');
const menuAddBtn = document.getElementById('menu-add-btn');
const menuSortBtn = document.getElementById('menu-sort-btn');

const modalOverlay = document.getElementById('modal-overlay');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalTitle = document.getElementById('modal-title');
const modalSubmitBtn = document.getElementById('modal-submit-btn');

// 削除モーダルの要素取得
const deleteModalOverlay = document.getElementById('delete-modal-overlay');
document.addEventListener('DOMContentLoaded', () => {
    const fabBtn = document.getElementById('fab-trigger'); // または古いIDなら 'fab-btn'
    if (fabBtn) {
        fabBtn.addEventListener('click', () => {
            editingTodoId = null;
            modalTitle.textContent = '新しいタスクを追加';
            modalSubmitBtn.textContent = '追加';
            modalOverlay.classList.add('active');
            todoInput.focus();
        });
    }
});
const deleteCancelBtn = document.getElementById('delete-cancel-btn');
const deleteConfirmBtn = document.getElementById('delete-confirm-btn');

// --- モーダルクローズ処理 ---
modalCancelBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});
function closeModal() {
    modalOverlay.classList.remove('active');
    todoInput.value = '';
    editingTodoId = null;
}

// --- 削除モーダルイベント ---
deleteCancelBtn.addEventListener('click', closeDeleteModal);
deleteModalOverlay.addEventListener('click', (e) => {
    if (e.target === deleteModalOverlay) closeDeleteModal();
});
function closeDeleteModal() {
    deleteModalOverlay.classList.remove('active');
    deletingTodoId = null;
    renderTodos();
}

// 実際の削除確定処理
deleteConfirmBtn.addEventListener('click', () => {
    if (deletingTodoId) {
        todos = todos.filter(t => t.id !== deletingTodoId);
        saveAndRender();
    }
    deleteModalOverlay.classList.remove('active');
    deletingTodoId = null;
});

// アプリ初期化・描画
function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach(todo => {
        const wrapper = document.createElement('div');
        wrapper.className = 'todo-item-wrapper';
        wrapper.setAttribute('data-id', todo.id);
        wrapper.setAttribute('data-priority', todo.priority);

        wrapper.innerHTML = `
            <div class="swipe-background">
                <div class="swipe-icon icon-complete" style="justify-content: flex-start; flex: 1;">
                    <svg viewBox="0 0 24 24"><path d="M20 6L9 17L4 12"/></svg>
                </div>
                <div class="swipe-icon icon-delete" style="justify-content: flex-end; flex: 1; cursor: pointer;" data-id="${todo.id}">
                    <svg viewBox="-1 -1 22 22">
                        <path d="M0 3H20M6 3h8M3 6 4 18M7 7v8m3-8v8m3-8v8M8 0h4c2 0 1.3333 2 2 3M6 3c.6667-1 0-3 2-3m9 6-1 12c0 2-1 2-2 2M4 18c0 2 1 2 2 2h8" />
                    </svg>
                </div>
            </div>
            <div class="todo-item">
                <div class="drag-handle">☰</div>
                <div class="todo-content">
                    <div class="todo-text">${escapeHTML(todo.text)}</div>
                </div>
                <div class="todo-actions">
                    <button class="edit-btn" data-id="${todo.id}" aria-label="編集">
                        <svg viewBox="-1 -1 22 22">
                            <path d="M15 2M2 15 1 20 6 19 2 15M2 15 15 2 19 6 6 19M6 15 15 6M1.4 18.2 2.8 19.6" />
                        </svg>
                    </button>
                </div>
            </div>
        `;

        setupSwipeActions(wrapper);
        setupVerticalReorder(wrapper);
        todoList.appendChild(wrapper);
    });
}

// フォーム送信
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    const priority = parseInt(priorityInput.value, 10);
    
    if (!text) return;

    if (editingTodoId) {
        const todo = todos.find(t => t.id === editingTodoId);
        if (todo) { todo.text = text; todo.priority = priority; }
    } else {
        const newTodo = { id: Date.now().toString(), text: text, priority: priority };
        todos.unshift(newTodo); // 新規タスクは一番上に追加
    }
    saveAndRender();
    closeModal();
    fabMenu.classList.remove('active');
    fabTrigger.textContent = '☰';
});

// --- 🛠 ハンバーガーメニューの開閉制御 ---
fabTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    fabMenu.classList.toggle('active');
    fabTrigger.textContent = fabMenu.classList.contains('active') ? '✕' : '☰';
});

// 画面をタップしたらメニューを閉じる
document.addEventListener('click', () => {
    fabMenu.classList.remove('active');
    fabTrigger.textContent = '☰';
});

// --- 🛠 メニュー内の「タスク追加」ボタン ---
menuAddBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    editingTodoId = null;
    modalTitle.textContent = '新しいタスクを追加';
    modalSubmitBtn.textContent = '追加';
    modalOverlay.classList.add('active');
    todoInput.focus();
    
    fabMenu.classList.remove('active');
    fabTrigger.textContent = '☰';
});

// --- 🛠 メニュー内の「優先度ソート」ボタン（手動ソート） ---
menuSortBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // 押された瞬間だけ木構造（1 -> 2 -> 3）にガチッと並び替え
    todos.sort((a, b) => a.priority - b.priority);
    
    saveAndRender();
    
    fabMenu.classList.remove('active');
    fabTrigger.textContent = '☰';
});

// 編集ボタンイベント
todoList.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        const todo = todos.find(t => t.id === id);
        if (todo) {
            editingTodoId = id;
            modalTitle.textContent = 'タスクを編集';
            modalSubmitBtn.textContent = '保存';
            todoInput.value = todo.text;
            priorityInput.value = todo.priority;
            modalOverlay.classList.add('active');
        }
    }
});

function saveAndRender() {
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
}

// エスケープ関数
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// 左右スワイプアクション
function setupSwipeActions(wrapper) {
    const item = wrapper.querySelector('.todo-item');
    const bg = wrapper.querySelector('.swipe-background');
    const iconComplete = wrapper.querySelector('.icon-complete');
    const iconDelete = wrapper.querySelector('.icon-delete');
    const deleteTrigger = wrapper.querySelector('.icon-delete');

    let startX = 0;
    let currentX = 0;
    let baseOffsetX = 0; 
    let isAnimating = false;
    const menuWidth = 75; 
    const threshold = 120; 

    deleteTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = deleteTrigger.getAttribute('data-id');
        deletingTodoId = id;
        deleteModalOverlay.classList.add('active');
    });

    item.addEventListener('touchstart', (e) => {
        if (e.target.classList.contains('drag-handle') || isAnimating) return;
        startX = e.touches[0].clientX;
        item.classList.remove('swiping-fallback');
        item.style.transition = 'none';
    }, { passive: true });

    item.addEventListener('touchmove', (e) => {
        if (startX === 0 || isAnimating) return;
        
        currentX = (e.touches[0].clientX - startX) + baseOffsetX;
        
        if (currentX > 0) {
            bg.className = 'swipe-background action-complete';
            iconComplete.classList.add('active');
            iconDelete.classList.remove('active');
            const translate = Math.pow(currentX, 0.85);
            item.style.transform = `translateX(${translate}px)`;
        } else if (currentX < 0) {
            bg.className = 'swipe-background action-delete';
            iconDelete.classList.add('active');
            iconComplete.classList.remove('active');
            
            let translate = currentX;
            if (Math.abs(currentX) > menuWidth) {
                const excess = Math.abs(currentX) - menuWidth;
                translate = -(menuWidth + Math.pow(excess, 0.75));
            }
            item.style.transform = `translateX(${translate}px)`;
        }
    }, { passive: true });

    item.addEventListener('touchend', () => {
        if (startX === 0 || isAnimating) return;
        const id = wrapper.getAttribute('data-id');

        if (currentX > threshold) {
            isAnimating = true;
            item.style.transition = 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
            item.style.transform = `translateX(${window.innerWidth + 50}px)`;

            setTimeout(() => {
                bg.classList.add('sliding-out');
                bg.classList.add('slide-to-right');

                setTimeout(() => {
                    todos = todos.filter(t => t.id !== id);
                    saveAndRender();
                    isAnimating = false;
                }, 200);
            }, 250);

        } else if (currentX < -50) {
            item.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            item.style.transform = `translateX(${-menuWidth}px)`;
            baseOffsetX = -menuWidth;
        } else {
            item.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            item.style.transform = 'translateX(0)';
            iconComplete.classList.remove('active');
            iconDelete.classList.remove('active');
            baseOffsetX = 0;
        }
        startX = 0;
        currentX = 0;
    });
}

// 上下並べ替えロジック
function setupVerticalReorder(wrapper) {
    let touchOffsetY = 0;
    let draggingElement = null;
    let placeholder = null;
    const handle = wrapper.querySelector('.drag-handle');

    handle.addEventListener('touchstart', (e) => {
        draggingElement = wrapper;
        const rect = draggingElement.getBoundingClientRect();
        const touch = e.touches[0];
        touchOffsetY = touch.clientY - rect.top;

        placeholder = document.createElement('div');
        placeholder.style.height = `${rect.height}px`;
        placeholder.style.marginBottom = '10px';
        placeholder.style.visibility = 'hidden';
        
        const siblings = [...todoList.querySelectorAll('.todo-item-wrapper:not(.dragging)')];
        siblings.forEach(sibling => { sibling.dataset.firstTop = sibling.getBoundingClientRect().top; });

        draggingElement.parentNode.insertBefore(placeholder, draggingElement);
        draggingElement.style.top = `${rect.top}px`;
        draggingElement.classList.add('dragging');
    }, { passive: false });

    handle.addEventListener('touchmove', (e) => {
        if (!draggingElement) return;
        e.preventDefault();
        const touch = e.touches[0];
        const currentY = touch.clientY;
        const newTop = currentY - touchOffsetY;
        draggingElement.style.top = `${newTop}px`;

        const siblings = [...todoList.querySelectorAll('.todo-item-wrapper:not(.dragging)')];
        siblings.forEach(sibling => { sibling.dataset.firstTop = sibling.getBoundingClientRect().top; });

        const nextSibling = siblings.find(sibling => {
            const box = sibling.getBoundingClientRect();
            return currentY < box.top + box.height / 2;
        });
        if (nextSibling) { todoList.insertBefore(placeholder, nextSibling); } else { todoList.appendChild(placeholder); }

        const newSiblings = [...todoList.querySelectorAll('.todo-item-wrapper:not(.dragging)')];
        newSiblings.forEach(sibling => {
            const firstTop = parseFloat(sibling.dataset.firstTop);
            const lastTop = sibling.getBoundingClientRect().top;
            const deltaY = firstTop - lastTop;
            if (deltaY !== 0) {
                sibling.style.transition = 'none';
                sibling.style.transform = `translateY(${deltaY}px)`;
                requestAnimationFrame(() => {
                    sibling.offsetWidth;
                    sibling.style.transition = 'transform 0.2s ease';
                    sibling.style.transform = '';
                });
            }
        });
    }, { passive: false });

    handle.addEventListener('touchend', () => {
        if (!draggingElement) return;
        placeholder.parentNode.insertBefore(draggingElement, placeholder);
        placeholder.remove();
        draggingElement.classList.remove('dragging');
        draggingElement.style.top = '';
        draggingElement.style.transform = '';

        const newTodos = [];
        const currentItems = todoList.querySelectorAll('.todo-item-wrapper');
        currentItems.forEach(domItem => {
            const id = domItem.getAttribute('data-id');
            const targetTodo = todos.find(t => t.id === id);
            if (targetTodo) newTodos.push(targetTodo);
        });
        todos = newTodos;
        localStorage.setItem('todos', JSON.stringify(todos));
        draggingElement = null;
        placeholder = null;
    });
}

// 初回読み込み
renderTodos();