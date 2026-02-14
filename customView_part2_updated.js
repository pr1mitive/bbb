/**
 * 発注管理システム - 案件配分・見積参照機能統合版
 * 
 * 明細行操作、案件配分ボタン、見積参照、モーダル表示
 * 
 * 【更新履歴】
 * 2026-02-14: 案件配分ボタンを追加
 * 2026-02-14: 見積参照機能を追加
 */

(function(window) {
  'use strict';
  
  const CONFIG = window.PO_CONFIG;
  const Utils = window.PO_Utils;
  const MasterData = window.PO_MasterData;
  const Calculator = window.PO_Calculator;
  
  /**
   * 明細行を追加
   */
  window.addItemRow = function() {
    const tbody = document.getElementById('itemsBody');
    const currentCount = tbody.children.length;
    
    if (currentCount >= CONFIG.MAX_ITEMS) {
      Utils.showAlert(
        Utils.formatMessage(CONFIG.UI.MESSAGES.ERROR_MAX_ITEMS, { max: CONFIG.MAX_ITEMS }),
        'warning'
      );
      return;
    }
    
    const rowIndex = currentCount; // 0始まりのインデックス
    const rowNo = currentCount + 1; // 表示用の行番号(1始まり)
    
    const row = document.createElement('tr');
    row.id = `po-item-row-${rowIndex}`;
    row.dataset.rowIndex = rowIndex;
    row.dataset.rowNo = rowNo;
    row.dataset.isInventory = CONFIG.INVENTORY_TYPES.NON_INVENTORY;
    
    row.innerHTML = `
      <td class="po-cell-center">${rowNo}</td>
      <td>
        <div class="po-input-group-compact">
          <input type="text" class="po-input po-input-sm item-code item-code-input" placeholder="コード">
          <button type="button" class="po-btn po-btn-icon btn-search" title="アイテム検索">🔍</button>
        </div>
      </td>
      <td><input type="text" class="po-input po-input-sm item-name" placeholder="名称" required></td>
      <td><textarea class="po-textarea po-textarea-sm item-detail" rows="2" placeholder="詳細情報"></textarea></td>
      <td><input type="number" class="po-input po-input-sm po-input-number unit-price" step="0.01" min="0" placeholder="0.00" required></td>
      <td><input type="number" class="po-input po-input-sm po-input-number quantity quantity-input" step="0.01" min="0" placeholder="0" required></td>
      <td><input type="text" class="po-input po-input-sm unit" placeholder="個"></td>
      <td class="po-cell-right amount" data-value="0">0.00</td>
      <td>
        <button type="button" class="po-btn po-btn-sm po-btn-secondary" 
                id="project-allocation-btn-${rowIndex}" 
                title="案件配分">
          ${CONFIG.UI.BUTTON_TEXT.PROJECT_ALLOCATION}
        </button>
      </td>
      <td class="po-cell-center">
        <button type="button" class="po-btn po-btn-icon po-btn-danger btn-delete" title="削除">✕</button>
      </td>
    `;
    
    tbody.appendChild(row);
    attachRowEventListeners(row, rowIndex);
    updateItemCount();
    
    Utils.log(`明細行追加: 行番号=${rowNo}, rowIndex=${rowIndex}`);
  };
  
  /**
   * 明細行にイベントリスナーを設定
   * @param {HTMLElement} row - 明細行
   * @param {number} rowIndex - 行インデックス
   */
  function attachRowEventListeners(row, rowIndex) {
    // アイテム検索ボタン
    row.querySelector('.btn-search').addEventListener('click', function() {
      openItemSearchModal(row);
    });
    
    // 単価・数量入力時に金額計算
    row.querySelector('.unit-price').addEventListener('input', function() {
      Calculator.calculateRowAmount(row);
    });
    
    row.querySelector('.quantity').addEventListener('input', function() {
      Calculator.calculateRowAmount(row);
    });
    
    // 案件配分ボタン
    const projectAllocBtn = row.querySelector(`#project-allocation-btn-${rowIndex}`);
    if (projectAllocBtn) {
      projectAllocBtn.addEventListener('click', function() {
        window.showProjectAllocationModal(rowIndex);
      });
    }
    
    // 削除ボタン
    row.querySelector('.btn-delete').addEventListener('click', function() {
      if (Utils.confirm(CONFIG.UI.MESSAGES.CONFIRM_DELETE_ROW)) {
        row.remove();
        
        // 案件配分データも削除
        delete window.projectAllocations[rowIndex];
        
        renumberRows();
        updateItemCount();
        Calculator.calculateTotal();
        Utils.log('明細行削除: rowIndex=' + rowIndex);
      }
    });
  }
  
  /**
   * 行番号を振り直す
   */
  function renumberRows() {
    const tbody = document.getElementById('itemsBody');
    const rows = tbody.querySelectorAll('tr');
    
    // 案件配分データを再マッピング
    const oldAllocations = { ...window.projectAllocations };
    window.projectAllocations = {};
    
    rows.forEach((row, newIndex) => {
      const oldIndex = parseInt(row.dataset.rowIndex);
      const rowNo = newIndex + 1;
      
      // 行番号を更新
      row.id = `po-item-row-${newIndex}`;
      row.dataset.rowIndex = newIndex;
      row.dataset.rowNo = rowNo;
      row.querySelector('td:first-child').textContent = rowNo;
      
      // 案件配分ボタンのIDを更新
      const btn = row.querySelector('[id^="project-allocation-btn-"]');
      if (btn) {
        btn.id = `project-allocation-btn-${newIndex}`;
        // イベントリスナーを再設定
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', function() {
          window.showProjectAllocationModal(newIndex);
        });
      }
      
      // 案件配分データを新しいインデックスに移動
      if (oldAllocations[oldIndex]) {
        window.projectAllocations[newIndex] = oldAllocations[oldIndex];
      }
    });
    
    Utils.log('行番号を振り直しました');
  }
  
  /**
   * 明細行数を更新
   */
  function updateItemCount() {
    const tbody = document.getElementById('itemsBody');
    const count = tbody.children.length;
    const countElem = document.getElementById('itemCount');
    if (countElem) {
      countElem.textContent = `${count} / ${CONFIG.MAX_ITEMS}`;
    }
  }
  
  /**
   * アイテム検索モーダルを開く
   * @param {HTMLElement} targetRow - 対象の明細行
   */
  function openItemSearchModal(targetRow) {
    const modal = document.createElement('div');
    modal.className = 'po-modal-overlay';
    modal.innerHTML = `
      <div class="po-modal-content po-modal-lg">
        <div class="po-modal-header">
          <h3>アイテム検索</h3>
          <button type="button" class="po-modal-close">×</button>
        </div>
        <div class="po-modal-body">
          <div class="po-search-box">
            <input type="text" id="itemSearchInput" class="po-input" placeholder="アイテムコードまたは名称で検索">
            <button type="button" id="itemSearchBtn" class="po-btn po-btn-primary">${CONFIG.UI.BUTTON_TEXT.SEARCH}</button>
          </div>
          <div id="itemSearchResults" class="po-search-results"></div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // イベント設定
    modal.querySelector('.po-modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
    const searchInput = modal.querySelector('#itemSearchInput');
    const searchBtn = modal.querySelector('#itemSearchBtn');
    const resultsDiv = modal.querySelector('#itemSearchResults');
    
    // 検索実行
    const performSearch = () => {
      const keyword = searchInput.value.trim();
      if (!keyword) {
        resultsDiv.innerHTML = '<p class="po-text-muted">検索キーワードを入力してください</p>';
        return;
      }
      
      resultsDiv.innerHTML = '<p class="po-text-muted">検索中...</p>';
      
      const items = MasterData.items.filter(item => {
        const code = item.code.toLowerCase();
        const name = item.name.toLowerCase();
        const kw = keyword.toLowerCase();
        return code.includes(kw) || name.includes(kw);
      });
      
      if (items.length === 0) {
        resultsDiv.innerHTML = `<p class="po-text-muted">${CONFIG.UI.MESSAGES.ERROR_NO_RESULTS}</p>`;
        return;
      }
      
      // 結果テーブル生成
      let html = '<table class="po-table"><thead><tr><th>コード</th><th>名称</th><th>仕様</th><th>単価</th><th>単位</th><th>操作</th></tr></thead><tbody>';
      items.forEach(item => {
        html += `
          <tr>
            <td>${Utils.escapeHtml(item.code)}</td>
            <td>${Utils.escapeHtml(item.name)}</td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${Utils.escapeHtml(item.specification || '')}</td>
            <td class="po-cell-right">${item.standardPrice ? Number(item.standardPrice).toFixed(2) : '-'}</td>
            <td>${Utils.escapeHtml(item.unit || '')}</td>
            <td class="po-cell-center">
              <button type="button" class="po-btn po-btn-sm po-btn-primary btn-select-item" 
                      data-code="${Utils.escapeHtml(item.code)}"
                      data-name="${Utils.escapeHtml(item.name)}"
                      data-specification="${Utils.escapeHtml(item.specification || '')}"
                      data-price="${item.standardPrice || ''}"
                      data-unit="${Utils.escapeHtml(item.unit || '')}"
                      data-is-inventory="${item.isInventory || CONFIG.INVENTORY_TYPES.NON_INVENTORY}">
                ${CONFIG.UI.BUTTON_TEXT.SELECT}
              </button>
            </td>
          </tr>
        `;
      });
      html += '</tbody></table>';
      resultsDiv.innerHTML = html;
      
      // 選択ボタンのイベント設定
      resultsDiv.querySelectorAll('.btn-select-item').forEach(btn => {
        btn.addEventListener('click', function() {
          targetRow.querySelector('.item-code').value = this.dataset.code;
          targetRow.querySelector('.item-name').value = this.dataset.name;
          targetRow.querySelector('.item-detail').value = this.dataset.specification;
          targetRow.querySelector('.unit-price').value = this.dataset.price;
          targetRow.querySelector('.unit').value = this.dataset.unit;
          targetRow.dataset.isInventory = this.dataset.isInventory;
          
          Calculator.calculateRowAmount(targetRow);
          modal.remove();
          
          Utils.log(`アイテム選択: ${this.dataset.code}`);
        });
      });
    };
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });
    
    // 初期表示(全件)
    performSearch();
    searchInput.focus();
  }
  
  /**
   * 見積参照モーダルを開く
   */
  window.openQuoteModal = async function() {
    const vendorCode = document.getElementById('vendor').value;
    if (!vendorCode) {
      Utils.showAlert(CONFIG.UI.MESSAGES.ERROR_NO_VENDOR, 'warning');
      return;
    }
    
    const modal = document.getElementById('modalQuoteRef');
    if (!modal) {
      Utils.error('見積参照モーダルが見つかりません');
      return;
    }
    
    modal.style.display = 'block';
    
    // 初期検索(発注先でフィルタ)
    await searchQuotes(vendorCode);
    
    // 検索ボタンイベント
    const searchBtn = document.getElementById('btnQuoteSearch');
    if (searchBtn) {
      searchBtn.onclick = async function() {
        const query = document.getElementById('quoteSearchQuery').value;
        await searchQuotes(vendorCode, query);
      };
    }
  };
  
  /**
   * 見積検索実行
   * @param {string} vendorCode - 発注先コード
   * @param {string} searchQuery - 検索クエリ
   */
  async function searchQuotes(vendorCode, searchQuery = '') {
    try {
      Utils.showLoading('見積検索中...');
      
      const records = await MasterData.searchQuotes(vendorCode, searchQuery);
      const resultsDiv = document.getElementById('quoteSearchResults');
      if (!resultsDiv) {
        Utils.hideLoading();
        return;
      }
      
      resultsDiv.innerHTML = '';
      
      if (records.length === 0) {
        resultsDiv.innerHTML = `<p class="po-text-muted">${CONFIG.UI.MESSAGES.ERROR_NO_RESULTS}</p>`;
        Utils.hideLoading();
        return;
      }
      
      records.forEach(record => {
        const card = document.createElement('div');
        card.className = 'po-quote-card';
        card.style.cssText = 'border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: white;';
        
        const quoteNumber = Utils.getFieldValue(record, CONFIG.FIELDS.QUOTE.NUMBER);
        const quoteName = Utils.getFieldValue(record, CONFIG.FIELDS.QUOTE.NAME);
        const currency = Utils.getFieldValue(record, CONFIG.FIELDS.QUOTE.CURRENCY);
        const expiryDate = Utils.getFieldValue(record, CONFIG.FIELDS.QUOTE.EXPIRY_DATE);
        const itemsCount = record[CONFIG.FIELDS.QUOTE.ITEMS]?.value?.length || 0;
        
        card.innerHTML = `
          <div class="po-quote-header">
            <h4 class="po-quote-title" style="margin: 0 0 8px 0; font-size: 16px;">${Utils.escapeHtml(quoteNumber)} - ${Utils.escapeHtml(quoteName)}</h4>
          </div>
          <div class="po-quote-body" style="margin-bottom: 12px;">
            <p style="margin: 4px 0;">通貨: ${Utils.escapeHtml(currency)} | 有効期限: ${expiryDate || '無期限'}</p>
            <p style="margin: 4px 0;">明細行数: ${itemsCount}行</p>
          </div>
          <div class="po-quote-footer">
            <button type="button" class="po-btn po-btn-primary btn-import-quote">この見積を取込</button>
          </div>
        `;
        
        card.querySelector('.btn-import-quote').addEventListener('click', function() {
          importQuoteItems(record);
        });
        
        resultsDiv.appendChild(card);
      });
      
      Utils.hideLoading();
      
    } catch (error) {
      Utils.hideLoading();
      Utils.error('見積検索エラー', error);
      Utils.showAlert('見積検索に失敗しました', 'error');
    }
  }
  
  /**
   * 見積明細を取込
   * @param {Object} quoteRecord - 見積レコード
   */
  function importQuoteItems(quoteRecord) {
    const tbody = document.getElementById('itemsBody');
    const currentCount = tbody.children.length;
    
    // 既存明細がある場合は確認
    if (currentCount > 0) {
      const overwrite = Utils.confirm('既存の明細を上書きしますか?\n\n「OK」: 上書き\n「キャンセル」: 追加');
      if (overwrite) {
        tbody.innerHTML = '';
        // 案件配分データもクリア
        window.projectAllocations = {};
      }
    }
    
    // 見積明細を取込
    const quoteItems = quoteRecord[CONFIG.FIELDS.QUOTE.ITEMS]?.value || [];
    let importedCount = 0;
    
    quoteItems.forEach(item => {
      const currentCount = document.querySelectorAll('#itemsBody tr').length;
      if (currentCount >= CONFIG.MAX_ITEMS) {
        return;
      }
      
      const rowIndex = currentCount; // 0始まりのインデックス
      const rowNo = currentCount + 1; // 表示用の行番号
      
      const row = document.createElement('tr');
      row.id = `po-item-row-${rowIndex}`;
      row.dataset.rowIndex = rowIndex;
      row.dataset.rowNo = rowNo;
      row.dataset.isInventory = CONFIG.INVENTORY_TYPES.NON_INVENTORY;
      
      const itemCode = Utils.getFieldValue(item.value, CONFIG.FIELDS.QUOTE_ITEM.ITEM_CODE);
      const itemName = Utils.getFieldValue(item.value, CONFIG.FIELDS.QUOTE_ITEM.ITEM_NAME);
      const itemDetail = Utils.getFieldValue(item.value, CONFIG.FIELDS.QUOTE_ITEM.ITEM_DETAIL);
      const unitPrice = Utils.getFieldValue(item.value, CONFIG.FIELDS.QUOTE_ITEM.UNIT_PRICE);
      const unit = Utils.getFieldValue(item.value, CONFIG.FIELDS.QUOTE_ITEM.UNIT);
      
      row.innerHTML = `
        <td class="po-cell-center">${rowNo}</td>
        <td>
          <div class="po-input-group-compact">
            <input type="text" class="po-input po-input-sm item-code item-code-input" value="${Utils.escapeHtml(itemCode)}">
            <button type="button" class="po-btn po-btn-icon btn-search" title="アイテム検索">🔍</button>
          </div>
        </td>
        <td><input type="text" class="po-input po-input-sm item-name" value="${Utils.escapeHtml(itemName)}" required></td>
        <td><textarea class="po-textarea po-textarea-sm item-detail" rows="2">${Utils.escapeHtml(itemDetail)}</textarea></td>
        <td><input type="number" class="po-input po-input-sm po-input-number unit-price" value="${unitPrice}" step="0.01" min="0" required></td>
        <td><input type="number" class="po-input po-input-sm po-input-number quantity quantity-input" step="0.01" min="0" placeholder="0" required></td>
        <td><input type="text" class="po-input po-input-sm unit" value="${Utils.escapeHtml(unit)}"></td>
        <td class="po-cell-right amount" data-value="0">0.00</td>
        <td>
          <button type="button" class="po-btn po-btn-sm po-btn-secondary" 
                  id="project-allocation-btn-${rowIndex}" 
                  title="案件配分">
            ${CONFIG.UI.BUTTON_TEXT.PROJECT_ALLOCATION}
          </button>
        </td>
        <td class="po-cell-center">
          <button type="button" class="po-btn po-btn-icon po-btn-danger btn-delete" title="削除">✕</button>
        </td>
      `;
      
      tbody.appendChild(row);
      attachRowEventListeners(row, rowIndex);
      importedCount++;
    });
    
    // 通貨を見積と合わせる
    const quoteCurrency = Utils.getFieldValue(quoteRecord, CONFIG.FIELDS.QUOTE.CURRENCY);
    const currencySelect = document.getElementById('currency');
    if (currencySelect) {
      currencySelect.value = quoteCurrency;
      currencySelect.dispatchEvent(new Event('change'));
    }
    
    updateItemCount();
    Calculator.calculateTotal();
    
    // モーダルを閉じる
    const modal = document.getElementById('modalQuoteRef');
    if (modal) {
      modal.style.display = 'none';
    }
    
    Utils.showAlert(
      Utils.formatMessage(CONFIG.UI.MESSAGES.INFO_ITEMS_IMPORTED, { count: importedCount }),
      'success'
    );
    
    Utils.log(`見積明細取込完了: ${importedCount}行`);
  }
  
  // グローバルに公開
  window.PO_CustomView = window.PO_CustomView || {};
  window.PO_CustomView.addItemRow = window.addItemRow;
  window.PO_CustomView.updateItemCount = updateItemCount;
  
})(window);
