/**
 * 発注管理システム - ERP連携テーブル生成
 * 
 * 発注明細テーブル(po_items)から案件別に展開したERP登録用テーブル(erp_items)を自動生成
 */

(function() {
  'use strict';
  
  const CONFIG = window.PO_CONFIG;
  
  /**
   * ERP登録用テーブルを生成
   * @param {Array} poItems - 発注明細テーブルのデータ
   * @returns {Array} ERP登録用テーブルのデータ
   */
  window.buildERPItemsTable = function(poItems) {
    const erpItems = [];
    
    if (!Array.isArray(poItems)) {
      console.error('[ERP連携] poItemsが配列ではありません:', poItems);
      return erpItems;
    }
    
    poItems.forEach((item, rowIndex) => {
      const itemCode = item.value[CONFIG.FIELDS.ITEM.CODE]?.value || '';
      const itemDetail = item.value[CONFIG.FIELDS.ITEM.DETAIL]?.value || '';
      const unitPrice = parseFloat(item.value[CONFIG.FIELDS.ITEM.UNIT_PRICE]?.value) || 0;
      const quantity = parseFloat(item.value[CONFIG.FIELDS.ITEM.QUANTITY]?.value) || 0;
      
      // この行に紐づく案件配分を取得
      const allocations = window.projectAllocations[rowIndex] || [];
      
      if (allocations.length === 0) {
        // 案件配分がない場合: 案件番号なしで1行追加
        erpItems.push({
          value: {
            [CONFIG.FIELDS.ERP_ITEM.ITEM_CODE]: { value: itemCode },
            [CONFIG.FIELDS.ERP_ITEM.ITEM_DETAIL]: { value: itemDetail },
            [CONFIG.FIELDS.ERP_ITEM.PROJECT_ID]: { value: '' },  // 案件番号なし
            [CONFIG.FIELDS.ERP_ITEM.QUANTITY]: { value: String(quantity) },
            [CONFIG.FIELDS.ERP_ITEM.UNIT_PRICE]: { value: String(unitPrice) }
          }
        });
        
        if (CONFIG.DEBUG) {
          console.log(`[ERP連携] 行${rowIndex + 1}: 案件配分なし (アイテム: ${itemCode}, 数量: ${quantity})`);
        }
      } else {
        // 案件配分がある場合: 案件ごとに行を展開
        allocations.forEach((allocation, allocIndex) => {
          erpItems.push({
            value: {
              [CONFIG.FIELDS.ERP_ITEM.ITEM_CODE]: { value: itemCode },
              [CONFIG.FIELDS.ERP_ITEM.ITEM_DETAIL]: { value: itemDetail },
              [CONFIG.FIELDS.ERP_ITEM.PROJECT_ID]: { value: allocation.project_id },
              [CONFIG.FIELDS.ERP_ITEM.QUANTITY]: { value: String(allocation.allocated_qty) },
              [CONFIG.FIELDS.ERP_ITEM.UNIT_PRICE]: { value: String(unitPrice) }
            }
          });
          
          if (CONFIG.DEBUG) {
            console.log(`[ERP連携] 行${rowIndex + 1}-${allocIndex + 1}: ${itemCode} → 案件${allocation.project_id} (数量: ${allocation.allocated_qty})`);
          }
        });
      }
    });
    
    if (CONFIG.DEBUG) {
      console.log('[ERP連携] 生成完了:', erpItems.length, '行');
    }
    
    return erpItems;
  };
  
  /**
   * レコード登録/更新時にERP登録用テーブルを自動生成
   */
  const events = [
    'app.record.create.submit',
    'app.record.edit.submit'
  ];
  
  kintone.events.on(events, function(event) {
    const record = event.record;
    
    // カスタムビューからの登録かチェック(カスタムビューではこのイベントは発火しない)
    // 通常のフォームからの登録時のみ、ここで処理
    
    if (CONFIG.DEBUG) {
      console.log('[ERP連携] レコード登録/更新イベント:', event.type);
    }
    
    // 発注明細テーブルを取得
    const poItems = record[CONFIG.FIELDS.PO.ITEMS]?.value || [];
    
    // ERP登録用テーブルを生成
    // ※注意: 通常のフォームから登録する場合、projectAllocationsは空になる
    // カスタムビューからの登録の場合は、customView_part3.jsで直接ERP_ITEMSを設定
    const erpItems = window.buildERPItemsTable(poItems);
    
    // レコードにセット
    record[CONFIG.FIELDS.PO.ERP_ITEMS] = { value: erpItems };
    
    return event;
  });
  
})();
