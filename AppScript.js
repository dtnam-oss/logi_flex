/**
 * AppScript.js
 * Google Apps Script backend for handling data operations
 * Deploy this as a Web App and update the API_ENDPOINT in app.js
 */

const SPREADSHEET_ID = '1dDHPULdfHhdEpawOtOtnsw7NTgYF1LVpCElrCeBFnMU';

/**
 * Handle GET requests - Read data
 */
function doGet(e) {
  const params = e.parameter;
  const action = params.action || 'getOrders';
  
  try {
    let result = {};
    
    switch (action) {
      case 'getOrders':
        result = getOrders();
        break;
      case 'getRoutes':
        result = getRoutes();
        break;
      default:
        result = { error: 'Unknown action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle POST requests - Write data
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let result = {};
    
    switch (action) {
      case 'createOrder':
        result = createOrder(data.order);
        break;
      default:
        result = { error: 'Unknown action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all orders from sheet
 */
function getOrders() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('order');
  
  if (!sheet) {
    return { error: 'Sheet "order" not found' };
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return [];
  }
  
  const headers = data[0];
  const orders = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const order = {};
    headers.forEach((header, index) => {
      order[header] = row[index];
    });
    orders.push(order);
  }
  
  return orders;
}

/**
 * Get available routes from sheet
 */
function getRoutes() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('route');
  
  if (!sheet) {
    return { error: 'Sheet "route" not found' };
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return [];
  }
  
  const headers = data[0];
  const routes = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const route = {};
    headers.forEach((header, index) => {
      route[header] = row[index];
    });
    routes.push(route);
  }
  
  return routes;
}

/**
 * Create new order - Append to sheet
 */
function createOrder(order) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('order');
  
  if (!sheet) {
    return { success: false, error: 'Sheet "order" not found' };
  }
  
  // Prepare row data matching 16-column structure
  const row = [
    order.id || '',
    order.customerName || '',
    order.phone || '',
    order.pickupAddress || '',
    order.pickupTime || '',
    order.deliveryAddress || '',
    order.deliveryTime || '',
    order.price || 0,
    order.weight || '',
    order.size || '',
    order.image || '',
    order.vehicle || '',
    order.driver || '',
    order.statusText || 'Chờ xác nhận',
    order.createdAt || new Date().toISOString(),
    order.userId || ''
  ];
  
  // Append row to sheet
  sheet.appendRow(row);
  
  return { 
    success: true, 
    id: order.id,
    message: 'Order created successfully'
  };
}
