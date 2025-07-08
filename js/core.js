// Core Utilities and State Management
// ======================================

// Global State
let state = {
    items: JSON.parse(localStorage.getItem('items')) || [],
    partners: JSON.parse(localStorage.getItem('partners')) || [],
    purchases: JSON.parse(localStorage.getItem('purchases')) || [],
    sales: JSON.parse(localStorage.getItem('sales')) || [],
    currentPage: 'dashboard',
    sidebarCollapsed: false,
    partnersCurrentPage: 1,
    itemsCurrentPage: 1,
    purchasesCurrentPage: 1,
    salesCurrentPage: 1,
    inventoryCurrentPage: 1
};

// Company Data Management
function getCompanyKey(businessNumber) {
    return `company_${businessNumber.replace(/-/g, '')}`;
}

function loadCompanyData(businessNumber) {
    if (!businessNumber) {
        state.items = [];
        state.partners = [];
        state.purchases = [];
        state.sales = [];
        return;
    }
    const companyKey = getCompanyKey(businessNumber);
    const companyData = JSON.parse(localStorage.getItem(companyKey)) || {
        items: [],
        partners: [],
        purchases: [],
        sales: []
    };
    
    state.items = companyData.items || [];
    state.partners = companyData.partners || [];
    state.purchases = companyData.purchases || [];
    state.sales = companyData.sales || [];
}

function saveCompanyData(businessNumber) {
    const companyKey = getCompanyKey(businessNumber);
    const companyData = {
        items: state.items,
        partners: state.partners,
        purchases: state.purchases,
        sales: state.sales
    };
    localStorage.setItem(companyKey, JSON.stringify(companyData));
}

function getCurrentCompanyBusinessNumber() {
    if (isAdmin()) {
        return localStorage.getItem('adminViewingBusinessNumber');
    }
    return localStorage.getItem('loginBusinessNumber');
}

function saveCompanyState() {
    const businessNumber = getCurrentCompanyBusinessNumber();
    if (businessNumber) {
        saveCompanyData(businessNumber);
    }
}

function loadCompanyState() {
    const businessNumber = getCurrentCompanyBusinessNumber();
    if (businessNumber) {
        loadCompanyData(businessNumber);
    }
}

// Loading Management
function showLoading(message = '로딩 중...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = overlay.querySelector('.loading-text');
    loadingText.textContent = message;
    overlay.style.display = 'flex';
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'none';
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW'
    }).format(amount);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Business Number Formatting
function autoFormatBusinessNumber(inputElement) {
    if (!inputElement) return;
    inputElement.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value.length > 0) {
            if (value.length <= 3) {
                value = value;
            } else if (value.length <= 5) {
                value = value.slice(0, 3) + '-' + value.slice(3);
            } else {
                value = value.slice(0, 3) + '-' + value.slice(3, 5) + '-' + value.slice(5, 10);
            }
        }
        e.target.value = value;
    });
}

// Pagination Utility
function paginate(items, page = 1, itemsPerPage = 10) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / itemsPerPage);
    
    return {
        paginatedItems,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };
}

// Virtual Scrolling for large datasets
class VirtualScroller {
    constructor(container, itemHeight, items, renderItem) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.items = items;
        this.renderItem = renderItem;
        this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
        this.scrollTop = 0;
        this.startIndex = 0;
        this.endIndex = this.visibleItems;
        
        this.init();
    }
    
    init() {
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        
        // Create spacer elements
        this.topSpacer = document.createElement('div');
        this.bottomSpacer = document.createElement('div');
        this.contentContainer = document.createElement('div');
        
        this.container.appendChild(this.topSpacer);
        this.container.appendChild(this.contentContainer);
        this.container.appendChild(this.bottomSpacer);
        
        this.container.addEventListener('scroll', this.handleScroll.bind(this));
        this.render();
    }
    
    handleScroll() {
        this.scrollTop = this.container.scrollTop;
        this.updateVisibleRange();
        this.render();
    }
    
    updateVisibleRange() {
        this.startIndex = Math.floor(this.scrollTop / this.itemHeight);
        this.endIndex = Math.min(this.startIndex + this.visibleItems, this.items.length);
    }
    
    render() {
        // Update spacers
        this.topSpacer.style.height = `${this.startIndex * this.itemHeight}px`;
        this.bottomSpacer.style.height = `${(this.items.length - this.endIndex) * this.itemHeight}px`;
        
        // Render visible items
        this.contentContainer.innerHTML = '';
        for (let i = this.startIndex; i < this.endIndex; i++) {
            const item = this.items[i];
            const element = this.renderItem(item, i);
            element.style.position = 'absolute';
            element.style.top = `${i * this.itemHeight}px`;
            element.style.width = '100%';
            this.contentContainer.appendChild(element);
        }
    }
    
    updateItems(newItems) {
        this.items = newItems;
        this.render();
    }
} 