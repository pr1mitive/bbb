/**
 * 発注管理システム - カスタマイズ一覧画面
 * 
 * 一覧画面に発注入力フォームを表示
 */

(function() {
  'use strict';
  
  const CONFIG = window.PO_CONFIG;
  const Utils = window.PO_Utils;
  const MasterData = window.PO_MasterData;
  const Calculator = window.PO_Calculator;
  
  // 一覧画面表示イベント
  kintone.events.on('app.record.index.show', async function(event) {
    
    // カスタムビュー判定
    if (event.viewId !== CONFIG.CUSTOM_VIEW_ID) {
      return event;
    }
    
    Utils.log('カスタマイズ一覧画面表示開始');
    
    try {
      // ローディング表示
      Utils.showLoading('マスタデータ読み込み中...');
      
      // 既存の一覧を非表示
      const listElement = kintone.app.getHeaderMenuSpaceElement();
      if (listElement) {
        listElement.style.display = 'none';
      }
      
      // カスタムフォームを表示
      const appElement = kintone.app.getHeaderSpaceElement();
      appElement.innerHTML = createCustomFormHTML();
      
      // CSSを追加
      addCustomCSS();
      
      // マスタデータ読み込み
      await MasterData.loadAll();
      
      // ドロップダウン設定
      setupDropdowns();
      
      // イベントリスナー設定
      attachEventListeners();
      
      // 初期明細行を1行追加 (関数が定義されるまで最大10秒リトライ)
      function tryAddItemRow(attempt) {
        attempt = attempt || 0;
        if (typeof window.addItemRow === 'function') {
          console.log('[PO] addItemRow found, adding initial row');
          window.addItemRow();
        } else {
          if (attempt < 20) { // 最大20回 (20 × 500ms = 10秒)
            console.warn('[PO] addItemRow not defined at attempt ' + attempt + ', retrying in 500ms');
            setTimeout(function() { tryAddItemRow(attempt + 1); }, 500);
          } else {
            console.error('[PO] FATAL: addItemRow not defined after 10 seconds');
            alert('エラー: 明細行追加機能が読み込まれませんでした。\nページを再読み込みしてください。');
          }
        }
      }
      tryAddItemRow(0);
      
      Utils.hideLoading();
      Utils.log('カスタマイズ一覧画面表示完了');
      
    } catch (error) {
      Utils.hideLoading();
      Utils.error('カスタマイズ一覧画面表示エラー', error);
      Utils.showAlert('画面の初期化に失敗しました。ページを再読み込みしてください。', 'error');
    }
    
    return event;
  });
  
  /**
   * カスタムフォームHTMLを生成
   * @returns {string} HTML文字列
   */
  function createCustomFormHTML() {
    return `
      <div class="po-custom-form">
        <div class="po-form-header">
          <h2 class="po-form-title">📝 新規発注登録</h2>
        </div>
        
        <!-- 基本情報セクション -->
        <div class="po-section">
          <h3 class="po-section-title">基本情報</h3>
          <div class="po-form-content">
            <div class="po-form-row">
              <div class="po-form-group">
                <label class="po-label">発注元 <span class="po-required">*</span></label>
                <select id="supplier" class="po-select" required>
                  <option value="">選択してください</option>
                </select>
              </div>
              <div class="po-form-group">
                <label class="po-label">発注先 <span class="po-required">*</span></label>
                <div class="po-input-group">
                  <select id="vendor" class="po-select" required>
                    <option value="">選択してください</option>
                  </select>
                  <button type="button" id="btnQuoteRef" class="po-btn po-btn-secondary" disabled>
                    見積参照
                  </button>
                </div>
              </div>
            </div>
            
            <div class="po-form-row">
              <div class="po-form-group">
                <label class="po-label">発注日 <span class="po-required">*</span></label>
                <input type="date" id="poDate" class="po-input" value="${Utils.getTodayDate()}" required>
              </div>
              <div class="po-form-group">
                <label class="po-label">件名 <span class="po-required">*</span></label>
                <input type="text" id="subject" class="po-input" placeholder="発注内容を入力" required>
              </div>
            </div>
            
            <div class="po-form-row">
              <div class="po-form-group">
                <label class="po-label">通貨 <span class="po-required">*</span></label>
                <select id="currency" class="po-select" required>
                  <option value="">選択してください</option>
                </select>
              </div>
              <div class="po-form-group">
                <label class="po-label">参考為替レート</label>
                <input type="number" id="exchangeRate" class="po-input" step="0.01" min="0" placeholder="円貨以外の場合に入力">
              </div>
              <div class="po-form-group">
                <label class="po-label">税コード <span class="po-required">*</span></label>
                <select id="taxCode" class="po-select" required>
                  <option value="">選択してください</option>
                </select>
              </div>
            </div>
            
            <div class="po-form-row">
              <div class="po-form-group po-full-width">
                <label class="po-label">契約文言</label>
                <textarea id="contractTerms" class="po-textarea" rows="3" placeholder="契約条件を入力"></textarea>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 発注内訳セクション -->
        <div class="po-section">
          <div class="po-section-header">
            <h3 class="po-section-title">発注内訳</h3>
            <button type="button" id="btnBulkImport" class="po-btn po-btn-secondary" disabled>
              📋 見積から一括取込
            </button>
          </div>
          
          <div class="po-table-wrapper">
            <table class="po-items-table" id="itemsTable">
              <thead>
                <tr>
                  <th style="width:40px">No</th>
                  <th style="width:150px">アイテムコード</th>
                  <th style="width:150px">アイテム名 <span class="po-required">*</span></th>
                  <th style="width:200px">詳細項目</th>
                  <th style="width:100px">単価 <span class="po-required">*</span></th>
                  <th style="width:80px">数量 <span class="po-required">*</span></th>
                  <th style="width:60px">単位</th>
                  <th style="width:120px">金額</th>
                  <th style="width:120px">案件</th>
                  <th style="width:60px">操作</th>
                </tr>
              </thead>
              <tbody id="itemsBody">
                <!-- 明細行が動的に追加される -->
              </tbody>
            </table>
          </div>
          
          <div class="po-items-footer">
            <button type="button" id="btnAddItem" class="po-btn po-btn-success">
              ➕ 明細行追加
            </button>
            <div class="po-item-count">
              明細行数: <span id="itemCount" class="po-count-number">0</span> / ${CONFIG.MAX_ITEMS}
            </div>
          </div>
        </div>
        
        <!-- 金額サマリーセクション -->
        <div class="po-section">
          <h3 class="po-section-title">金額サマリー</h3>
          <div class="po-summary-content">
            <table class="po-summary-table">
              <tbody>
                <tr>
                  <th>小計:</th>
                  <td>
                    <span id="subtotal" class="po-summary-value" data-value="0">0.00</span>
                    <span id="currencySymbol" class="po-currency-symbol"></span>
                  </td>
                </tr>
                <tr>
                  <th>税額:</th>
                  <td>
                    <span id="taxAmount" class="po-summary-value" data-value="0">0.00</span>
                    <span id="currencySymbol2" class="po-currency-symbol"></span>
                  </td>
                </tr>
                <tr class="po-total-row">
                  <th>総合計:</th>
                  <td>
                    <span id="total" class="po-summary-value" data-value="0">0.00</span>
                    <span id="currencySymbol3" class="po-currency-symbol"></span>
                  </td>
                </tr>
                <tr id="totalJpyRow" style="display:none">
                  <th>円貨換算:</th>
                  <td>
                    <span id="totalJpy" class="po-summary-value" data-value="0">0</span> 円
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- アクションボタン -->
        <div class="po-action-buttons">
          <button type="button" id="btnCancel" class="po-btn po-btn-secondary">
            ${CONFIG.UI.BUTTON_TEXT.CANCEL}
          </button>
          <button type="button" id="btnSaveDraft" class="po-btn po-btn-secondary">
            ${CONFIG.UI.BUTTON_TEXT.SAVE_DRAFT}
          </button>
          <button type="button" id="btnSubmit" class="po-btn po-btn-primary">
            ${CONFIG.UI.BUTTON_TEXT.SUBMIT}
          </button>
        </div>
      </div>
      
      <!-- モーダル: アイテム検索 -->
      <div id="modalItemSearch" class="po-modal">
        <div class="po-modal-content">
          <div class="po-modal-header">
            <h3 class="po-modal-title">🔍 アイテム検索</h3>
            <span class="po-modal-close">&times;</span>
          </div>
          <div class="po-modal-body">
            <div class="po-search-box">
              <input type="text" id="itemSearchQuery" class="po-input" placeholder="アイテムコードまたは名称で検索">
              <button type="button" id="btnItemSearch" class="po-btn po-btn-primary">${CONFIG.UI.BUTTON_TEXT.SEARCH}</button>
            </div>
            <div id="itemSearchResults" class="po-search-results"></div>
          </div>
        </div>
      </div>
      
      <!-- モーダル: 案件選択 -->
      <div id="modalProjectSelect" class="po-modal">
        <div class="po-modal-content">
          <div class="po-modal-header">
            <h3 class="po-modal-title">📊 案件選択</h3>
            <span class="po-modal-close">&times;</span>
          </div>
          <div class="po-modal-body">
            <div class="po-search-box">
              <input type="text" id="projectSearchQuery" class="po-input" placeholder="案件番号で検索">
              <button type="button" id="btnProjectSearch" class="po-btn po-btn-primary">${CONFIG.UI.BUTTON_TEXT.SEARCH}</button>
            </div>
            <div id="projectSearchResults" class="po-search-results"></div>
          </div>
          <div class="po-modal-footer">
            <button type="button" id="btnProjectConfirm" class="po-btn po-btn-primary">${CONFIG.UI.BUTTON_TEXT.CONFIRM}</button>
          </div>
        </div>
      </div>
      
      <!-- モーダル: 見積参照 -->
      <div id="modalQuoteRef" class="po-modal">
        <div class="po-modal-content po-modal-large">
          <div class="po-modal-header">
            <h3 class="po-modal-title">📋 見積参照</h3>
            <span class="po-modal-close">&times;</span>
          </div>
          <div class="po-modal-body">
            <div class="po-search-box">
              <input type="text" id="quoteSearchQuery" class="po-input" placeholder="見積番号または商品名で検索">
              <button type="button" id="btnQuoteSearch" class="po-btn po-btn-primary">${CONFIG.UI.BUTTON_TEXT.SEARCH}</button>
            </div>
            <div id="quoteSearchResults" class="po-search-results"></div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * ドロップダウン設定
   */
  function setupDropdowns() {
    // 発注元
    Utils.populateSelect(
      'supplier',
      MasterData.getSuppliers(),
      CONFIG.FIELDS.BASIC_INFO.CODE,
      CONFIG.FIELDS.BASIC_INFO.NAME
    );
    
    // 発注先
    Utils.populateSelect(
      'vendor',
      MasterData.getVendors(),
      CONFIG.FIELDS.VENDOR.CODE,
      CONFIG.FIELDS.VENDOR.NAME
    );
    
    // 通貨
    Utils.populateSelect(
      'currency',
      MasterData.getCurrencies(),
      CONFIG.FIELDS.BASIC_INFO.CURRENCY_CODE,
      CONFIG.FIELDS.BASIC_INFO.NAME
    );
    
    // 税コード
    Utils.populateSelect(
      'taxCode',
      MasterData.getTaxCodes(),
      CONFIG.FIELDS.BASIC_INFO.CODE,
      CONFIG.FIELDS.BASIC_INFO.NAME
    );
  }
  
  /**
   * イベントリスナー設定
   */
  function attachEventListeners() {
    // 発注先選択時
    document.getElementById('vendor').addEventListener('change', onVendorChange);
    
    // 通貨選択時
    document.getElementById('currency').addEventListener('change', onCurrencyChange);
    
    // 税コード選択時
    document.getElementById('taxCode').addEventListener('change', onTaxCodeChange);
    
    // 為替レート入力時
    document.getElementById('exchangeRate').addEventListener('input', () => {
      Calculator.calculateTotal();
    });
    
    // 明細行追加ボタン
    document.getElementById('btnAddItem').addEventListener('click', function() { if (typeof window.addItemRow === 'function') { window.addItemRow(); } else { alert('エラー: 明細行追加機能が利用できません'); } });
    
    // 見積参照ボタン
    document.getElementById('btnQuoteRef').addEventListener('click', function() { if (typeof window.openQuoteModal === 'function') { window.openQuoteModal(); } else { alert('エラー: 見積参照機能が利用できません'); } });
    
    // 見積一括取込ボタン
    document.getElementById('btnBulkImport').addEventListener('click', function() { if (typeof window.openQuoteModal === 'function') { window.openQuoteModal(); } else { alert('エラー: 見積参照機能が利用できません'); } });
    
    // 登録ボタン
    document.getElementById('btnSubmit').addEventListener('click', () => submitRecord(false));
    
    // 下書き保存ボタン
    document.getElementById('btnSaveDraft').addEventListener('click', () => submitRecord(true));
    
    // キャンセルボタン
    document.getElementById('btnCancel').addEventListener('click', onCancel);
    
    // モーダル閉じるボタン
    document.querySelectorAll('.po-modal-close').forEach(closeBtn => {
      closeBtn.addEventListener('click', function() {
        this.closest('.po-modal').style.display = 'none';
      });
    });
    
    // モーダル外クリックで閉じる
    window.addEventListener('click', function(event) {
      if (event.target.classList.contains('po-modal')) {
        event.target.style.display = 'none';
      }
    });
  }
  
  /**
   * 発注先変更イベント
   */
  function onVendorChange() {
    const vendor = this.value;
    const btnQuoteRef = document.getElementById('btnQuoteRef');
    const btnBulkImport = document.getElementById('btnBulkImport');
    
    if (vendor) {
      btnQuoteRef.disabled = false;
      btnBulkImport.disabled = false;
    } else {
      btnQuoteRef.disabled = true;
      btnBulkImport.disabled = true;
    }
  }
  
  /**
   * 通貨変更イベント
   */
  function onCurrencyChange() {
    const record = Utils.getSelectedRecord('currency');
    if (!record) return;
    
    const symbol = Utils.getFieldValue(record, CONFIG.FIELDS.BASIC_INFO.CURRENCY_SYMBOL);
    const currencyCode = Utils.getFieldValue(record, CONFIG.FIELDS.BASIC_INFO.CURRENCY_CODE);
    
    // 通貨記号を更新
    Calculator.updateCurrencySymbols(symbol);
    
    // 円貨換算の表示制御
    const exchangeRateInput = document.getElementById('exchangeRate');
    const totalJpyRow = document.getElementById('totalJpyRow');
    
    if (currencyCode === CONFIG.CURRENCY_CODES.JPY) {
      totalJpyRow.style.display = 'none';
      exchangeRateInput.disabled = true;
      exchangeRateInput.value = '';
    } else {
      exchangeRateInput.disabled = false;
    }
    
    Calculator.calculateTotal();
  }
  
  /**
   * 税コード変更イベント
   */
  function onTaxCodeChange() {
    const record = Utils.getSelectedRecord('taxCode');
    if (!record) return;
    
    const taxRate = Utils.getFieldValue(record, CONFIG.FIELDS.BASIC_INFO.TAX_RATE);
    
    // 税率をdata属性に保存(計算用)
    this.dataset.taxRate = taxRate;
    
    Calculator.calculateTotal();
  }
  
  /**
   * キャンセルボタンクリック
   */
  function onCancel() {
    if (Utils.confirm(CONFIG.UI.MESSAGES.CONFIRM_CANCEL)) {
      location.reload();
    }
  }
  
  // 他の関数は次のファイル(customView_part2.js)に続く
  
})(
);
