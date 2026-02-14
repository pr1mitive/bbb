/**
 * 発注管理システム - スタイル定義 (ERP連携対応版)
 * 
 * カスタマイズ一覧画面・案件配分モーダルのCSS
 * 
 * 【更新履歴】
 * 2026-02-14: 案件配分モーダル用スタイルを追加
 * 2026-02-14: addCustomCSS関数をグローバルに公開
 */

(function() {
  'use strict';
  
  const CONFIG = window.PO_CONFIG;
  
  const css = `
    /* ========================================
       案件配分モーダル用スタイル
       ======================================== */
    
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease-in-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .modal-content {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 650px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from { 
        opacity: 0;
        transform: translateY(-30px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .modal-content h3 {
      margin-top: 0;
      margin-bottom: 16px;
      font-size: 18px;
      color: ${CONFIG.UI.COLORS.DARK};
      border-bottom: 2px solid ${CONFIG.UI.COLORS.PRIMARY};
      padding-bottom: 8px;
    }
    
    .allocation-summary {
      background: ${CONFIG.UI.COLORS.LIGHT};
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 16px;
      border-left: 4px solid ${CONFIG.UI.COLORS.PRIMARY};
    }
    
    .allocation-summary p {
      margin: 6px 0;
      font-size: 14px;
      color: ${CONFIG.UI.COLORS.DARK};
    }
    
    .allocation-summary strong {
      font-size: 16px;
      color: ${CONFIG.UI.COLORS.PRIMARY};
    }
    
    .allocation-table-container {
      margin-bottom: 16px;
      max-height: 350px;
      overflow-y: auto;
      border: 1px solid ${CONFIG.UI.COLORS.BORDER};
      border-radius: 4px;
    }
    
    .allocation-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    
    .allocation-table th {
      background: ${CONFIG.UI.COLORS.PRIMARY};
      color: white;
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
      position: sticky;
      top: 0;
      z-index: 1;
      border-bottom: 2px solid ${CONFIG.UI.COLORS.DARK};
    }
    
    .allocation-table td {
      padding: 8px;
      border-bottom: 1px solid ${CONFIG.UI.COLORS.BORDER};
      vertical-align: middle;
    }
    
    .allocation-table tbody tr:hover {
      background: #f8f9fa;
    }
    
    .allocation-table input.form-input {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid ${CONFIG.UI.COLORS.BORDER};
      border-radius: 4px;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    
    .allocation-table input.form-input:focus {
      outline: none;
      border-color: ${CONFIG.UI.COLORS.PRIMARY};
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    }
    
    .modal-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-start;
      flex-wrap: wrap;
      padding-top: 12px;
      border-top: 1px solid ${CONFIG.UI.COLORS.BORDER};
    }
    
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      padding: 4px 8px;
      transition: opacity 0.2s, transform 0.1s;
      color: ${CONFIG.UI.COLORS.DANGER};
    }
    
    .btn-icon:hover {
      opacity: 0.7;
      transform: scale(1.1);
    }
    
    .btn-icon:active {
      transform: scale(0.95);
    }
    
    .btn-primary {
      background: ${CONFIG.UI.COLORS.PRIMARY};
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s, transform 0.1s;
    }
    
    .btn-primary:hover {
      background: #2980b9;
    }
    
    .btn-primary:active {
      transform: scale(0.98);
    }
    
    .btn-secondary {
      background: ${CONFIG.UI.COLORS.SECONDARY};
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s, transform 0.1s;
    }
    
    .btn-secondary:hover {
      background: #7f8c8d;
    }
    
    .btn-secondary:active {
      transform: scale(0.98);
    }
    
    /* 案件配分ボタンのハイライト表示 */
    .has-allocation {
      background: ${CONFIG.UI.COLORS.SUCCESS} !important;
      color: white !important;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(39, 174, 96, 0.3);
    }
    
    .has-allocation:hover {
      background: #229954 !important;
    }
    
    /* ========================================
       既存のカスタムビュースタイル
       ======================================== */
    
    /* レイアウト */
    .po-container {
      max-width: 1400px;
      margin: 20px auto;
      padding: 0 20px;
    }
    
    .po-section {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .po-section-title {
      font-size: 18px;
      font-weight: 600;
      color: ${CONFIG.UI.COLORS.DARK};
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${CONFIG.UI.COLORS.PRIMARY};
    }
    
    /* グリッドレイアウト */
    .po-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .po-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .po-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    
    .po-grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    
    /* フォーム要素 */
    .po-form-group {
      margin-bottom: 16px;
    }
    
    .po-label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: ${CONFIG.UI.COLORS.DARK};
      margin-bottom: 6px;
    }
    
    .po-label-required::after {
      content: ' *';
      color: ${CONFIG.UI.COLORS.DANGER};
    }
    
    .po-input,
    .po-select,
    .po-textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid ${CONFIG.UI.COLORS.BORDER};
      border-radius: 4px;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    
    .po-input:focus,
    .po-select:focus,
    .po-textarea:focus {
      outline: none;
      border-color: ${CONFIG.UI.COLORS.PRIMARY};
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
    }
    
    .po-input-sm {
      padding: 6px 8px;
      font-size: 13px;
    }
    
    .po-input-number {
      text-align: right;
    }
    
    .po-textarea {
      resize: vertical;
      min-height: 80px;
    }
    
    .po-textarea-sm {
      min-height: 50px;
    }
    
    .po-input-group-compact {
      display: flex;
      gap: 4px;
    }
    
    /* テーブル */
    .po-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      background: white;
    }
    
    .po-table th {
      background: ${CONFIG.UI.COLORS.PRIMARY};
      color: white;
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
      white-space: nowrap;
    }
    
    .po-table td {
      padding: 8px;
      border-bottom: 1px solid ${CONFIG.UI.COLORS.BORDER};
      vertical-align: middle;
    }
    
    .po-table tbody tr:hover {
      background: #f8f9fa;
    }
    
    .po-cell-center {
      text-align: center;
    }
    
    .po-cell-right {
      text-align: right;
    }
    
    /* ボタン */
    .po-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
    }
    
    .po-btn:hover {
      transform: translateY(-1px);
    }
    
    .po-btn:active {
      transform: translateY(0);
    }
    
    .po-btn-primary {
      background: ${CONFIG.UI.COLORS.PRIMARY};
      color: white;
    }
    
    .po-btn-primary:hover {
      background: #2980b9;
    }
    
    .po-btn-secondary {
      background: ${CONFIG.UI.COLORS.SECONDARY};
      color: white;
    }
    
    .po-btn-secondary:hover {
      background: #7f8c8d;
    }
    
    .po-btn-danger {
      background: ${CONFIG.UI.COLORS.DANGER};
      color: white;
    }
    
    .po-btn-danger:hover {
      background: #c0392b;
    }
    
    .po-btn-success {
      background: ${CONFIG.UI.COLORS.SUCCESS};
      color: white;
    }
    
    .po-btn-success:hover {
      background: #229954;
    }
    
    .po-btn-sm {
      padding: 6px 12px;
      font-size: 13px;
    }
    
    .po-btn-icon {
      padding: 6px 10px;
      font-size: 16px;
    }
    
    .po-btn-block {
      width: 100%;
    }
    
    /* アクションボタングループ */
    .po-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid ${CONFIG.UI.COLORS.BORDER};
    }
    
    /* ローディング */
    .po-loading {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }
    
    .po-loading-content {
      background: white;
      padding: 30px 40px;
      border-radius: 8px;
      text-align: center;
    }
    
    .po-spinner {
      border: 4px solid ${CONFIG.UI.COLORS.LIGHT};
      border-top: 4px solid ${CONFIG.UI.COLORS.PRIMARY};
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* アラート */
    .po-alert {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10001;
      animation: slideInRight 0.3s ease-out;
      max-width: 400px;
    }
    
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    .po-alert-success {
      background: ${CONFIG.UI.COLORS.SUCCESS};
      color: white;
    }
    
    .po-alert-error {
      background: ${CONFIG.UI.COLORS.DANGER};
      color: white;
    }
    
    .po-alert-warning {
      background: ${CONFIG.UI.COLORS.WARNING};
      color: white;
    }
    
    .po-alert-info {
      background: ${CONFIG.UI.COLORS.INFO};
      color: white;
    }
    
    /* サマリー */
    .po-summary {
      background: ${CONFIG.UI.COLORS.LIGHT};
      padding: 16px;
      border-radius: 8px;
    }
    
    .po-summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    
    .po-summary-row-total {
      font-size: 18px;
      font-weight: 700;
      color: ${CONFIG.UI.COLORS.PRIMARY};
      border-top: 2px solid ${CONFIG.UI.COLORS.BORDER};
      padding-top: 12px;
      margin-top: 8px;
    }
    
    /* モーダル系 */
    .po-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    }
    
    .po-modal-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
    }
    
    .po-modal-lg {
      max-width: 900px;
    }
    
    .po-modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid ${CONFIG.UI.COLORS.BORDER};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .po-modal-header h3 {
      margin: 0;
      font-size: 18px;
      color: ${CONFIG.UI.COLORS.DARK};
    }
    
    .po-modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: ${CONFIG.UI.COLORS.SECONDARY};
      padding: 0;
      width: 30px;
      height: 30px;
      line-height: 1;
    }
    
    .po-modal-close:hover {
      color: ${CONFIG.UI.COLORS.DANGER};
    }
    
    .po-modal-body {
      padding: 20px;
      overflow-y: auto;
    }
    
    .po-search-box {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    
    .po-search-results {
      max-height: 400px;
      overflow-y: auto;
    }
    
    /* ユーティリティ */
    .po-text-muted {
      color: ${CONFIG.UI.COLORS.SECONDARY};
    }
    
    .po-text-right {
      text-align: right;
    }
    
    .po-text-center {
      text-align: center;
    }
    
    .po-mb-0 { margin-bottom: 0; }
    .po-mb-1 { margin-bottom: 8px; }
    .po-mb-2 { margin-bottom: 16px; }
    .po-mb-3 { margin-bottom: 24px; }
    
    .po-mt-0 { margin-top: 0; }
    .po-mt-1 { margin-top: 8px; }
    .po-mt-2 { margin-top: 16px; }
    .po-mt-3 { margin-top: 24px; }
    
    /* レスポンシブ */
    @media (max-width: 1200px) {
      .po-grid-4 {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    @media (max-width: 768px) {
      .po-grid,
      .po-grid-2,
      .po-grid-3,
      .po-grid-4 {
        grid-template-columns: 1fr;
      }
      
      .po-actions {
        flex-direction: column;
      }
      
      .po-btn {
        width: 100%;
      }
      
      .modal-content {
        width: 95%;
        padding: 16px;
      }
    }
  `;
  
  /**
   * CSSをページに追加する関数
   * customView_part1.jsから呼び出される
   */
  window.addCustomCSS = function() {
    // 既に追加済みかチェック
    if (document.getElementById('po-custom-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'po-custom-styles';
    style.textContent = css;
    document.head.appendChild(style);
    
    if (CONFIG.DEBUG) {
      console.log('[スタイル] CSSを読み込みました (ERP連携対応版)');
    }
  };
  
  // 自動実行はしない（customView_part1.jsから呼ばれるため）
  
})();
