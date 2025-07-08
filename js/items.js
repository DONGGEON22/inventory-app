// Items Management
// ================

// Load Items Page
function loadItems() {
    if (!isLoggedIn()) {
        navigateTo('login');
        return;
    }
    
    showLoading('품목 목록을 불러오는 중...');
    
    setTimeout(() => {
        const content = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">품목 관리</h5>
                    <button class="btn btn-primary" onclick="showItemModal()">
                        <i class='bx bx-plus'></i> 품목 등록
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>품목코드</th>
                                    <th>품목명</th>
                                    <th>분류</th>
                                    <th>단위</th>
                                    <th>최소재고</th>
                                    <th>현재재고</th>
                                    <th>상태</th>
                                    <th>관리</th>
                                </tr>
                            </thead>
                            <tbody id="itemsTableBody">
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        mainContent.innerHTML = content;
        loadItemsTable();
        hideLoading();
    }, 100);
}

// Load Items Table
function loadItemsTable() {
    const tbody = document.getElementById('itemsTableBody');
    tbody.innerHTML = '';

    state.items.forEach(item => {
        // 재고현황과 동일하게 현재재고 계산
        const purchases = state.purchases.filter(p => p.item === item.code);
        const sales = state.sales.filter(s => s.item === item.code);
        let totalPurchasedQuantity = 0;
        purchases.forEach(p => {
            totalPurchasedQuantity += Number(p.quantity);
        });
        let totalSoldQuantity = 0;
        sales.forEach(s => {
            totalSoldQuantity += Number(s.quantity);
        });
        const currentStock = totalPurchasedQuantity - totalSoldQuantity;

        const status = getItemStatus({ ...item, currentStock });
        const row = `
            <tr>
                <td>${item.code}</td>
                <td>${item.name}</td>
                <td>${getCategoryName(item.category)}</td>
                <td>${item.unit}</td>
                <td>${item.minStock}</td>
                <td>${currentStock}</td>
                <td><span class="badge ${status.class}">${status.text}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editItem('${item.code}')">
                        <i class='bx bx-edit'></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteItem('${item.code}')">
                        <i class='bx bx-trash'></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Utility Functions
function getCategoryName(category) {
    const categories = {
        'raw': '원재료',
        'sub': '부자재',
        'product': '제품'
    };
    return categories[category] || category;
}

function getItemStatus(item) {
    if (!item.currentStock || item.currentStock <= 0) {
        return { class: 'badge-danger', text: '부족' };
    } else if (item.currentStock <= item.minStock) {
        return { class: 'badge-warning', text: '저재고' };
    }
    return { class: 'badge-success', text: '정상' };
}

// Item CRUD Operations
function saveItem() {
    const form = document.getElementById('itemForm');
    
    // 필수 필드 값 직접 가져오기
    const code = form.querySelector('[name="code"]').value.trim();
    const name = form.querySelector('[name="name"]').value.trim();
    const category = form.querySelector('[name="category"]').value.trim();
    
    // 필수 필드 검증
    if (!code || !name || !category) {
        const missingFields = [];
        if (!code) missingFields.push('품목코드');
        if (!name) missingFields.push('품목명');
        if (!category) missingFields.push('분류');
        
        alert(`다음 필수 항목을 입력해주세요:\n${missingFields.join('\n')}`);
        return;
    }

    // 품목코드 중복 검사
    if (state.items.some(item => item.code === code)) {
        alert('이미 존재하는 품목코드입니다.');
        return;
    }

    // 선택 필드 값 가져오기
    const spec = form.querySelector('[name="spec"]').value.trim();
    const unit = form.querySelector('[name="unit"]').value.trim();
    const minStock = Number(form.querySelector('[name="minStock"]').value) || 0;

    const newItem = {
        id: generateId(),
        code,
        name,
        category,
        spec,
        unit,
        minStock,
        createdAt: new Date().toISOString()
    };

    state.items.push(newItem);
    saveCompanyState();
    loadItemsTable();
    showToast('품목이 등록되었습니다.');
    
    const modalElement = document.getElementById('commonModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal.hide();
}

function editItem(code) {
    const item = state.items.find(item => item.code === code);
    if (!item) return;

    showItemModal(item);
}

function updateItem(id) {
    const form = document.getElementById('itemForm');
    
    // 필수 필드 값 직접 가져오기
    const code = form.querySelector('[name="code"]').value.trim();
    const name = form.querySelector('[name="name"]').value.trim();
    const category = form.querySelector('[name="category"]').value.trim();
    
    // 필수 필드 검증
    if (!code || !name || !category) {
        const missingFields = [];
        if (!code) missingFields.push('품목코드');
        if (!name) missingFields.push('품목명');
        if (!category) missingFields.push('분류');
        
        alert(`다음 필수 항목을 입력해주세요:\n${missingFields.join('\n')}`);
        return;
    }

    const itemIndex = state.items.findIndex(item => item.id === id);
    if (itemIndex === -1) {
        alert('수정할 품목을 찾을 수 없습니다.');
        return;
    }

    // 품목코드 중복 검사 (자기 자신 제외)
    const codeExists = state.items.some(item => 
        item.code === code && item.id !== id
    );
    if (codeExists) {
        alert('이미 존재하는 품목코드입니다.');
        return;
    }

    // 선택 필드 값 가져오기
    const spec = form.querySelector('[name="spec"]').value.trim();
    const unit = form.querySelector('[name="unit"]').value.trim();
    const minStock = Number(form.querySelector('[name="minStock"]').value) || 0;

    const updatedItem = {
        ...state.items[itemIndex],
        code,
        name,
        category,
        spec,
        unit,
        minStock,
        updatedAt: new Date().toISOString()
    };

    state.items[itemIndex] = updatedItem;
    saveCompanyState();
    loadItemsTable();
    showToast('품목이 수정되었습니다.');
    
    const modalElement = document.getElementById('commonModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal.hide();
}

function deleteItem(code) {
    if (confirm('정말로 이 품목을 삭제하시겠습니까?')) {
        state.items = state.items.filter(item => item.code !== code);
        saveCompanyState();
        loadItemsTable();
        showToast('품목이 삭제되었습니다.');
        // 재고현황 탭이 열려있으면 테이블도 갱신
        if (state.currentPage === 'inventory') {
            loadInventoryTable();
        }
    }
}

// Show Item Modal
function showItemModal(item = null) {
    const modalContent = `
        <div class="item-registration-form">
            <form id="itemForm">
                <div class="form-group mb-3">
                    <label class="form-label">품목코드<span class="required-mark">*</span></label>
                    <input type="text" class="form-control" name="code" required>
                </div>
                <div class="form-group mb-3">
                    <label class="form-label">품목명<span class="required-mark">*</span></label>
                    <input type="text" class="form-control" name="name" required>
                </div>
                <div class="form-group mb-3">
                    <label class="form-label">분류<span class="required-mark">*</span></label>
                    <select class="form-control form-select" name="category" required>
                        <option value="">선택하세요</option>
                        <option value="원자재">원자재</option>
                        <option value="제품">제품</option>
                        <option value="부자재">부자재</option>
                    </select>
                </div>
                <div class="form-group mb-3">
                    <label class="form-label">규격</label>
                    <input type="text" class="form-control" name="spec">
                </div>
                <div class="form-group mb-3">
                    <label class="form-label">단위</label>
                    <input type="text" class="form-control" name="unit">
                </div>
                <div class="form-group mb-3">
                    <label class="form-label">최소재고</label>
                    <input type="number" class="form-control text-end" name="minStock" value="0">
                </div>
            </form>
        </div>
    `;

    const modalFooter = `
        <button type="button" class="btn btn-action btn-primary w-100" 
            style="height: 60px; padding: 0 24px; white-space: nowrap; display: flex; align-items: center; justify-content: center; font-size: 16px; border-radius: 8px;" 
            onclick="${item ? `updateItem('${item.id}')` : 'saveItem()'}">
            ${item ? '저장' : '품목 등록'}
        </button>
    `;

    const modalElement = document.getElementById('commonModal');
    modalElement.querySelector('.modal-title').textContent = item ? '품목 수정' : '품목 등록';
    modalElement.querySelector('.modal-body').innerHTML = modalContent;
    modalElement.querySelector('.modal-footer').innerHTML = modalFooter;

    if (item) {
        const form = document.getElementById('itemForm');
        Object.keys(item).forEach(key => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = item[key];
            }
        });
    }

    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

// Export functions for use in HTML
window.loadItems = loadItems;
window.loadItemsTable = loadItemsTable;
window.getCategoryName = getCategoryName;
window.getItemStatus = getItemStatus;
window.saveItem = saveItem;
window.editItem = editItem;
window.deleteItem = deleteItem;
window.showItemModal = showItemModal;

// 품목 등록 모달 표시 (HTML에서 호출하는 함수명)
function showAddItemModal() {
    showItemModal();
}
