/**
 * kintone 発注残ダッシュボード - メイン処理
 * 
 * 発注管理アプリ(748)に発注残一覧を表示し、
 * 入庫登録・入庫履歴の参照機能を提供
 * 
 * @version 1.2.0
 * @date 2026-02-17
 * @update 入庫登録時のステータスを「確定」に変更、UI間隔改善
 * @requires inventory_config_v2.0.1.js
 * @requires inventory_utils.js
 */

(function() {
  'use strict';

  // =====================================================
  // グローバル変数チェック
  // =====================================================
  if (!window.INVENTORY_CONFIG) {
    console.error('[PO_DASHBOARD] INVENTORY_CONFIG が読み込まれていません');
    return;
  }
  if (!window.InventoryUtils) {
    console.error('[PO_DASHBOARD] InventoryUtils が読み込まれていません');
    return;
  }

  const CONFIG = window.INVENTORY_CONFIG;
  const UTILS = window.InventoryUtils;
  
  // App ID取得
  const PO_APP_ID = CONFIG.APP_IDS.PO_MANAGEMENT; // 748
  const TRANSACTION_APP_ID = CONFIG.APP_IDS.INVENTORY_TRANSACTION; // 760
  const WAREHOUSE_MASTER_APP_ID = CONFIG.APP_IDS.WAREHOUSE_MASTER; // 747
  
  console.log('[PO_DASHBOARD] スクリプト読み込み完了', {
    version: '1.2.0',
    poAppId: PO_APP_ID,
    transactionAppId: TRANSACTION_APP_ID
  });

  // =====================================================
  // ダッシュボード状態管理
  // =====================================================
  let state = {
    allPORecords: [],        // 全発注レコード
    filteredRecords: [],     // フィルター後のレコード
    currentFilters: {
      searchText: '',
      status: 'all',
      dateFrom: '',
      dateTo: ''
    },
    selectedPO: null,        // 選択中の発注
    selectedItem: null       // 選択中の品目
  };

  // =====================================================
  // メイン処理
  // =====================================================
  
  /**
   * 発注管理アプリの一覧画面でダッシュボードを表示
   * ※「発注残管理」一覧のみで表示
   */
  kintone.events.on('app.record.index.show', async (event) => {
    if (event.appId !== PO_APP_ID) return event;

    // 「発注残管理」一覧のみで表示
    const viewName = event.viewName || event.viewId;
    if (viewName !== '発注残管理') {
      console.log('[PO_DASHBOARD] 一覧「' + viewName + '」ではダッシュボードを表示しません');
      return event;
    }

    try {
      console.log('[PO_DASHBOARD] ダッシュボード表示開始');
      
      // ダッシュボード領域を作成
      createDashboardContainer();
      
      // 発注データを読み込み
      await loadPOData();
      
      // サマリーカードを表示
      renderSummaryCards();
      
      // フィルターエリアを表示
      renderFilterArea();
      
      // 発注残一覧を表示
      renderPOTable();
      
      console.log('[PO_DASHBOARD] ダッシュボード表示完了');
    } catch (error) {
      console.error('[PO_DASHBOARD] ダッシュボード表示エラー:', error);
      UTILS.showAlert('ダッシュボードの表示に失敗しました: ' + error.message, 'error');
    }

    return event;
  });

  // =====================================================
  // UI構築関数
  // =====================================================
  
  /**
   * ダッシュボードコンテナを作成
   * ※kintoneの一覧上部スペースに表示
   */
  function createDashboardContainer() {
    // 一覧上部スペースを取得（標準一覧と重ならない）
    const spaceElement = kintone.app.getHeaderSpaceElement();
    if (!spaceElement) {
      console.error('[PO_DASHBOARD] 上部スペース領域が取得できません');
      return;
    }

    // 既存のダッシュボードを削除
    const existingDashboard = document.getElementById('po-dashboard-container');
    if (existingDashboard) {
      existingDashboard.remove();
    }

    // ダッシュボードコンテナ作成
    const container = document.createElement('div');
    container.id = 'po-dashboard-container';
    container.className = 'po-dashboard';
    container.innerHTML = `
      <div class="dashboard-header">
        <h2 class="dashboard-title">📦 発注残ダッシュボード</h2>
        <button type="button" class="btn-refresh" id="btn-refresh-dashboard">
          🔄 更新
        </button>
      </div>
      <div id="dashboard-summary" class="dashboard-summary"></div>
      <div id="dashboard-filters" class="dashboard-filters"></div>
      <div id="dashboard-table" class="dashboard-table"></div>
      <div id="loading-overlay" class="loading-overlay" style="display:none;">
        <div class="loading-spinner"></div>
        <p>読み込み中...</p>
      </div>
    `;
    
    spaceElement.appendChild(container);

    // 更新ボタンのイベント
    document.getElementById('btn-refresh-dashboard').addEventListener('click', async () => {
      await loadPOData();
      renderSummaryCards();
      renderPOTable();
      UTILS.showAlert('ダッシュボードを更新しました', 'success');
    });
  }

  /**
   * サマリーカードを表示
   */
  function renderSummaryCards() {
    const container = document.getElementById('dashboard-summary');
    if (!container) return;

    // 統計を計算
    const stats = calculateStats();

    container.innerHTML = `
      <div class="summary-cards">
        <div class="summary-card card-not-delivered">
          <div class="card-icon">📦</div>
          <div class="card-content">
            <div class="card-value">${stats.notDelivered}</div>
            <div class="card-label">未納品</div>
          </div>
        </div>
        <div class="summary-card card-partial">
          <div class="card-icon">📝</div>
          <div class="card-content">
            <div class="card-value">${stats.partial}</div>
            <div class="card-label">一部納品</div>
          </div>
        </div>
        <div class="summary-card card-completed">
          <div class="card-icon">✅</div>
          <div class="card-content">
            <div class="card-value">${stats.completed}</div>
            <div class="card-label">完納</div>
          </div>
        </div>
        <div class="summary-card card-delayed">
          <div class="card-icon">⚠️</div>
          <div class="card-content">
            <div class="card-value">${stats.delayed}</div>
            <div class="card-label">納品遅延</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 統計データを計算
   * 
   * ステータス判定ロジック：
   * - 「未納品」: 発注残数 = 発注数、納品済数 = 0
   * - 「一部納品」: 0 < 納品済数 < 発注数、発注残数 > 0
   * - 「完納」: 納品済数 = 発注数、発注残数 = 0
   * - 「納品遅延」: 未納品or一部納品 かつ 納品予定日 < 今日
   * 
   * ※ステータスはpo_integration_v2.jsが入庫レコード作成時に自動更新します
   */
  function calculateStats() {
    const now = new Date();
    let notDelivered = 0;
    let partial = 0;
    let completed = 0;
    let delayed = 0;

    state.allPORecords.forEach(po => {
      const items = po[CONFIG.FIELDS.PO.PO_ITEMS]?.value || [];
      
      items.forEach(item => {
        const status = item.value.delivery_status?.value || '';
        const expectedDate = item.value.expected_received_date?.value;
        
        if (status === '未納品') {
          notDelivered++;
          // 納品予定日を過ぎているかチェック
          if (expectedDate && new Date(expectedDate) < now) {
            delayed++;
          }
        } else if (status === '一部納品') {
          partial++;
          if (expectedDate && new Date(expectedDate) < now) {
            delayed++;
          }
        } else if (status === '完納') {
          completed++;
        }
      });
    });

    return { notDelivered, partial, completed, delayed };
  }

  /**
   * フィルターエリアを表示
   */
  function renderFilterArea() {
    const container = document.getElementById('dashboard-filters');
    if (!container) return;

    container.innerHTML = `
      <div class="filter-row">
        <div class="filter-group">
          <label>🔍 検索</label>
          <input type="text" id="filter-search" class="filter-input" 
                 placeholder="発注番号、発注書番号、品目コード、品目名">
        </div>
        <div class="filter-group">
          <label>📊 ステータス</label>
          <select id="filter-status" class="filter-select">
            <option value="all">すべて</option>
            <option value="未納品">未納品のみ</option>
            <option value="一部納品">一部納品のみ</option>
            <option value="完納">完納のみ</option>
          </select>
        </div>
        <div class="filter-group">
          <label>📅 納品予定日</label>
          <input type="date" id="filter-date-from" class="filter-input">
          <span> ~ </span>
          <input type="date" id="filter-date-to" class="filter-input">
        </div>
        <button type="button" class="btn-filter" id="btn-apply-filter">適用</button>
        <button type="button" class="btn-filter-clear" id="btn-clear-filter">クリア</button>
      </div>
    `;

    // フィルターイベント
    document.getElementById('btn-apply-filter').addEventListener('click', applyFilters);
    document.getElementById('btn-clear-filter').addEventListener('click', clearFilters);
    
    // Enterキーでも検索
    document.getElementById('filter-search').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') applyFilters();
    });
  }

  /**
   * フィルターを適用
   */
  function applyFilters() {
    state.currentFilters = {
      searchText: document.getElementById('filter-search').value.trim().toLowerCase(),
      status: document.getElementById('filter-status').value,
      dateFrom: document.getElementById('filter-date-from').value,
      dateTo: document.getElementById('filter-date-to').value
    };

    // フィルター処理
    state.filteredRecords = state.allPORecords.filter(po => {
      const poNumber = po[CONFIG.FIELDS.PO.PO_NUMBER]?.value || '';
      const poDateFile = po[CONFIG.FIELDS.PO.PO_DATE_FILE]?.value || '';
      const items = po[CONFIG.FIELDS.PO.PO_ITEMS]?.value || [];

      // 検索テキストフィルター
      if (state.currentFilters.searchText) {
        const searchText = state.currentFilters.searchText;
        const matchPO = poNumber.toLowerCase().includes(searchText) || 
                       poDateFile.toLowerCase().includes(searchText);
        
        const matchItem = items.some(item => {
          const itemCode = item.value.item_code?.value || '';
          const itemName = item.value.item_name?.value || '';
          return itemCode.toLowerCase().includes(searchText) || 
                 itemName.toLowerCase().includes(searchText);
        });

        if (!matchPO && !matchItem) return false;
      }

      // ステータスフィルター
      if (state.currentFilters.status !== 'all') {
        const hasMatchingStatus = items.some(item => {
          const status = item.value.delivery_status?.value || '';
          return status === state.currentFilters.status;
        });
        if (!hasMatchingStatus) return false;
      }

      // 日付フィルター
      if (state.currentFilters.dateFrom || state.currentFilters.dateTo) {
        const hasMatchingDate = items.some(item => {
          const expectedDate = item.value.expected_received_date?.value;
          if (!expectedDate) return false;
          
          if (state.currentFilters.dateFrom && expectedDate < state.currentFilters.dateFrom) {
            return false;
          }
          if (state.currentFilters.dateTo && expectedDate > state.currentFilters.dateTo) {
            return false;
          }
          return true;
        });
        if (!hasMatchingDate) return false;
      }

      return true;
    });

    renderPOTable();
    UTILS.showAlert(`${state.filteredRecords.length}件の発注が見つかりました`, 'success');
  }

  /**
   * フィルターをクリア
   */
  function clearFilters() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-status').value = 'all';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    
    state.currentFilters = {
      searchText: '',
      status: 'all',
      dateFrom: '',
      dateTo: ''
    };
    
    state.filteredRecords = state.allPORecords;
    renderPOTable();
    UTILS.showAlert('フィルターをクリアしました', 'success');
  }

  /**
   * 発注残一覧テーブルを表示
   */
  function renderPOTable() {
    const container = document.getElementById('dashboard-table');
    if (!container) return;

    const records = state.filteredRecords.length > 0 ? state.filteredRecords : state.allPORecords;

    if (records.length === 0) {
      container.innerHTML = '<div class="no-data">発注データがありません</div>';
      return;
    }

    // テーブルヘッダー
    let html = `
      <table class="po-table">
        <thead>
          <tr>
            <th class="col-status">状態</th>
            <th class="col-po-number">発注番号</th>
            <th class="col-po-file">発注書番号</th>
            <th class="col-expected-date">納品予定</th>
            <th class="col-item-code">品目コード</th>
            <th class="col-item-name">品目名</th>
            <th class="col-qty">発注数</th>
            <th class="col-received">納品済</th>
            <th class="col-remaining">発注残</th>
            <th class="col-price">単価</th>
            <th class="col-amount">金額</th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
    `;

    // 各発注レコードをループ
    records.forEach(po => {
      const poNumber = po[CONFIG.FIELDS.PO.PO_NUMBER]?.value || '';
      const poDateFile = po[CONFIG.FIELDS.PO.PO_DATE_FILE]?.value || '';
      const items = po[CONFIG.FIELDS.PO.PO_ITEMS]?.value || [];

      // 発注明細テーブルの各行をループ
      items.forEach((item, index) => {
        const itemCode = item.value.item_code?.value || '';
        const itemName = item.value.item_name?.value || '';
        const quantity = parseFloat(item.value.quantity?.value || 0);
        const receivedQty = parseFloat(item.value.received_qty?.value || 0);
        const remainingQty = parseFloat(item.value.remaining_qty?.value || 0);
        const unitPrice = parseFloat(item.value.unit_price?.value || 0);
        const amount = parseFloat(item.value.amount?.value || 0);
        const deliveryStatus = item.value.delivery_status?.value || '未納品';
        const expectedDate = item.value.expected_received_date?.value || '';

        // ステータスアイコンとクラス
        const statusInfo = getStatusInfo(deliveryStatus, expectedDate);

        html += `
          <tr class="po-row" data-po-number="${poNumber}" data-item-code="${itemCode}" data-row-index="${index}">
            <td class="col-status">
              <span class="status-badge ${statusInfo.class}">${statusInfo.icon}</span>
            </td>
            <td class="col-po-number">${escapeHtml(poNumber)}</td>
            <td class="col-po-file">${escapeHtml(poDateFile)}</td>
            <td class="col-expected-date">${expectedDate || '-'}</td>
            <td class="col-item-code">${escapeHtml(itemCode)}</td>
            <td class="col-item-name">${escapeHtml(itemName)}</td>
            <td class="col-qty">${formatNumber(quantity)}</td>
            <td class="col-received">${formatNumber(receivedQty)}</td>
            <td class="col-remaining">${formatNumber(remainingQty)}</td>
            <td class="col-price">${formatNumber(unitPrice)}</td>
            <td class="col-amount">${formatNumber(amount)}</td>
            <td class="col-actions">
              ${remainingQty > 0 ? `
                <button type="button" class="btn-receive" data-po-number="${poNumber}" 
                        data-item-code="${itemCode}" data-row-index="${index}">
                  入庫登録
                </button>
              ` : '<span class="text-muted">完納済</span>'}
              <button type="button" class="btn-history" data-po-number="${poNumber}" 
                      data-item-code="${itemCode}">
                履歴
              </button>
            </td>
          </tr>
        `;
      });
    });

    html += `
        </tbody>
      </table>
    `;

    container.innerHTML = html;

    // ボタンイベントを設定
    attachTableEvents();
  }

  /**
   * テーブルのボタンイベントを設定
   */
  function attachTableEvents() {
    // 入庫登録ボタン
    document.querySelectorAll('.btn-receive').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const poNumber = e.target.dataset.poNumber;
        const itemCode = e.target.dataset.itemCode;
        const rowIndex = parseInt(e.target.dataset.rowIndex);
        openReceiveModal(poNumber, itemCode, rowIndex);
      });
    });

    // 履歴ボタン
    document.querySelectorAll('.btn-history').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const poNumber = e.target.dataset.poNumber;
        const itemCode = e.target.dataset.itemCode;
        openHistoryModal(poNumber, itemCode);
      });
    });
  }

  /**
   * ステータス情報を取得
   */
  function getStatusInfo(status, expectedDate) {
    const now = new Date();
    const isDelayed = expectedDate && new Date(expectedDate) < now;

    if (status === '未納品') {
      return {
        icon: isDelayed ? '🔴' : '⚪',
        class: isDelayed ? 'status-delayed' : 'status-not-delivered'
      };
    } else if (status === '一部納品') {
      return {
        icon: isDelayed ? '🟡' : '🟠',
        class: isDelayed ? 'status-partial-delayed' : 'status-partial'
      };
    } else if (status === '完納') {
      return {
        icon: '🟢',
        class: 'status-completed'
      };
    } else {
      return {
        icon: '⚪',
        class: 'status-unknown'
      };
    }
  }

  // =====================================================
  // 入庫登録モーダル
  // =====================================================
  
  /**
   * 入庫登録モーダルを開く
   */
  async function openReceiveModal(poNumber, itemCode, rowIndex) {
    try {
      console.log('[PO_DASHBOARD] 入庫登録モーダルを開く:', { poNumber, itemCode, rowIndex });

      // 発注レコードを取得
      const poRecord = state.filteredRecords.find(po => 
        po[CONFIG.FIELDS.PO.PO_NUMBER]?.value === poNumber
      ) || state.allPORecords.find(po => 
        po[CONFIG.FIELDS.PO.PO_NUMBER]?.value === poNumber
      );

      if (!poRecord) {
        throw new Error('発注レコードが見つかりません');
      }

      const items = poRecord[CONFIG.FIELDS.PO.PO_ITEMS]?.value || [];
      const item = items[rowIndex];

      if (!item) {
        throw new Error('発注明細が見つかりません');
      }

      // モーダルを表示
      showReceiveModal(poRecord, item);

    } catch (error) {
      console.error('[PO_DASHBOARD] 入庫登録モーダルエラー:', error);
      UTILS.showAlert('入庫登録モーダルの表示に失敗しました: ' + error.message, 'error');
    }
  }

  /**
   * 入庫登録モーダルを表示
   */
  async function showReceiveModal(poRecord, item) {
    // 既存モーダルを削除
    const existingModal = document.getElementById('receive-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // モーダル要素を作成
    const modal = document.createElement('div');
    modal.id = 'receive-modal';
    modal.className = 'modal';
    
    const poNumber = poRecord[CONFIG.FIELDS.PO.PO_NUMBER]?.value || '';
    const poDateFile = poRecord[CONFIG.FIELDS.PO.PO_DATE_FILE]?.value || '';
    const orderDate = poRecord[CONFIG.FIELDS.PO.ORDER_DATE]?.value || '';
    const supplier = poRecord[CONFIG.FIELDS.PO.SUPPLIER]?.value || '';
    
    const itemCode = item.value.item_code?.value || '';
    const itemName = item.value.item_name?.value || '';
    const quantity = parseFloat(item.value.quantity?.value || 0);
    const receivedQty = parseFloat(item.value.received_qty?.value || 0);
    const remainingQty = parseFloat(item.value.remaining_qty?.value || 0);
    const unitPrice = parseFloat(item.value.unit_price?.value || 0);
    const expectedDate = item.value.expected_received_date?.value || '';

    // 今日の日付をデフォルト値として取得
    const today = UTILS.formatDate(new Date(), 'YYYY-MM-DD');

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>📦 入庫登録</h3>
          <button type="button" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-section">
            <h4>発注情報（自動入力）</h4>
            <div class="form-row">
              <div class="form-group">
                <label>発注番号</label>
                <input type="text" value="${escapeHtml(poNumber)}" readonly>
              </div>
              <div class="form-group">
                <label>発注書番号</label>
                <input type="text" value="${escapeHtml(poDateFile)}" readonly>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>発注日</label>
                <input type="text" value="${orderDate}" readonly>
              </div>
              <div class="form-group">
                <label>納品予定日</label>
                <input type="text" value="${expectedDate}" readonly>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group full-width">
                <label>サプライヤー</label>
                <input type="text" value="${escapeHtml(supplier)}" readonly>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>品目コード</label>
                <input type="text" value="${escapeHtml(itemCode)}" readonly>
              </div>
              <div class="form-group">
                <label>品目名</label>
                <input type="text" value="${escapeHtml(itemName)}" readonly>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>発注数</label>
                <input type="text" value="${formatNumber(quantity)}" readonly>
              </div>
              <div class="form-group">
                <label>納品済数</label>
                <input type="text" value="${formatNumber(receivedQty)}" readonly>
              </div>
              <div class="form-group">
                <label class="label-remaining">発注残数</label>
                <input type="text" class="input-remaining" value="${formatNumber(remainingQty)}" readonly>
              </div>
            </div>
          </div>
          
          <div class="form-section">
            <h4>入庫情報（入力）※確定ステータスで登録されます</h4>
            <div class="form-row">
              <div class="form-group">
                <label class="required">入庫日</label>
                <input type="date" id="receive-date" value="${today}" required>
              </div>
              <div class="form-group">
                <label class="required">入庫数</label>
                <input type="number" id="receive-quantity" min="0.01" max="${remainingQty}" 
                       step="0.01" placeholder="入庫数を入力" required>
                <small class="field-hint">最大: ${formatNumber(remainingQty)}</small>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="required">倉庫</label>
                <select id="receive-warehouse" required>
                  <option value="">倉庫を選択...</option>
                </select>
              </div>
              <div class="form-group">
                <label class="required">ロケーション</label>
                <input type="text" id="receive-location" placeholder="倉庫選択後に自動入力" readonly>
                <small class="field-hint">倉庫マスタからルックアップ</small>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="required">単価</label>
                <input type="number" id="receive-unit-cost" min="0" step="0.01" 
                       value="${unitPrice}" placeholder="単価を入力" required>
              </div>
              <div class="form-group">
                <label>金額（自動計算）</label>
                <input type="text" id="receive-amount" value="0" readonly>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group full-width">
                <label>備考</label>
                <textarea id="receive-remarks" rows="3" placeholder="備考を入力（任意）"></textarea>
              </div>
            </div>
          </div>
          
          <div id="validation-message" class="validation-message"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel">キャンセル</button>
          <button type="button" class="btn-submit" id="btn-submit-receive">入庫登録</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 倉庫マスタから倉庫一覧を読み込み
    await loadWarehousesForModal();

    // イベントリスナー設定
    setupReceiveModalEvents(poNumber, itemCode, remainingQty);

    // モーダルを表示
    modal.style.display = 'flex';
  }

  /**
   * 倉庫マスタから倉庫一覧を読み込み
   */
  async function loadWarehousesForModal() {
    try {
      const warehouseSelect = document.getElementById('receive-warehouse');
      if (!warehouseSelect) return;

      // 倉庫マスタから取得
      const warehouses = await UTILS.getAllRecords(WAREHOUSE_MASTER_APP_ID);
      
      warehouses.forEach(wh => {
        const code = wh[CONFIG.FIELDS.WAREHOUSE_MASTER.CODE]?.value || '';
        const name = wh[CONFIG.FIELDS.WAREHOUSE_MASTER.NAME]?.value || '';
        
        if (code) {
          const option = document.createElement('option');
          option.value = code;
          option.textContent = `${code} - ${name}`;
          warehouseSelect.appendChild(option);
        }
      });

      console.log('[PO_DASHBOARD] 倉庫一覧を読み込みました:', warehouses.length);
    } catch (error) {
      console.error('[PO_DASHBOARD] 倉庫一覧の読み込みエラー:', error);
      UTILS.showAlert('倉庫一覧の読み込みに失敗しました', 'error');
    }
  }

  /**
   * 入庫登録モーダルのイベント設定
   */
  function setupReceiveModalEvents(poNumber, itemCode, remainingQty) {
    const modal = document.getElementById('receive-modal');

    // 閉じるボタン
    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });
    modal.querySelector('.btn-cancel').addEventListener('click', () => {
      modal.remove();
    });

    // モーダル外クリックで閉じる
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // 倉庫選択時にロケーションを自動取得
    document.getElementById('receive-warehouse').addEventListener('change', async (e) => {
      const warehouseCode = e.target.value;
      if (warehouseCode) {
        await loadLocationForWarehouse(warehouseCode);
      } else {
        document.getElementById('receive-location').value = '';
      }
    });

    // 入庫数・単価変更時に金額を自動計算
    document.getElementById('receive-quantity').addEventListener('input', calculateAmount);
    document.getElementById('receive-unit-cost').addEventListener('input', calculateAmount);

    // 登録ボタン
    document.getElementById('btn-submit-receive').addEventListener('click', async () => {
      await submitReceiveRecord(poNumber, itemCode, remainingQty);
    });
  }

  /**
   * 倉庫コードからロケーションを取得
   */
  async function loadLocationForWarehouse(warehouseCode) {
    try {
      // 倉庫マスタからロケーション情報を取得
      const query = `${CONFIG.FIELDS.WAREHOUSE_MASTER.CODE} = "${warehouseCode}"`;
      const records = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
        app: WAREHOUSE_MASTER_APP_ID,
        query: query
      });

      if (records.records.length > 0) {
        const warehouse = records.records[0];
        // ロケーションフィールドが存在する場合（※ユーザー確認待ち）
        const location = warehouse.location?.value || '';
        document.getElementById('receive-location').value = location;
        console.log('[PO_DASHBOARD] ロケーション取得:', location);
      }
    } catch (error) {
      console.error('[PO_DASHBOARD] ロケーション取得エラー:', error);
      UTILS.showAlert('ロケーションの取得に失敗しました', 'error');
    }
  }

  /**
   * 金額を自動計算
   */
  function calculateAmount() {
    const quantity = parseFloat(document.getElementById('receive-quantity').value || 0);
    const unitCost = parseFloat(document.getElementById('receive-unit-cost').value || 0);
    const amount = quantity * unitCost;
    document.getElementById('receive-amount').value = formatNumber(amount);
  }

  /**
   * 入庫レコードを登録
   */
  async function submitReceiveRecord(poNumber, itemCode, remainingQty) {
    try {
      // バリデーション
      const receiveDate = document.getElementById('receive-date').value;
      const quantity = parseFloat(document.getElementById('receive-quantity').value || 0);
      const warehouse = document.getElementById('receive-warehouse').value;
      const location = document.getElementById('receive-location').value;
      const unitCost = parseFloat(document.getElementById('receive-unit-cost').value || 0);
      const remarks = document.getElementById('receive-remarks').value;

      const validationMsg = document.getElementById('validation-message');

      if (!receiveDate) {
        validationMsg.textContent = '⚠️ 入庫日を入力してください';
        validationMsg.style.display = 'block';
        return;
      }
      if (quantity <= 0) {
        validationMsg.textContent = '⚠️ 入庫数は0より大きい値を入力してください';
        validationMsg.style.display = 'block';
        return;
      }
      if (quantity > remainingQty) {
        validationMsg.textContent = `⚠️ 入庫数が発注残数(${formatNumber(remainingQty)})を超えています`;
        validationMsg.style.display = 'block';
        return;
      }
      if (!warehouse) {
        validationMsg.textContent = '⚠️ 倉庫を選択してください';
        validationMsg.style.display = 'block';
        return;
      }
      if (!location) {
        validationMsg.textContent = '⚠️ ロケーションが取得できませんでした';
        validationMsg.style.display = 'block';
        return;
      }
      if (unitCost <= 0) {
        validationMsg.textContent = '⚠️ 単価は0より大きい値を入力してください';
        validationMsg.style.display = 'block';
        return;
      }

      validationMsg.style.display = 'none';

      // ローディング表示
      const submitBtn = document.getElementById('btn-submit-receive');
      submitBtn.disabled = true;
      submitBtn.textContent = '登録中...';

      // 在庫取引レコードを作成（ステータス: 確定）
      const transactionRecord = {
        [CONFIG.FIELDS.TRANSACTION.TRANSACTION_DATE]: { value: receiveDate },
        [CONFIG.FIELDS.TRANSACTION.TRANSACTION_TYPE]: { value: '入庫' },
        [CONFIG.FIELDS.TRANSACTION.STATUS]: { value: '確定' },  // 確定に変更
        [CONFIG.FIELDS.TRANSACTION.PO_NUMBER]: { value: poNumber },
        [CONFIG.FIELDS.TRANSACTION.ITEM_CODE]: { value: itemCode },
        [CONFIG.FIELDS.TRANSACTION.QUANTITY]: { value: quantity },
        [CONFIG.FIELDS.TRANSACTION.WAREHOUSE]: { value: warehouse },
        [CONFIG.FIELDS.TRANSACTION.LOCATION]: { value: location },
        [CONFIG.FIELDS.TRANSACTION.UNIT_COST]: { value: unitCost },
        [CONFIG.FIELDS.TRANSACTION.AMOUNT]: { value: quantity * unitCost },
        [CONFIG.FIELDS.TRANSACTION.REMARKS]: { value: remarks },
        [CONFIG.FIELDS.TRANSACTION.PROCESSED_FLAG]: { value: ['処理済み'] }  // 処理済みフラグをON
      };

      console.log('[PO_DASHBOARD] 在庫取引レコード作成:', transactionRecord);

      const resp = await kintone.api(kintone.api.url('/k/v1/record', true), 'POST', {
        app: TRANSACTION_APP_ID,
        record: transactionRecord
      });

      console.log('[PO_DASHBOARD] 在庫取引レコード作成成功:', resp);

      // モーダルを閉じる
      document.getElementById('receive-modal').remove();

      // ダッシュボードを更新
      await loadPOData();
      renderSummaryCards();
      renderPOTable();

      UTILS.showAlert('✅ 入庫レコードを登録しました', 'success');

    } catch (error) {
      console.error('[PO_DASHBOARD] 入庫レコード登録エラー:', error);
      UTILS.showAlert('入庫レコードの登録に失敗しました: ' + error.message, 'error');
      
      const submitBtn = document.getElementById('btn-submit-receive');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '入庫登録';
      }
    }
  }

  // =====================================================
  // 入庫履歴モーダル
  // =====================================================
  
  /**
   * 入庫履歴モーダルを開く
   */
  async function openHistoryModal(poNumber, itemCode) {
    try {
      console.log('[PO_DASHBOARD] 入庫履歴モーダルを開く:', { poNumber, itemCode });

      // ローディング表示
      UTILS.showLoading('入庫履歴を読み込み中...');

      // 在庫取引レコードを取得
      const query = `${CONFIG.FIELDS.TRANSACTION.PO_NUMBER} = "${poNumber}" and ` +
                   `${CONFIG.FIELDS.TRANSACTION.ITEM_CODE} = "${itemCode}" and ` +
                   `${CONFIG.FIELDS.TRANSACTION.TRANSACTION_TYPE} in ("入庫")`;
      
      const records = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
        app: TRANSACTION_APP_ID,
        query: query + ' order by transaction_date desc'
      });

      UTILS.hideLoading();

      console.log('[PO_DASHBOARD] 入庫履歴取得:', records.records.length);

      // モーダルを表示
      showHistoryModal(poNumber, itemCode, records.records);

    } catch (error) {
      UTILS.hideLoading();
      console.error('[PO_DASHBOARD] 入庫履歴モーダルエラー:', error);
      UTILS.showAlert('入庫履歴の取得に失敗しました: ' + error.message, 'error');
    }
  }

  /**
   * 入庫履歴モーダルを表示
   */
  function showHistoryModal(poNumber, itemCode, records) {
    // 既存モーダルを削除
    const existingModal = document.getElementById('history-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // 集計データ
    let confirmedQty = 0;
    let plannedQty = 0;

    records.forEach(rec => {
      const status = rec[CONFIG.FIELDS.TRANSACTION.STATUS]?.value || '';
      const qty = parseFloat(rec[CONFIG.FIELDS.TRANSACTION.QUANTITY]?.value || 0);
      
      if (status === '確定') {
        confirmedQty += qty;
      } else if (status === '予定') {
        plannedQty += qty;
      }
    });

    const totalQty = confirmedQty + plannedQty;

    // モーダル要素を作成
    const modal = document.createElement('div');
    modal.id = 'history-modal';
    modal.className = 'modal';

    let tableRows = '';
    records.forEach((rec, index) => {
      const transactionId = rec[CONFIG.FIELDS.TRANSACTION.TRANSACTION_ID]?.value || '';
      const transactionDate = rec[CONFIG.FIELDS.TRANSACTION.TRANSACTION_DATE]?.value || '';
      const status = rec[CONFIG.FIELDS.TRANSACTION.STATUS]?.value || '';
      const qty = parseFloat(rec[CONFIG.FIELDS.TRANSACTION.QUANTITY]?.value || 0);
      const warehouse = rec[CONFIG.FIELDS.TRANSACTION.WAREHOUSE]?.value || '';
      const location = rec[CONFIG.FIELDS.TRANSACTION.LOCATION]?.value || '';
      const unitCost = parseFloat(rec[CONFIG.FIELDS.TRANSACTION.UNIT_COST]?.value || 0);
      const amount = parseFloat(rec[CONFIG.FIELDS.TRANSACTION.AMOUNT]?.value || 0);
      const remarks = rec[CONFIG.FIELDS.TRANSACTION.REMARKS]?.value || '';

      const statusBadge = status === '確定' 
        ? '<span class="badge-confirmed">確定</span>' 
        : '<span class="badge-planned">予定</span>';

      tableRows += `
        <tr>
          <td>${index + 1}</td>
          <td>${transactionDate}</td>
          <td>${statusBadge}</td>
          <td class="text-right">${formatNumber(qty)}</td>
          <td>${escapeHtml(warehouse)}</td>
          <td>${escapeHtml(location)}</td>
          <td class="text-right">${formatNumber(unitCost)}</td>
          <td class="text-right">${formatNumber(amount)}</td>
          <td>${escapeHtml(remarks)}</td>
        </tr>
      `;
    });

    modal.innerHTML = `
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3>📋 入庫履歴</h3>
          <button type="button" class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="history-info">
            <div class="info-row">
              <div class="info-label">発注番号:</div>
              <div class="info-value">${escapeHtml(poNumber)}</div>
            </div>
            <div class="info-row">
              <div class="info-label">品目コード:</div>
              <div class="info-value">${escapeHtml(itemCode)}</div>
            </div>
          </div>
          
          <div class="history-summary">
            <div class="summary-item">
              <span class="summary-label">確定済:</span>
              <span class="summary-value">${formatNumber(confirmedQty)}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">予定:</span>
              <span class="summary-value">${formatNumber(plannedQty)}</span>
            </div>
            <div class="summary-item summary-total">
              <span class="summary-label">合計:</span>
              <span class="summary-value">${formatNumber(totalQty)}</span>
            </div>
          </div>

          ${records.length > 0 ? `
            <table class="history-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>入庫日</th>
                  <th>状態</th>
                  <th>数量</th>
                  <th>倉庫</th>
                  <th>ロケーション</th>
                  <th>単価</th>
                  <th>金額</th>
                  <th>備考</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          ` : `
            <div class="no-data">入庫履歴がありません</div>
          `}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel">閉じる</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // イベントリスナー設定
    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });
    modal.querySelector('.btn-cancel').addEventListener('click', () => {
      modal.remove();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // モーダルを表示
    modal.style.display = 'flex';
  }

  // =====================================================
  // データ取得関数
  // =====================================================
  
  /**
   * 発注データを読み込み
   */
  async function loadPOData() {
    try {
      console.log('[PO_DASHBOARD] 発注データ読み込み開始');
      
      UTILS.showLoading('発注データを読み込み中...');

      // 発注管理アプリから全レコード取得
      state.allPORecords = await UTILS.getAllRecords(PO_APP_ID);
      state.filteredRecords = state.allPORecords;

      console.log('[PO_DASHBOARD] 発注データ読み込み完了:', state.allPORecords.length);
      
      UTILS.hideLoading();
    } catch (error) {
      UTILS.hideLoading();
      console.error('[PO_DASHBOARD] 発注データ読み込みエラー:', error);
      throw error;
    }
  }

  // =====================================================
  // ユーティリティ関数
  // =====================================================
  
  /**
   * HTMLエスケープ
   */
  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * 数値フォーマット
   */
  function formatNumber(value) {
    if (value === null || value === undefined || value === '') return '0';
    return parseFloat(value).toLocaleString('ja-JP', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  // =====================================================
  // グローバル公開
  // =====================================================
  
  window.PODashboard = {
    VERSION: '1.2.0',
    state: state,
    loadPOData: loadPOData,
    applyFilters: applyFilters,
    clearFilters: clearFilters,
    renderPOTable: renderPOTable
  };

  console.log('[PO_DASHBOARD] モジュール初期化完了');

})();
                         