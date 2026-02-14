/**
 * 発注管理システム - ユーティリティ関数
 * 
 * 共通で使用する関数を定義
 */

(function(window) {
  'use strict';
  
  const CONFIG = window.PO_CONFIG;
  
  const Utils = {
    
    /**
     * kintone REST API を使用してレコードを取得
     * @param {string} appId - アプリID
     * @param {string} query - クエリ文字列
     * @param {Array} fields - 取得するフィールド(省略時は全フィールド)
     * @returns {Promise<Array>} レコード配列
     */
    async fetchRecords(appId, query = '', fields = []) {
      try {
        const body = {
          app: appId,
          query: query,
          totalCount: true
        };
        
        if (fields.length > 0) {
          body.fields = fields;
        }
        
        const resp = await kintone.api(
          kintone.api.url('/k/v1/records', true),
          'GET',
          body
        );
        
        this.log(`レコード取得成功: アプリID=${appId}, 件数=${resp.records.length}`);
        return resp.records;
        
      } catch (error) {
        this.error(`レコード取得エラー: アプリID=${appId}`, error);
        throw error;
      }
    },
    
    /**
     * kintone REST API を使用してレコードを登録
     * @param {string} appId - アプリID
     * @param {Object} record - レコードデータ
     * @returns {Promise<Object>} レスポンス(id, revision)
     */
    async createRecord(appId, record) {
      try {
        const resp = await kintone.api(
          kintone.api.url('/k/v1/record', true),
          'POST',
          {
            app: appId,
            record: record
          }
        );
        
        this.log(`レコード登録成功: アプリID=${appId}, レコードID=${resp.id}`);
        return resp;
        
      } catch (error) {
        this.error(`レコード登録エラー: アプリID=${appId}`, error);
        throw error;
      }
    },
    
    /**
     * kintone REST API を使用してレコードを更新
     * @param {string} appId - アプリID
     * @param {string} recordId - レコードID
     * @param {Object} record - 更新するレコードデータ
     * @param {number} revision - リビジョン番号
     * @returns {Promise<Object>} レスポンス
     */
    async updateRecord(appId, recordId, record, revision = -1) {
      try {
        const resp = await kintone.api(
          kintone.api.url('/k/v1/record', true),
          'PUT',
          {
            app: appId,
            id: recordId,
            record: record,
            revision: revision
          }
        );
        
        this.log(`レコード更新成功: アプリID=${appId}, レコードID=${recordId}`);
        return resp;
        
      } catch (error) {
        this.error(`レコード更新エラー: アプリID=${appId}, レコードID=${recordId}`, error);
        throw error;
      }
    },
    
    /**
     * 今日の日付を取得(YYYY-MM-DD形式)
     * @returns {string} 今日の日付
     */
    getTodayDate() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    /**
     * 日付フォーマット変換(YYYY-MM-DD → YYYY/MM/DD)
     * @param {string} dateStr - 日付文字列
     * @returns {string} フォーマット後の日付
     */
    formatDate(dateStr) {
      if (!dateStr) return '';
      return dateStr.replace(/-/g, '/');
    },
    
    /**
     * 数値フォーマット(カンマ区切り)
     * @param {number} num - 数値
     * @param {number} decimals - 小数点以下桁数(デフォルト2)
     * @returns {string} フォーマット後の数値
     */
    formatNumber(num, decimals = 2) {
      if (isNaN(num) || num === null || num === undefined) return '0';
      return Number(num).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    /**
     * 数値パース(カンマ削除)
     * @param {string} str - 数値文字列
     * @returns {number} パース後の数値
     */
    parseNumber(str) {
      if (!str) return 0;
      const cleaned = String(str).replace(/,/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    },
    
    /**
     * セレクトボックスにオプションを追加
     * @param {string} elementId - セレクトボックスのID
     * @param {Array} records - レコード配列
     * @param {string} valueField - value属性に設定するフィールド
     * @param {string} textField - 表示テキストに設定するフィールド
     */
    populateSelect(elementId, records, valueField, textField) {
      const select = document.getElementById(elementId);
      if (!select) {
        this.warn(`セレクトボックスが見つかりません: ${elementId}`);
        return;
      }
      
      // 既存のオプションをクリア(最初の空オプションは残す)
      while (select.options.length > 1) {
        select.remove(1);
      }
      
      records.forEach(record => {
        const option = document.createElement('option');
        option.value = this.getFieldValue(record, valueField);
        option.textContent = this.getFieldValue(record, textField);
        option.dataset.record = JSON.stringify(record);
        select.appendChild(option);
      });
      
      this.log(`セレクトボックス設定完了: ${elementId}, 件数=${records.length}`);
    },
    
    /**
     * レコードからフィールド値を取得
     * @param {Object} record - レコード
     * @param {string} fieldCode - フィールドコード
     * @returns {*} フィールド値
     */
    getFieldValue(record, fieldCode) {
      if (!record || !record[fieldCode]) return '';
      return record[fieldCode].value || '';
    },
    
    /**
     * セレクトボックスから選択されたレコードを取得
     * @param {string} elementId - セレクトボックスのID
     * @returns {Object|null} 選択されたレコード
     */
    getSelectedRecord(elementId) {
      const select = document.getElementById(elementId);
      if (!select || !select.value) return null;
      
      const selectedOption = select.options[select.selectedIndex];
      if (!selectedOption || !selectedOption.dataset.record) return null;
      
      try {
        return JSON.parse(selectedOption.dataset.record);
      } catch (error) {
        this.error('レコードデータのパースエラー', error);
        return null;
      }
    },
    
    /**
     * エスケープHTML
     * @param {string} text - テキスト
     * @returns {string} エスケープ後のテキスト
     */
    escapeHtml(text) {
      if (!text) return '';
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return String(text).replace(/[&<>"']/g, m => map[m]);
    },
    
    /**
     * 発注番号を生成(PO-YYYYMMDD-001形式)
     * @returns {Promise<string>} 発注番号
     */
    async generatePoNumber() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;
      
      try {
        // 同日の最大連番を取得
        const query = `${CONFIG.FIELDS.PO.NUMBER} like "${CONFIG.PO_NUMBER_PREFIX}${dateStr}-"`;
        const records = await this.fetchRecords(CONFIG.APP_IDS.PO_MANAGEMENT, query, [CONFIG.FIELDS.PO.NUMBER]);
        
        let maxSeq = 0;
        records.forEach(record => {
          const poNumber = this.getFieldValue(record, CONFIG.FIELDS.PO.NUMBER);
          const match = poNumber.match(/-(\d+)$/);
          if (match) {
            const seq = parseInt(match[1], 10);
            if (seq > maxSeq) maxSeq = seq;
          }
        });
        
        const newSeq = String(maxSeq + 1).padStart(3, '0');
        return `${CONFIG.PO_NUMBER_PREFIX}${dateStr}-${newSeq}`;
        
      } catch (error) {
        this.error('発注番号生成エラー', error);
        // エラー時はタイムスタンプを使用
        return `${CONFIG.PO_NUMBER_PREFIX}${dateStr}-${Date.now().toString().slice(-3)}`;
      }
    },
    
    /**
     * ローディング表示
     * @param {string} message - メッセージ
     */
    showLoading(message = '処理中...') {
      let loader = document.getElementById('po-loader');
      if (!loader) {
        loader = document.createElement('div');
        loader.id = 'po-loader';
        loader.className = 'po-loader';
        loader.innerHTML = `
          <div class="po-loader-content">
            <div class="po-spinner"></div>
            <p class="po-loader-message">${this.escapeHtml(message)}</p>
          </div>
        `;
        document.body.appendChild(loader);
      } else {
        loader.querySelector('.po-loader-message').textContent = message;
      }
      loader.style.display = 'flex';
    },
    
    /**
     * ローディング非表示
     */
    hideLoading() {
      const loader = document.getElementById('po-loader');
      if (loader) {
        loader.style.display = 'none';
      }
    },
    
    /**
     * アラートメッセージ表示
     * @param {string} message - メッセージ
     * @param {string} type - タイプ(success/error/warning/info)
     */
    showAlert(message, type = 'info') {
      alert(message); // シンプル版、必要に応じてカスタムアラートに置き換え
    },
    
    /**
     * 確認ダイアログ表示
     * @param {string} message - メッセージ
     * @returns {boolean} ユーザーの選択
     */
    confirm(message) {
      return window.confirm(message);
    },
    
    /**
     * コンソールログ出力(DEBUGモード時のみ)
     * @param {string} message - メッセージ
     * @param {*} data - データ
     */
    log(message, data = null) {
      if (!CONFIG.DEBUG) return;
      if (data !== null) {
        console.log(`[PO] ${message}`, data);
      } else {
        console.log(`[PO] ${message}`);
      }
    },
    
    /**
     * コンソール警告出力
     * @param {string} message - メッセージ
     * @param {*} data - データ
     */
    warn(message, data = null) {
      if (data !== null) {
        console.warn(`[PO] ${message}`, data);
      } else {
        console.warn(`[PO] ${message}`);
      }
    },
    
    /**
     * コンソールエラー出力
     * @param {string} message - メッセージ
     * @param {*} error - エラーオブジェクト
     */
    error(message, error = null) {
      if (error !== null) {
        console.error(`[PO] ${message}`, error);
      } else {
        console.error(`[PO] ${message}`);
      }
    },
    
    /**
     * メッセージテンプレート処理
     * @param {string} template - テンプレート文字列
     * @param {Object} params - 置換パラメータ
     * @returns {string} 処理後の文字列
     */
    formatMessage(template, params) {
      let result = template;
      for (const key in params) {
        result = result.replace(`{${key}}`, params[key]);
      }
      return result;
    },
    
    /**
     * 空文字・null・undefinedチェック
     * @param {*} value - チェックする値
     * @returns {boolean} 空の場合true
     */
    isEmpty(value) {
      return value === null || value === undefined || value === '';
    },
    
    /**
     * 配列が空かチェック
     * @param {Array} arr - チェックする配列
     * @returns {boolean} 空の場合true
     */
    isEmptyArray(arr) {
      return !Array.isArray(arr) || arr.length === 0;
    }
  };
  
  // グローバルに公開
  window.PO_Utils = Utils;
  
})(window);
