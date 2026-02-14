/**
 * 発注管理システム - 案件配分管理
 * 
 * 各明細行に対する案件番号と配分数量の管理
 * エクセルライクな貼り付け機能を提供
 */

(function() {
  'use strict';
  
  const CONFIG = window.PO_CONFIG;
  
  // グローバル変数: 各明細行の案件配分データを保持
  window.projectAllocations = {};
  
  /**
   * 案件配分モーダルを表示
   * @param {number} rowIndex - 明細行のインデックス
   */
  window.showProjectAllocationModal = function(rowIndex) {
    const row = document.querySelector(`#po-item-row-${rowIndex}`);
    if (!row) return;
    
    const itemCode = row.querySelector('.item-code-input')?.value || '';
    const quantity = parseFloat(row.querySelector('.quantity-input')?.value) || 0;
    
    // バリデーション
    if (!itemCode) {
      alert(CONFIG.UI.MESSAGES.ERROR_NO_ITEM_CODE);
      return;
    }
    
    if (quantity <= 0) {
      alert(CONFIG.UI.MESSAGES.ERROR_NO_QUANTITY);
      return;
    }
    
    // 既存の案件配分データを取得
    const allocations = window.projectAllocations[rowIndex] || [];
    
    // モーダルHTML生成
    const modalHTML = `
      <div class="modal-overlay" id="project-allocation-modal">
        <div class="modal-content">
          <h3>案件配分 (アイテム: ${escapeHtml(itemCode)})</h3>
          <div class="allocation-summary">
            <p>明細数量: <strong>${quantity}</strong></p>
            <p>配分済数量: <strong id="allocated-total">0</strong> / ${quantity} 
              <span id="allocation-status"></span>
            </p>
          </div>
          <div class="allocation-table-container">
            <table class="allocation-table">
              <thead>
                <tr>
                  <th style="width: 40%;">案件番号</th>
                  <th style="width: 40%;">配分数量</th>
                  <th style="width: 20%;">操作</th>
                </tr>
              </thead>
              <tbody id="allocation-table-body">
                <!-- JavaScriptで生成 -->
              </tbody>
            </table>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" id="add-allocation-row">+ 案件を追加</button>
            <button type="button" class="btn-secondary" id="paste-allocations">${CONFIG.UI.BUTTON_TEXT.PASTE}</button>
            <div style="flex-grow: 1;"></div>
            <button type="button" class="btn-primary" id="save-allocations">OK</button>
            <button type="button" class="btn-secondary" id="cancel-allocations">キャンセル</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // テーブル行を生成
    renderAllocationTable(allocations, quantity);
    
    // イベントリスナー登録
    attachAllocationModalEvents(rowIndex, quantity);
  };
  
  /**
   * 案件配分テーブルのレンダリング
   * @param {Array} allocations - 案件配分データ配列
   * @param {number} totalQty - 明細行の合計数量
   */
  function renderAllocationTable(allocations, totalQty) {
    const tbody = document.getElementById('allocation-table-body');
    tbody.innerHTML = '';
    
    let allocatedTotal = 0;
    
    allocations.forEach((allocation, index) => {
      allocatedTotal += parseFloat(allocation.allocated_qty) || 0;
      
      const row = `
        <tr data-index="${index}">
          <td>
            <input type="text" class="allocation-project-id form-input" 
                   value="${escapeHtml(allocation.project_id)}" 
                   placeholder="案件番号" style="width: 100%;">
          </td>
          <td>
            <input type="number" class="allocation-qty form-input" 
                   value="${allocation.allocated_qty}" 
                   min="0" step="0.01" style="width: 100%;">
          </td>
          <td>
            <button type="button" class="btn-icon delete-allocation-row" 
                    data-index="${index}" title="削除">🗑</button>
          </td>
        </tr>
      `;
      tbody.insertAdjacentHTML('beforeend', row);
    });
    
    // 行がない場合は初期行を1つ追加
    if (allocations.length === 0) {
      addAllocationRow();
    }
    
    // 配分済数量を更新
    updateAllocationSummary(allocatedTotal, totalQty);
  }
  
  /**
   * 配分済数量サマリーの更新
   * @param {number} allocatedTotal - 配分済み合計
   * @param {number} totalQty - 明細行の合計数量
   */
  function updateAllocationSummary(allocatedTotal, totalQty) {
    const allocatedTotalEl = document.getElementById('allocated-total');
    const statusSpan = document.getElementById('allocation-status');
    
    if (!allocatedTotalEl || !statusSpan) return;
    
    allocatedTotalEl.textContent = allocatedTotal.toFixed(2);
    
    if (Math.abs(allocatedTotal - totalQty) < 0.01) {
      statusSpan.textContent = '✓';
      statusSpan.style.color = CONFIG.UI.COLORS.SUCCESS;
    } else if (allocatedTotal > totalQty) {
      statusSpan.textContent = '⚠ 超過';
      statusSpan.style.color = CONFIG.UI.COLORS.DANGER;
    } else {
      statusSpan.textContent = '⚠ 不足';
      statusSpan.style.color = CONFIG.UI.COLORS.WARNING;
    }
  }
  
  /**
   * 案件配分行を追加
   */
  function addAllocationRow() {
    const tbody = document.getElementById('allocation-table-body');
    if (!tbody) return;
    
    const newIndex = tbody.querySelectorAll('tr').length;
    const row = `
      <tr data-index="${newIndex}">
        <td>
          <input type="text" class="allocation-project-id form-input" 
                 placeholder="案件番号" style="width: 100%;">
        </td>
        <td>
          <input type="number" class="allocation-qty form-input" 
                 value="0" min="0" step="0.01" style="width: 100%;">
        </td>
        <td>
          <button type="button" class="btn-icon delete-allocation-row" 
                  data-index="${newIndex}" title="削除">🗑</button>
        </td>
      </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', row);
  }
  
  /**
   * モーダル内のイベントリスナーをアタッチ
   * @param {number} rowIndex - 明細行のインデックス
   * @param {number} totalQty - 明細行の合計数量
   */
  function attachAllocationModalEvents(rowIndex, totalQty) {
    // 行追加ボタン
    document.getElementById('add-allocation-row')?.addEventListener('click', () => {
      addAllocationRow();
    });
    
    // 行削除ボタン(イベント委譲)
    document.addEventListener('click', handleDeleteAllocationRow);
    
    // 貼り付けボタン
    document.getElementById('paste-allocations')?.addEventListener('click', async () => {
      await handlePasteAllocations(totalQty);
    });
    
    // 数量変更時の再計算(イベント委譲)
    document.addEventListener('input', handleAllocationQtyChange);
    
    // 保存ボタン
    document.getElementById('save-allocations')?.addEventListener('click', () => {
      handleSaveAllocations(rowIndex, totalQty);
    });
    
    // キャンセルボタン
    document.getElementById('cancel-allocations')?.addEventListener('click', () => {
      closeAllocationModal();
    });
    
    // モーダル外クリックで閉じる
    document.querySelector('.modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        closeAllocationModal();
      }
    });
  }
  
  /**
   * 行削除ハンドラー
   * @param {Event} e - クリックイベント
   */
  function handleDeleteAllocationRow(e) {
    if (e.target.classList.contains('delete-allocation-row')) {
      const tbody = document.getElementById('allocation-table-body');
      const rows = tbody?.querySelectorAll('tr');
      
      // 最後の1行は削除しない
      if (rows && rows.length > 1) {
        e.target.closest('tr')?.remove();
        recalculateAllocationTotal();
      } else {
        alert('最低1行は必要です');
      }
    }
  }
  
  /**
   * 貼り付けハンドラー
   * @param {number} totalQty - 明細行の合計数量
   */
  async function handlePasteAllocations(totalQty) {
    try {
      const text = await navigator.clipboard.readText();
      const allocations = parseProjectAllocationFromClipboard(text);
      
      if (allocations.length === 0) {
        alert(CONFIG.UI.MESSAGES.INFO_NO_VALID_DATA);
        return;
      }
      
      // テーブルを再生成
      const tbody = document.getElementById('allocation-table-body');
      if (!tbody) return;
      
      tbody.innerHTML = '';
      allocations.forEach((allocation, index) => {
        const row = `
          <tr data-index="${index}">
            <td>
              <input type="text" class="allocation-project-id form-input" 
                     value="${escapeHtml(allocation.project_id)}" 
                     style="width: 100%;">
            </td>
            <td>
              <input type="number" class="allocation-qty form-input" 
                     value="${allocation.allocated_qty}" 
                     min="0" step="0.01" style="width: 100%;">
            </td>
            <td>
              <button type="button" class="btn-icon delete-allocation-row" 
                      data-index="${index}" title="削除">🗑</button>
            </td>
          </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
      });
      
      recalculateAllocationTotal(totalQty);
      
    } catch (err) {
      alert('クリップボードの読み取りに失敗しました。\nブラウザの権限設定を確認してください。');
      if (CONFIG.DEBUG) {
        console.error('[案件配分] クリップボード読み取りエラー:', err);
      }
    }
  }
  
  /**
   * 数量変更ハンドラー
   * @param {Event} e - inputイベント
   */
  function handleAllocationQtyChange(e) {
    if (e.target.classList.contains('allocation-qty')) {
      recalculateAllocationTotal();
    }
  }
  
  /**
   * 配分数量合計の再計算
   * @param {number} totalQty - 明細行の合計数量(オプション)
   */
  function recalculateAllocationTotal(totalQty) {
    const qtyInputs = document.querySelectorAll('.allocation-qty');
    let total = 0;
    qtyInputs.forEach(input => {
      total += parseFloat(input.value) || 0;
    });
    
    // totalQtyが指定されていない場合は取得
    if (totalQty === undefined) {
      const summaryText = document.querySelector('.allocation-summary p')?.textContent || '';
      const match = summaryText.match(/明細数量:\s*(\d+\.?\d*)/);
      totalQty = match ? parseFloat(match[1]) : 0;
    }
    
    updateAllocationSummary(total, totalQty);
  }
  
  /**
   * 案件配分データの収集
   * @returns {Array} 案件配分データ配列
   */
  function collectAllocationData() {
    const rows = document.querySelectorAll('#allocation-table-body tr');
    const allocations = [];
    
    rows.forEach(row => {
      const projectId = row.querySelector('.allocation-project-id')?.value.trim() || '';
      const qty = parseFloat(row.querySelector('.allocation-qty')?.value) || 0;
      
      if (projectId && qty > 0) {
        allocations.push({
          project_id: projectId,
          allocated_qty: qty
        });
      }
    });
    
    return allocations;
  }
  
  /**
   * 案件配分の保存
   * @param {number} rowIndex - 明細行のインデックス
   * @param {number} totalQty - 明細行の合計数量
   */
  function handleSaveAllocations(rowIndex, totalQty) {
    const allocations = collectAllocationData();
    
    // バリデーション: 配分数量の合計チェック
    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocated_qty, 0);
    
    if (Math.abs(totalAllocated - totalQty) > 0.01) {
      const confirmMsg = CONFIG.UI.MESSAGES.WARN_ALLOCATION_MISMATCH
        .replace('{allocated}', totalAllocated.toFixed(2))
        .replace('{total}', totalQty.toFixed(2));
      
      if (!confirm(confirmMsg)) {
        return;
      }
    }
    
    // バリデーション: 案件番号の重複チェック
    const projectIds = allocations.map(a => a.project_id);
    const uniqueIds = new Set(projectIds);
    if (projectIds.length !== uniqueIds.size) {
      alert(CONFIG.UI.MESSAGES.ERROR_DUPLICATE_PROJECT);
      return;
    }
    
    // データを保存
    window.projectAllocations[rowIndex] = allocations;
    
    if (CONFIG.DEBUG) {
      console.log('[案件配分] 保存:', rowIndex, allocations);
    }
    
    // モーダルを閉じる
    closeAllocationModal();
    
    // 案件配分ボタンの表示を更新
    updateProjectAllocationButton(rowIndex);
  }
  
  /**
   * モーダルを閉じる
   */
  function closeAllocationModal() {
    // イベントリスナーを削除
    document.removeEventListener('click', handleDeleteAllocationRow);
    document.removeEventListener('input', handleAllocationQtyChange);
    
    // モーダル要素を削除
    document.getElementById('project-allocation-modal')?.remove();
  }
  
  /**
   * クリップボードテキストから案件配分データをパース
   * @param {string} text - クリップボードテキスト
   * @returns {Array} 案件配分データ配列
   */
  function parseProjectAllocationFromClipboard(text) {
    const lines = text.trim().split('\n');
    const allocations = [];
    
    lines.forEach((line, index) => {
      // ヘッダー行スキップ
      if (index === 0 && /案件|project|配分|allocated/i.test(line)) {
        return;
      }
      
      // タブまたは複数スペースで分割
      const cols = line.split(/\t| {2,}/).filter(c => c.trim());
      
      if (cols.length >= 2) {
        const projectId = cols[0].trim();
        const qty = parseFloat(cols[1].trim());
        
        if (projectId && !isNaN(qty) && qty > 0) {
          allocations.push({
            project_id: projectId,
            allocated_qty: qty
          });
        }
      }
    });
    
    return allocations;
  }
  
  /**
   * 案件配分ボタンの表示を更新
   * @param {number} rowIndex - 明細行のインデックス
   */
  function updateProjectAllocationButton(rowIndex) {
    const btn = document.querySelector(`#project-allocation-btn-${rowIndex}`);
    if (!btn) return;
    
    const allocations = window.projectAllocations[rowIndex] || [];
    
    if (allocations.length > 0) {
      btn.textContent = `案件配分 (${allocations.length}件)`;
      btn.classList.add('has-allocation');
    } else {
      btn.textContent = CONFIG.UI.BUTTON_TEXT.PROJECT_ALLOCATION;
      btn.classList.remove('has-allocation');
    }
  }
  
  /**
   * HTMLエスケープ
   * @param {string} str - エスケープする文字列
   * @returns {string} エスケープ済み文字列
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  // グローバル関数として公開
  window.updateProjectAllocationButton = updateProjectAllocationButton;
  
})();
