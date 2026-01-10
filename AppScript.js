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
      case 'updateOrder':
        result = updateOrder(data.order);
        break;
      case 'deleteOrder':
        result = deleteOrder(data.orderId);
        break;
      case 'createRoute':
        result = createRoute(data.route);
        break;
      case 'updateRoute':
        result = updateRoute(data.route);
        break;
      case 'deleteRoute':
        result = deleteRoute(data.routeId);
        break;
      default:
        result = { success: false, error: 'Unknown action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
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

/**
 * Update existing order by ID
 */
function updateOrder(order) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('order');
  
  if (!sheet) {
    return { success: false, error: 'Sheet "order" not found' };
  }
  
  const data = sheet.getDataRange().getValues();
  
  // Find row with matching ID (column A)
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == order.id) {
      // Update row data
      const row = [
        order.id,
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
        order.createdAt || data[i][14], // Keep original createdAt
        order.userId || ''
      ];
      
      // Update the row (i+1 because sheet is 1-indexed)
      sheet.getRange(i + 1, 1, 1, 16).setValues([row]);
      
      return { 
        success: true, 
        id: order.id,
        message: 'Order updated successfully'
      };
    }
  }
  
  return { success: false, error: 'Order not found with ID: ' + order.id };
}

/**
 * Delete order by ID
 */
function deleteOrder(orderId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('order');
  
  if (!sheet) {
    return { success: false, error: 'Sheet "order" not found' };
  }
  
  const data = sheet.getDataRange().getValues();
  
  // Find row with matching ID
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == orderId) {
      // Delete the row (i+1 because sheet is 1-indexed)
      sheet.deleteRow(i + 1);
      
      return { 
        success: true, 
        id: orderId,
        message: 'Order deleted successfully'
      };
    }
  }
  
  return { success: false, error: 'Order not found with ID: ' + orderId };
}

/**
 * Create new route - Append to sheet
 */
function createRoute(route) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('route');
  
  if (!sheet) {
    return { success: false, error: 'Sheet "route" not found' };
  }
  
  // Prepare row data matching route structure
  const row = [
    route.id || '',
    route.vehicle || '',
    route.route || '',
    route.capacity || '',
    route.weight || '',
    route.date || '',
    route.statusText || 'Sẵn sàng',
    route.progress || 0,
    route.createdAt || new Date().toISOString()
  ];
  
  sheet.appendRow(row);
  
  return { 
    success: true, 
    id: route.id,
    message: 'Route created successfully'
  };
}

/**
 * Update existing route by ID
 */
function updateRoute(route) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('route');
  
  if (!sheet) {
    return { success: false, error: 'Sheet "route" not found' };
  }
  
  const data = sheet.getDataRange().getValues();
  
  // Find row with matching ID (column A)
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == route.id) {
      const row = [
        route.id,
        route.vehicle || '',
        route.route || '',
        route.capacity || '',
        route.weight || '',
        route.date || '',
        route.statusText || 'Sẵn sàng',
        route.progress || 0,
        route.createdAt || data[i][8] // Keep original createdAt
      ];
      
      // Get number of columns in the row
      const numCols = row.length;
      sheet.getRange(i + 1, 1, 1, numCols).setValues([row]);
      
      return { 
        success: true, 
        id: route.id,
        message: 'Route updated successfully'
      };
    }
  }
  
  return { success: false, error: 'Route not found with ID: ' + route.id };
}

/**
 * Delete route by ID
 */
function deleteRoute(routeId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('route');
  
  if (!sheet) {
    return { success: false, error: 'Sheet "route" not found' };
  }
  
  const data = sheet.getDataRange().getValues();
  
  // Find row with matching ID
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == routeId) {
      sheet.deleteRow(i + 1);
      
      return { 
        success: true, 
        id: routeId,
        message: 'Route deleted successfully'
      };
    }
  }
  
  return { success: false, error: 'Route not found with ID: ' + routeId };
}
