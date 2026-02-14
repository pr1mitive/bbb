/**
 * 発注管理システム - マスタデータ管理
 * 
 * 各種マスタからデータを取得・キャッシュする機能
 */

(function(window) {
  'use strict';
  
  const CONFIG = window.PO_CONFIG;
  const Utils = window.PO_Utils;
  
  const MasterData = {
    
    // キャッシュ
    cache: {
      suppliers: [],      // 発注元
      vendors: [],        // 発注先
      items: [],          // アイテム
      quotes: [],         // 見積
      currencies: [],     // 通貨
      taxCodes: [],       // 税コード
      projects: []        // 案件
    },
    
    /**
     * 全マスタデータを読み込み
     * @returns {Promise<void>}
     */
    async loadAll() {
      Utils.log('マスタデータ読み込み開始');
      
      try {
        // 並列で各マスタデータを取得
        await Promise.all([
          this.loadBasicInfo(),
          this.loadVendors(),
          this.loadItems()
        ]);
        
        Utils.log('マスタデータ読み込み完了');
        
      } catch (error) {
        Utils.error('マスタデータ読み込みエラー', error);
        throw error;
      }
    },
    
    /**
     * 基本情報マスタを読み込み(発注元・通貨・税コード)
     * @returns {Promise<void>}
     */
    async loadBasicInfo() {
      try {
        const records = await Utils.fetchRecords(CONFIG.APP_IDS.BASIC_INFO, '');
        
        // データ種別で分類
        this.cache.suppliers = records.filter(r => 
          Utils.getFieldValue(r, CONFIG.FIELDS.BASIC_INFO.DATA_TYPE) === CONFIG.DATA_TYPES.SUPPLIER
        );
        
        this.cache.currencies = records.filter(r => 
          Utils.getFieldValue(r, CONFIG.FIELDS.BASIC_INFO.DATA_TYPE) === CONFIG.DATA_TYPES.CURRENCY
        );
        
        this.cache.taxCodes = records.filter(r => 
          Utils.getFieldValue(r, CONFIG.FIELDS.BASIC_INFO.DATA_TYPE) === CONFIG.DATA_TYPES.TAX_CODE
        );
        
        Utils.log(`基本情報マスタ読み込み完了 - 発注元:${this.cache.suppliers.length}, 通貨:${this.cache.currencies.length}, 税コード:${this.cache.taxCodes.length}`);
        
      } catch (error) {
        Utils.error('基本情報マスタ読み込みエラー', error);
        throw error;
      }
    },
    
    /**
     * 発注先マスタを読み込み
     * @returns {Promise<void>}
     */
    async loadVendors() {
      try {
        this.cache.vendors = await Utils.fetchRecords(CONFIG.APP_IDS.VENDOR_MASTER, '');
        Utils.log(`発注先マスタ読み込み完了: ${this.cache.vendors.length}件`);
        
      } catch (error) {
        Utils.error('発注先マスタ読み込みエラー', error);
        throw error;
      }
    },
    
    /**
     * アイテムマスタを読み込み
     * @returns {Promise<void>}
     */
    async loadItems() {
      try {
        this.cache.items = await Utils.fetchRecords(CONFIG.APP_IDS.ITEM_MASTER, '');
        Utils.log(`アイテムマスタ読み込み完了: ${this.cache.items.length}件`);
        
      } catch (error) {
        Utils.error('アイテムマスタ読み込みエラー', error);
        throw error;
      }
    },
    
    /**
     * 見積マスタを検索
     * @param {string} vendorCode - 発注先コード
     * @param {string} searchQuery - 検索クエリ(任意)
     * @returns {Promise<Array>} 見積レコード配列
     */
    async searchQuotes(vendorCode, searchQuery = '') {
      try {
        let query = `${CONFIG.FIELDS.QUOTE.VENDOR} = "${vendorCode}"`;
        
        if (searchQuery) {
          query += ` and (${CONFIG.FIELDS.QUOTE.NUMBER} like "${searchQuery}" or ${CONFIG.FIELDS.QUOTE.NAME} like "${searchQuery}")`;
        }
        
        const records = await Utils.fetchRecords(CONFIG.APP_IDS.QUOTE_MASTER, query);
        Utils.log(`見積マスタ検索完了: ${records.length}件`);
        
        return records;
        
      } catch (error) {
        Utils.error('見積マスタ検索エラー', error);
        throw error;
      }
    },
    
    /**
     * アイテムマスタを検索
     * @param {string} searchQuery - 検索クエリ
     * @returns {Promise<Array>} アイテムレコード配列
     */
    async searchItems(searchQuery = '') {
      try {
        let query = '';
        
        if (searchQuery) {
          query = `${CONFIG.FIELDS.ITEM_MASTER.CODE} like "${searchQuery}" or ${CONFIG.FIELDS.ITEM_MASTER.NAME} like "${searchQuery}"`;
        }
        
        // キャッシュから検索(高速化)
        if (this.cache.items.length > 0 && searchQuery) {
          const filtered = this.cache.items.filter(item => {
            const code = Utils.getFieldValue(item, CONFIG.FIELDS.ITEM_MASTER.CODE);
            const name = Utils.getFieldValue(item, CONFIG.FIELDS.ITEM_MASTER.NAME);
            return code.includes(searchQuery) || name.includes(searchQuery);
          });
          Utils.log(`アイテムマスタ検索完了(キャッシュ): ${filtered.length}件`);
          return filtered;
        }
        
        // APIから検索
        const records = await Utils.fetchRecords(CONFIG.APP_IDS.ITEM_MASTER, query);
        Utils.log(`アイテムマスタ検索完了: ${records.length}件`);
        
        return records;
        
      } catch (error) {
        Utils.error('アイテムマスタ検索エラー', error);
        throw error;
      }
    },
    
    /**
     * 案件マスタを検索
     * @param {string} searchQuery - 検索クエリ
     * @returns {Promise<Array>} 案件レコード配列
     */
    async searchProjects(searchQuery = '') {
      try {
        let query = '';
        
        if (searchQuery) {
          query = `${CONFIG.FIELDS.PROJECT.ID} like "${searchQuery}"`;
        }
        
        const records = await Utils.fetchRecords(CONFIG.APP_IDS.PROJECT_MASTER, query);
        Utils.log(`案件マスタ検索完了: ${records.length}件`);
        
        return records;
        
      } catch (error) {
        Utils.error('案件マスタ検索エラー', error);
        throw error;
      }
    },
    
    /**
     * 発注元を取得
     * @returns {Array} 発注元レコード配列
     */
    getSuppliers() {
      return this.cache.suppliers;
    },
    
    /**
     * 発注先を取得
     * @returns {Array} 発注先レコード配列
     */
    getVendors() {
      return this.cache.vendors;
    },
    
    /**
     * 通貨を取得
     * @returns {Array} 通貨レコード配列
     */
    getCurrencies() {
      return this.cache.currencies;
    },
    
    /**
     * 税コードを取得
     * @returns {Array} 税コードレコード配列
     */
    getTaxCodes() {
      return this.cache.taxCodes;
    },
    
    /**
     * アイテムを取得
     * @returns {Array} アイテムレコード配列
     */
    getItems() {
      return this.cache.items;
    },
    
    /**
     * 発注元レコードを取得
     * @param {string} code - 発注元コード
     * @returns {Object|null} 発注元レコード
     */
    getSupplierByCode(code) {
      return this.cache.suppliers.find(s => 
        Utils.getFieldValue(s, CONFIG.FIELDS.BASIC_INFO.CODE) === code
      ) || null;
    },
    
    /**
     * 発注先レコードを取得
     * @param {string} code - 発注先コード
     * @returns {Object|null} 発注先レコード
     */
    getVendorByCode(code) {
      return this.cache.vendors.find(v => 
        Utils.getFieldValue(v, CONFIG.FIELDS.VENDOR.CODE) === code
      ) || null;
    },
    
    /**
     * 通貨レコードを取得
     * @param {string} code - 通貨コード
     * @returns {Object|null} 通貨レコード
     */
    getCurrencyByCode(code) {
      return this.cache.currencies.find(c => 
        Utils.getFieldValue(c, CONFIG.FIELDS.BASIC_INFO.CURRENCY_CODE) === code
      ) || null;
    },
    
    /**
     * 税コードレコードを取得
     * @param {string} code - 税コード
     * @returns {Object|null} 税コードレコード
     */
    getTaxCodeByCode(code) {
      return this.cache.taxCodes.find(t => 
        Utils.getFieldValue(t, CONFIG.FIELDS.BASIC_INFO.CODE) === code
      ) || null;
    },
    
    /**
     * アイテムレコードを取得
     * @param {string} code - アイテムコード
     * @returns {Object|null} アイテムレコード
     */
    getItemByCode(code) {
      return this.cache.items.find(i => 
        Utils.getFieldValue(i, CONFIG.FIELDS.ITEM_MASTER.CODE) === code
      ) || null;
    },
    
    /**
     * キャッシュをクリア
     */
    clearCache() {
      this.cache = {
        suppliers: [],
        vendors: [],
        items: [],
        quotes: [],
        currencies: [],
        taxCodes: [],
        projects: []
      };
      Utils.log('マスタデータキャッシュをクリアしました');
    }
  };
  
  // グローバルに公開
  window.PO_MasterData = MasterData;
  
})(window);
