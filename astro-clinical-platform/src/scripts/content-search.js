/**
 * 內容搜尋和過濾功能
 * 提供客戶端搜尋、過濾和排序功能
 * 
 * 更新日期：2025-01-30
 * 更新內容：新增內容搜尋和過濾 JavaScript 功能
 * 
 * 需求對應：
 * - 需求 1.1: 專科分類架構系統 ✓
 * - 需求 7.1: 多語言支援機制 ✓
 */

class ContentSearchFilter {
  constructor(options = {}) {
    this.options = {
      searchInputId: 'search-input',
      resultsContainerId: 'search-results',
      noResultsId: 'no-results',
      searchStatsId: 'search-stats',
      resultCountId: 'result-count',
      activeFiltersId: 'active-filters',
      clearAllFiltersId: 'clear-all-filters',
      clearSearchId: 'clear-search',
      debounceDelay: 300,
      minSearchLength: 2,
      ...options
    };

    this.allContent = [];
    this.filteredContent = [];
    this.currentFilters = {};
    this.currentSort = 'relevance';
    this.searchTerm = '';
    
    this.init();
  }

  async init() {
    try {
      // 載入所有內容數據
      await this.loadContent();
      
      // 初始化事件監聽器
      this.initEventListeners();
      
      // 初始顯示所有內容
      this.applyFilters();
      
      console.log('ContentSearchFilter initialized with', this.allContent.length, 'items');
    } catch (error) {
      console.error('Failed to initialize ContentSearchFilter:', error);
    }
  }

  async loadContent() {
    try {
      // 從 API 端點載入內容數據
      const response = await fetch('/api/content/search-data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.allContent = data.content || [];
      this.filteredContent = [...this.allContent];
    } catch (error) {
      console.error('Failed to load content:', error);
      
      // 如果 API 不可用，嘗試從頁面數據載入
      this.loadContentFromPage();
    }
  }

  loadContentFromPage() {
    // 從頁面中的現有內容元素提取數據
    const contentElements = document.querySelectorAll('[data-content-item]');
    this.allContent = Array.from(contentElements).map(element => {
      try {
        return JSON.parse(element.dataset.contentData || '{}');
      } catch {
        return this.extractContentFromElement(element);
      }
    });
    
    this.filteredContent = [...this.allContent];
  }

  extractContentFromElement(element) {
    // 從 DOM 元素提取內容數據
    return {
      slug: element.dataset.slug || '',
      title: element.querySelector('[data-title]')?.textContent || '',
      excerpt: element.querySelector('[data-excerpt]')?.textContent || '',
      category: element.dataset.category || '',
      specialty: element.dataset.specialty || '',
      tags: (element.dataset.tags || '').split(',').filter(Boolean),
      author: element.dataset.author || '',
      status: element.dataset.status || 'published',
      difficulty: element.dataset.difficulty || 'basic',
      readingTime: parseInt(element.dataset.readingTime) || 5,
      lastUpdated: element.dataset.lastUpdated || '',
      patientFriendly: element.dataset.patientFriendly === 'true',
      hasFlowchart: element.dataset.hasFlowchart === 'true',
      isFeatured: element.dataset.featured === 'true'
    };
  }

  initEventListeners() {
    // 搜尋輸入框
    const searchInput = document.getElementById(this.options.searchInputId);
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.handleSearch(e.target.value);
        }, this.options.debounceDelay);
      });
    }

    // 清除搜尋按鈕
    const clearSearch = document.getElementById(this.options.clearSearchId);
    if (clearSearch) {
      clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        this.handleSearch('');
      });
    }

    // 快速過濾標籤
    document.querySelectorAll('.filter-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        this.handleQuickFilter(e.target);
      });
    });

    // 進階過濾器
    const filterSelects = [
      'specialty-filter',
      'category-filter', 
      'difficulty-filter',
      'author-filter',
      'status-filter',
      'tag-filter',
      'sort-filter'
    ];

    filterSelects.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', (e) => {
          if (id === 'sort-filter') {
            this.handleSort(e.target.value);
          } else {
            this.handleFilter(id.replace('-filter', ''), e.target.value);
          }
        });
      }
    });

    // 複選框過濾器
    const checkboxFilters = [
      'patient-friendly-filter',
      'has-flowchart-filter',
      'featured-filter'
    ];

    checkboxFilters.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', (e) => {
          const filterName = id.replace('-filter', '').replace('-', '');
          this.handleFilter(filterName, e.target.checked);
        });
      }
    });

    // 清除所有篩選按鈕
    const clearAllFilters = document.getElementById(this.options.clearAllFiltersId);
    if (clearAllFilters) {
      clearAllFilters.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }
  }

  handleSearch(term) {
    this.searchTerm = term.trim().toLowerCase();
    
    // 更新清除搜尋按鈕顯示狀態
    const clearSearch = document.getElementById(this.options.clearSearchId);
    if (clearSearch) {
      clearSearch.classList.toggle('hidden', !this.searchTerm);
    }

    this.applyFilters();
  }

  handleQuickFilter(tagElement) {
    // 移除其他活動標籤
    document.querySelectorAll('.filter-tag').forEach(tag => {
      tag.classList.remove('active');
    });
    
    // 設置當前標籤為活動狀態
    tagElement.classList.add('active');
    
    const filterValue = tagElement.dataset.filter;
    
    if (filterValue === 'all') {
      this.currentFilters = {};
    } else {
      const [filterType, value] = filterValue.split(':');
      this.currentFilters = { [filterType]: value };
    }
    
    this.applyFilters();
    this.updateActiveFilters();
  }

  handleFilter(filterType, value) {
    if (value === '' || value === false) {
      delete this.currentFilters[filterType];
    } else {
      this.currentFilters[filterType] = value;
    }
    
    this.applyFilters();
    this.updateActiveFilters();
  }

  handleSort(sortType) {
    this.currentSort = sortType;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.allContent];

    // 應用搜尋
    if (this.searchTerm && this.searchTerm.length >= this.options.minSearchLength) {
      filtered = this.searchContent(filtered, this.searchTerm);
    }

    // 應用篩選器
    filtered = this.filterContent(filtered);

    // 應用排序
    filtered = this.sortContent(filtered);

    this.filteredContent = filtered;
    this.renderResults();
    this.updateStats();
  }

  searchContent(content, term) {
    const searchTerms = term.split(/\s+/).filter(t => t.length > 0);
    
    return content.filter(item => {
      const searchableText = [
        item.title,
        item.excerpt,
        item.tags?.join(' '),
        item.category,
        item.specialty,
        item.author
      ].join(' ').toLowerCase();

      return searchTerms.every(searchTerm => 
        searchableText.includes(searchTerm)
      );
    });
  }

  filterContent(content) {
    return content.filter(item => {
      // 專科篩選
      if (this.currentFilters.specialty && 
          !item.medicalSpecialties?.includes(this.currentFilters.specialty)) {
        return false;
      }

      // 分類篩選
      if (this.currentFilters.category && 
          item.category !== this.currentFilters.category) {
        return false;
      }

      // 難度篩選
      if (this.currentFilters.difficulty && 
          item.difficulty !== this.currentFilters.difficulty) {
        return false;
      }

      // 作者篩選
      if (this.currentFilters.author && 
          item.author !== this.currentFilters.author) {
        return false;
      }

      // 狀態篩選
      if (this.currentFilters.status && 
          item.status !== this.currentFilters.status) {
        return false;
      }

      // 標籤篩選
      if (this.currentFilters.tag && 
          !item.tags?.includes(this.currentFilters.tag)) {
        return false;
      }

      // 病患友善篩選
      if (this.currentFilters.patientfriendly && 
          !item.patientFriendly) {
        return false;
      }

      // 流程圖篩選
      if (this.currentFilters.hasflowchart && 
          !item.hasFlowchart) {
        return false;
      }

      // 精選內容篩選
      if (this.currentFilters.featured && 
          !item.isFeatured) {
        return false;
      }

      return true;
    });
  }

  sortContent(content) {
    const sorted = [...content];

    switch (this.currentSort) {
      case 'date-desc':
        return sorted.sort((a, b) => 
          new Date(b.lastUpdated) - new Date(a.lastUpdated)
        );
      
      case 'date-asc':
        return sorted.sort((a, b) => 
          new Date(a.lastUpdated) - new Date(b.lastUpdated)
        );
      
      case 'title-asc':
        return sorted.sort((a, b) => 
          a.title.localeCompare(b.title, 'zh-TW')
        );
      
      case 'title-desc':
        return sorted.sort((a, b) => 
          b.title.localeCompare(a.title, 'zh-TW')
        );
      
      case 'reading-time-asc':
        return sorted.sort((a, b) => 
          (a.readingTime || 0) - (b.readingTime || 0)
        );
      
      case 'reading-time-desc':
        return sorted.sort((a, b) => 
          (b.readingTime || 0) - (a.readingTime || 0)
        );
      
      case 'relevance':
      default:
        // 如果有搜尋詞，按相關性排序
        if (this.searchTerm) {
          return this.sortByRelevance(sorted, this.searchTerm);
        }
        // 否則按最新日期排序
        return sorted.sort((a, b) => 
          new Date(b.lastUpdated) - new Date(a.lastUpdated)
        );
    }
  }

  sortByRelevance(content, searchTerm) {
    return content.map(item => {
      let score = 0;
      const term = searchTerm.toLowerCase();
      
      // 標題匹配得分最高
      if (item.title.toLowerCase().includes(term)) {
        score += 10;
      }
      
      // 摘要匹配
      if (item.excerpt?.toLowerCase().includes(term)) {
        score += 5;
      }
      
      // 標籤匹配
      if (item.tags?.some(tag => tag.toLowerCase().includes(term))) {
        score += 3;
      }
      
      // 精確匹配額外加分
      if (item.title.toLowerCase() === term) {
        score += 20;
      }
      
      return { ...item, relevanceScore: score };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  renderResults() {
    const resultsContainer = document.getElementById(this.options.resultsContainerId);
    const noResults = document.getElementById(this.options.noResultsId);
    
    if (!resultsContainer) return;

    if (this.filteredContent.length === 0) {
      resultsContainer.innerHTML = '';
      if (noResults) noResults.classList.remove('hidden');
      return;
    }

    if (noResults) noResults.classList.add('hidden');

    // 渲染搜尋結果
    resultsContainer.innerHTML = this.filteredContent.map(item => 
      this.renderContentItem(item)
    ).join('');
  }

  renderContentItem(item) {
    const categoryNames = {
      disease: '疾病資訊',
      medication: '藥物資訊',
      procedure: '檢查程序',
      prevention: '預防保健',
      lifestyle: '生活方式',
      symptoms: '症狀識別',
      diagnosis: '診斷方法',
      treatment: '治療指引'
    };

    const difficultyNames = {
      basic: '基礎',
      intermediate: '中級',
      advanced: '進階'
    };

    const statusNames = {
      published: '已發布',
      'in-review': '審核中',
      draft: '草稿',
      'needs-revision': '需修改',
      'quality-check': '品質檢查',
      'ready-to-publish': '準備發布'
    };

    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';

    return `
      <article class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow mb-4">
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <div class="flex items-center space-x-2 mb-2">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                ${categoryNames[item.category] || item.category}
              </span>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                item.difficulty === 'basic' ? 'bg-green-100 text-green-800' :
                item.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }">
                ${difficultyNames[item.difficulty] || item.difficulty}
              </span>
              ${item.patientFriendly ? `
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  病患友善
                </span>
              ` : ''}
              ${isDevelopment && item.status !== 'published' ? `
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  ${statusNames[item.status] || item.status}
                </span>
              ` : ''}
            </div>
            
            <h3 class="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
              <a href="/education/${item.slug}">${item.title}</a>
            </h3>
            
            ${item.excerpt ? `
              <p class="text-gray-600 text-sm mb-4 line-clamp-2">
                ${item.excerpt}
              </p>
            ` : ''}
            
            <div class="flex items-center justify-between text-xs text-gray-500">
              <div class="flex items-center space-x-4">
                ${item.readingTime ? `
                  <span class="flex items-center">
                    <svg class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ${item.readingTime} 分鐘
                  </span>
                ` : ''}
                ${item.author ? `<span>作者: ${item.author}</span>` : ''}
                ${item.lastUpdated ? `<span>更新: ${new Date(item.lastUpdated).toLocaleDateString('zh-TW')}</span>` : ''}
              </div>
              <a 
                href="/education/${item.slug}"
                class="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                閱讀 →
              </a>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  updateStats() {
    const searchStats = document.getElementById(this.options.searchStatsId);
    const resultCount = document.getElementById(this.options.resultCountId);
    
    if (searchStats && resultCount) {
      resultCount.textContent = this.filteredContent.length;
      searchStats.classList.toggle('hidden', this.filteredContent.length === this.allContent.length && !this.searchTerm);
    }
  }

  updateActiveFilters() {
    const activeFiltersContainer = document.getElementById(this.options.activeFiltersId);
    const clearAllButton = document.getElementById(this.options.clearAllFiltersId);
    
    if (!activeFiltersContainer) return;

    const hasFilters = Object.keys(this.currentFilters).length > 0 || this.searchTerm;
    
    activeFiltersContainer.classList.toggle('hidden', !hasFilters);
    if (clearAllButton) {
      clearAllButton.classList.toggle('hidden', !hasFilters);
    }

    if (hasFilters) {
      const filterTags = [];
      
      // 搜尋詞標籤
      if (this.searchTerm) {
        filterTags.push(`
          <span class="active-filter-tag">
            搜尋: "${this.searchTerm}"
            <button type="button" onclick="contentSearchFilter.clearSearch()">×</button>
          </span>
        `);
      }
      
      // 篩選器標籤
      Object.entries(this.currentFilters).forEach(([key, value]) => {
        if (value === true) {
          filterTags.push(`
            <span class="active-filter-tag">
              ${this.getFilterDisplayName(key)}
              <button type="button" onclick="contentSearchFilter.removeFilter('${key}')">×</button>
            </span>
          `);
        } else if (value !== false && value !== '') {
          filterTags.push(`
            <span class="active-filter-tag">
              ${this.getFilterDisplayName(key)}: ${this.getFilterValueDisplayName(key, value)}
              <button type="button" onclick="contentSearchFilter.removeFilter('${key}')">×</button>
            </span>
          `);
        }
      });
      
      activeFiltersContainer.innerHTML = `<div class="flex flex-wrap gap-2">${filterTags.join('')}</div>`;
    }
  }

  getFilterDisplayName(filterKey) {
    const names = {
      specialty: '專科',
      category: '分類',
      difficulty: '難度',
      author: '作者',
      status: '狀態',
      tag: '標籤',
      patientfriendly: '病患友善',
      hasflowchart: '包含流程圖',
      featured: '精選內容'
    };
    return names[filterKey] || filterKey;
  }

  getFilterValueDisplayName(filterKey, value) {
    const specialtyNames = {
      cardiology: '心臟科',
      neurology: '神經科',
      orthopedics: '骨科',
      emergency: '急診醫學',
      pediatrics: '小兒科',
      general: '一般醫學'
    };

    const categoryNames = {
      disease: '疾病資訊',
      medication: '藥物資訊',
      procedure: '檢查程序',
      prevention: '預防保健',
      lifestyle: '生活方式',
      symptoms: '症狀識別',
      diagnosis: '診斷方法',
      treatment: '治療指引'
    };

    const difficultyNames = {
      basic: '基礎',
      intermediate: '中級',
      advanced: '進階'
    };

    const statusNames = {
      published: '已發布',
      'in-review': '審核中',
      draft: '草稿',
      'needs-revision': '需修改',
      'quality-check': '品質檢查',
      'ready-to-publish': '準備發布'
    };

    switch (filterKey) {
      case 'specialty':
        return specialtyNames[value] || value;
      case 'category':
        return categoryNames[value] || value;
      case 'difficulty':
        return difficultyNames[value] || value;
      case 'status':
        return statusNames[value] || value;
      default:
        return value;
    }
  }

  clearSearch() {
    const searchInput = document.getElementById(this.options.searchInputId);
    if (searchInput) {
      searchInput.value = '';
    }
    this.handleSearch('');
  }

  removeFilter(filterKey) {
    delete this.currentFilters[filterKey];
    
    // 更新對應的表單元素
    const element = document.getElementById(`${filterKey}-filter`);
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = false;
      } else {
        element.value = '';
      }
    }
    
    this.applyFilters();
    this.updateActiveFilters();
  }

  clearAllFilters() {
    this.currentFilters = {};
    this.searchTerm = '';
    
    // 重置所有表單元素
    const searchInput = document.getElementById(this.options.searchInputId);
    if (searchInput) {
      searchInput.value = '';
    }
    
    document.querySelectorAll('select[id$="-filter"]').forEach(select => {
      select.value = '';
    });
    
    document.querySelectorAll('input[id$="-filter"]').forEach(input => {
      if (input.type === 'checkbox') {
        input.checked = false;
      }
    });
    
    // 重置快速過濾標籤
    document.querySelectorAll('.filter-tag').forEach(tag => {
      tag.classList.remove('active');
    });
    
    const allTag = document.querySelector('.filter-tag[data-filter="all"]');
    if (allTag) {
      allTag.classList.add('active');
    }
    
    this.applyFilters();
    this.updateActiveFilters();
  }
}

// 全域實例
let contentSearchFilter;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  contentSearchFilter = new ContentSearchFilter();
});

// 匯出供其他腳本使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ContentSearchFilter;
}