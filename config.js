/**
 * 発注管理システム - 設定ファイル (ERP連携対応版)
 * 
 * アプリID、フィールドコード、定数などの設定を管理
 * 
 * 【更新履歴】
 * 2026-02-14: アプリID・フィールドコードを実際の値に更新
 * 2026-02-14: ERP連携用テーブルフィールド追加
 */

const CONFIG = {
  // ============================================
  // アプリID設定
  // ============================================
  APP_IDS: {
    PO_MANAGEMENT: kintone.app.getId(), // 発注管理アプリ(現在のアプリ)
    VENDOR_MASTER: '746',    // 発注先マスタ
    ITEM_MASTER: '745',      // アイテムマスタ
    QUOTE_MASTER: '750',     // 見積マスタ
    BASIC_INFO: '749',       // 基本情報マスタ
    PROJECT_MASTER: '674',   // 案件マスタ(外部アプリ)
    WAREHOUSE: '747'         // 倉庫マスタ
  },
  
  // ============================================
  // フィールドコード設定
  // ============================================
  FIELDS: {
    // 発注管理アプリ - 基本情報
    PO: {
      NUMBER: 'po_number',              // 発注番号
      SUPPLIER: 'supplier_company',     // 発注元
      SUPPLIER_NAME: 'supplier_name',   // 発注元企業名
      SUPPLIER_ADDRESS: 'supplier_address', // 発注元住所
      SUPPLIER_REP: 'supplier_rep',     // 発注元代表者
      VENDOR: 'vendor',                 // 発注先
      VENDOR_NAME: 'vendor_name',       // 発注先企業名
      VENDOR_ADDRESS: 'vendor_address', // 発注先住所
      VENDOR_CONTACT: 'vendor_contact', // 発注先担当者
      DATE: 'po_date',                  // 発注日
      SUBJECT: 'subject',               // 件名
      CURRENCY: 'currency',             // 通貨
      EXCHANGE_RATE: 'exchange_rate',   // 参考為替レート
      TAX_CODE: 'tax_code',             // 税コード
      TAX_RATE: 'tax_rate',             // 税率
      CONTRACT_TERMS: 'contract_terms', // 契約文言
      STATUS: 'status',                 // ステータス
      PO_FILE: 'po_file',               // 発注書ファイル
      ITEMS: 'po_items',                // 発注内訳テーブル
      ERP_ITEMS: 'erp_items',           // ERP登録用テーブル
      SUBTOTAL: 'subtotal',             // 小計
      TAX_AMOUNT: 'tax_amount',         // 税額
      TOTAL: 'total',                   // 総合計
      TOTAL_JPY: 'total_jpy'            // 総合計(円貨)
    },
    
    // 発注内訳テーブル内フィールド
    ITEM: {
      LINE_NO: 'line_no',               // 行番号
      CODE: 'item_code',                // アイテムコード
      NAME: 'item_name',                // アイテム名
      DETAIL: 'item_detail',            // 詳細項目
      UNIT_PRICE: 'unit_price',         // 単価
      QUANTITY: 'quantity',             // 数量
      UNIT: 'unit',                     // 単位
      AMOUNT: 'amount',                 // 金額
      IS_INVENTORY: 'is_inventory',     // 在庫管理区分
      REMARKS: 'remarks'                // 備考
    },
    
    // ERP登録用テーブル内フィールド
    ERP_ITEM: {
      ITEM_CODE: 'erp_item_code',       // アイテムコード
      ITEM_DETAIL: 'erp_item_detail',   // 詳細項目
      PROJECT_ID: 'erp_project_id',     // 案件番号
      QUANTITY: 'erp_quantity',         // 数量
      UNIT_PRICE: 'erp_unit_price'      // 単価
    },
    
    // 発注先マスタ
    VENDOR: {
      CODE: 'vendor_code',              // 発注先コード
      NAME: 'vendor_name',              // 発注先名(日本語)
      NAME_EN: 'vendor_name_en',        // 発注先名(英語)
      ADDRESS: 'address',               // 住所
      CONTACT: 'contact',               // 担当者名
      PHONE: 'phone',                   // 電話番号
      EMAIL: 'email',                   // メールアドレス
      PAYMENT_TERMS: 'payment_terms'    // 支払条件
    },
    
    // アイテムマスタ
    ITEM_MASTER: {
      CODE: 'item_code',                // アイテムコード
      NAME: 'item_name',                // アイテム名(日本語)
      NAME_EN: 'item_name_en',          // アイテム名(英語)
      CATEGORY: 'category',             // カテゴリ
      IS_INVENTORY: 'is_inventory',     // 在庫管理区分
      STANDARD_PRICE: 'standard_price', // 標準単価
      UNIT: 'unit',                     // 単位
      SPECIFICATION: 'specification'    // 仕様
    },
    
    // 見積マスタ
    QUOTE: {
      NUMBER: 'quote_number',           // 見積番号
      VENDOR: 'vendor',                 // 発注先
      NAME: 'quote_name',               // 見積名称
      EXPIRY_DATE: 'expiry_date',       // 有効期限
      CURRENCY: 'currency',             // 通貨
      ITEMS: 'quote_items'              // 見積明細テーブル
    },
    
    // 見積明細テーブル内フィールド
    QUOTE_ITEM: {
      ITEM_CODE: 'item_code',           // アイテムコード
      ITEM_NAME: 'item_name',           // アイテム名
      ITEM_DETAIL: 'item_detail',       // 詳細項目
      UNIT_PRICE: 'unit_price',         // 単価
      UNIT: 'unit'                      // 単位
    },
    
    // 基本情報マスタ
    BASIC_INFO: {
      DATA_TYPE: 'data_type',           // データ種別(発注元/通貨/税コード)
      CODE: 'code',                     // コード
      NAME: 'name',                     // 名称
      COMPANY_NAME: 'company_name',     // 企業名(発注元用)
      ADDRESS: 'address',               // 住所(発注元用)
      REPRESENTATIVE: 'representative', // 代表者名(発注元用)
      PHONE: 'phone',                   // 電話番号(発注元用)
      CURRENCY_CODE: 'currency_code',   // 通貨コード(通貨用)
      CURRENCY_SYMBOL: 'currency_symbol', // 通貨記号(通貨用)
      TAX_RATE: 'tax_rate',             // 税率(税コード用)
      TAX_CATEGORY: 'tax_category'      // 税区分(税コード用)
    },
    
    // 案件マスタ(外部アプリ)
    PROJECT: {
      ID: 'body_id'                     // 案件番号
    }
  },
  
  // ============================================
  // 定数設定
  // ============================================
  MAX_ITEMS: 20,                        // 明細最大行数
  PO_NUMBER_PREFIX: 'PO-',              // 発注番号プレフィックス
  CUSTOM_VIEW_ID: 'XXXXX',              // カスタムビューID ※要設定
  
  // ステータス
  STATUS: {
    DRAFT: '下書き',
    PENDING: '承認待ち',
    ORDERED: '発注済み',
    COMPLETED: '完了'
  },
  
  // データ種別(基本情報マスタ)
  DATA_TYPES: {
    SUPPLIER: '発注元',
    CURRENCY: '通貨',
    TAX_CODE: '税コード'
  },
  
  // 在庫管理区分
  INVENTORY_TYPES: {
    INVENTORY: '在庫品',
    NON_INVENTORY: '非在庫品'
  },
  
  // 通貨コード
  CURRENCY_CODES: {
    JPY: 'JPY',
    USD: 'USD',
    EUR: 'EUR'
  },
  
  // ============================================
  // UI設定
  // ============================================
  UI: {
    COLORS: {
      PRIMARY: '#3498db',     // メインカラー(青)
      SECONDARY: '#95a5a6',   // サブカラー(グレー)
      SUCCESS: '#27ae60',     // 成功(緑)
      DANGER: '#e74c3c',      // 警告(赤)
      WARNING: '#f39c12',     // 注意(オレンジ)
      INFO: '#3498db',        // 情報(青)
      LIGHT: '#ecf0f1',       // 薄いグレー
      DARK: '#2c3e50',        // 濃い青
      BORDER: '#dcdcdc'       // ボーダー
    },
    
    BUTTON_TEXT: {
      CANCEL: 'キャンセル',
      SAVE_DRAFT: '下書き保存',
      SUBMIT: '登録',
      ADD_ITEM: '+ 明細行追加',
      QUOTE_REF: '見積参照',
      BULK_IMPORT: '見積から一括取込',
      SEARCH: '検索',
      SELECT: '選択',
      DELETE: '削除',
      CLOSE: '閉じる',
      CONFIRM: '確定',
      PROJECT_ALLOCATION: '案件配分',
      PASTE: '📋 貼り付け'
    },
    
    MESSAGES: {
      CONFIRM_CANCEL: '入力内容を破棄してよろしいですか?',
      CONFIRM_DELETE_ROW: 'この明細行を削除しますか?',
      CONFIRM_SUBMIT: '発注情報を登録しますか?',
      CONFIRM_DRAFT: '発注情報を下書き保存しますか?',
      SUCCESS_SUBMIT: '登録が完了しました(レコード番号: {recordId})',
      SUCCESS_DRAFT: '下書き保存が完了しました(レコード番号: {recordId})',
      ERROR_VALIDATION: '入力内容に誤りがあります',
      ERROR_API: 'システムエラーが発生しました',
      ERROR_MAX_ITEMS: '明細行は最大{max}行までです',
      ERROR_NO_VENDOR: '発注先を選択してください',
      ERROR_NO_RESULTS: '該当するデータが見つかりません',
      INFO_ITEMS_IMPORTED: '{count}行の明細を取り込みました',
      WARN_NO_EXCHANGE_RATE: '参考為替レートが入力されていません。このまま登録しますか?',
      ERROR_NO_ITEM_CODE: 'アイテムコードを入力してください',
      ERROR_NO_QUANTITY: '数量を入力してください',
      WARN_ALLOCATION_MISMATCH: '配分数量の合計({allocated})が明細数量({total})と一致していません。\nこのまま保存しますか?',
      ERROR_DUPLICATE_PROJECT: '同じ案件番号が複数入力されています',
      INFO_NO_VALID_DATA: '有効なデータが見つかりませんでした。\n\nフォーマット例:\nP001\t6\nP002\t4'
    }
  },
  
  // ============================================
  // デバッグモード
  // ============================================
  DEBUG: true  // 本番環境では false に設定
};

// グローバルに公開
window.PO_CONFIG = CONFIG;
