let currentUser = null;
let sales = [];

const users = {
    "عبد الله": { password: "201", sales: [] },
    "طه": { password: "011", sales: [] }
};

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (users[username] && users[username].password === password) {
        currentUser = username;
        sales = users[username].sales;
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('cashier-container').style.display = 'block';
        document.getElementById('sales-container').style.display = 'block';
        updateSalesList();
        updateTotal();
    } else {
        alert("اسم المستخدم أو كلمة المرور غير صحيحة.");
    }
}
function deleteTable() {
    if (confirm('هل أنت متأكد من مسح الجدول الحالي؟')) {
        // مسح الجدول الحالي
        sales = [];
        users[currentUser].sales = sales;
        
        // مسح الجداول السابقة من التخزين المحلي
        localStorage.removeItem(`tableHistory_${currentUser}`);
        
        // تحديث العرض
        saveSalesData();
        updateSalesList();
        updateTotal();
        
        // إزالة قائمة الجداول السابقة من العرض
        const tableSelector = document.querySelector('.table-selector');
        if (tableSelector) {
            tableSelector.remove();
        }
        
        alert('تم مسح جميع الجداول بنجاح');
    }
}


function addSale() {
    const product = document.getElementById('product').value;
    const price = parseFloat(document.getElementById('price').value);
    const quantity = parseInt(document.getElementById('quantity').value);
    const date = new Date();
    const dateString = date.toISOString();

    if (product && !isNaN(price) && price > 0 && !isNaN(quantity) && quantity > 0) {
        const totalPrice = price * quantity;
        const sale = { 
            date: dateString, 
            product, 
            price, 
            quantity, 
            totalPrice,
            tableName: `جدول ${currentUser} - ${new Date().toLocaleDateString('ar-EG')}`
        };
        sales.push(sale);
        users[currentUser].sales = sales;
        saveSalesData();
        updateSalesList();
        updateTotal();
        
        document.getElementById('product').value = '';
        document.getElementById('price').value = '';
        document.getElementById('quantity').value = '';
    } else {
        alert('من فضلك أدخل جميع البيانات بشكل صحيح');
    }
}

function saveSalesData() {
    localStorage.setItem('users', JSON.stringify(users));
    saveTableHistory();
}

function saveTableHistory() {
    const currentTable = {
        id: Date.now(),
        date: new Date().toISOString(),
        user: currentUser,
        tableName: `جدول ${currentUser} - ${new Date().toLocaleDateString('ar-EG')}`,
        sales: [...sales],
        total: document.getElementById('total-sales').textContent
    };
    
    let tableHistory = JSON.parse(localStorage.getItem(`tableHistory_${currentUser}`) || '[]');
    tableHistory.push(currentTable);
    localStorage.setItem(`tableHistory_${currentUser}`, JSON.stringify(tableHistory));
}

function loadSalesData() {
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
        Object.assign(users, JSON.parse(savedUsers));
    }
}

function updateSalesList() {
    const salesTableBody = document.querySelector('#sales-table tbody');
    salesTableBody.innerHTML = '';

    sales.forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(sale.date).toLocaleDateString('ar-EG')}</td>
            <td>${sale.product}</td>
            <td>${sale.price.toFixed(2)}</td>
            <td>${sale.quantity}</td>
            <td>${sale.totalPrice.toFixed(2)}</td>
        `;
        salesTableBody.appendChild(row);
    });
}

function updateTotal() {
    const totalSales = sales.reduce((acc, sale) => acc + sale.totalPrice, 0);
    document.getElementById('total-sales').textContent = totalSales.toFixed(2);
}

function exportToExcel() {
    const data = [
        ['تقرير المبيعات'],
        [`اسم المستخدم: ${currentUser}`],
        [`التاريخ: ${new Date().toLocaleDateString('ar-EG')}`],
        [],
        ['التاريخ', 'المنتج', 'السعر', 'الكمية', 'الإجمالي']
    ];

    sales.forEach(sale => {
        data.push([
            new Date(sale.date).toLocaleDateString('ar-EG'),
            sale.product,
            sale.price,
            sale.quantity,
            sale.totalPrice
        ]);
    });

    const total = document.getElementById('total-sales').textContent;
    data.push(
        [],
        ['', '', '', 'الإجمالي الكلي:', total]
    );

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المبيعات");
    XLSX.writeFile(wb, `مبيعات-${currentUser}-${new Date().toLocaleDateString('ar-EG')}.xlsx`);
}

function createNewTable() {
    if (confirm('هل تريد إنشاء جدول جديد؟')) {
        saveTableHistory();
        sales = [];
        users[currentUser].sales = sales;
        saveSalesData();
        updateSalesList();
        updateTotal();
    }
}

function viewMonthlySales() {
    const oldSelector = document.querySelector('.table-selector');
    if (oldSelector) {
        oldSelector.remove();
    }

    const container = document.getElementById('sales-container');
    const selectDiv = document.createElement('div');
    selectDiv.className = 'table-selector';
    
    const title = document.createElement('h3');
    title.textContent = 'الجداول السابقة';
    selectDiv.appendChild(title);
    
    const tableHistory = JSON.parse(localStorage.getItem(`tableHistory_${currentUser}`) || '[]');
    
    if (tableHistory.length === 0) {
        const noTables = document.createElement('p');
        noTables.textContent = 'لا توجد جداول سابقة';
        selectDiv.appendChild(noTables);
    } else {
        const tableList = document.createElement('div');
        tableList.className = 'table-list';
        
        tableHistory.forEach(table => {
            const tableButton = document.createElement('button');
            tableButton.className = 'btn table-btn';
            tableButton.textContent = `${table.tableName} - الإجمالي: ${table.total} جنيه`;
            tableButton.onclick = () => displaySelectedTable(table);
            tableList.appendChild(tableButton);
        });
        
        selectDiv.appendChild(tableList);
    }
    
    container.insertBefore(selectDiv, container.firstChild);
}

function displaySelectedTable(tableData) {
    const tableBody = document.querySelector('#sales-table tbody');
    tableBody.innerHTML = '';
    
    tableData.sales.forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(sale.date).toLocaleDateString('ar-EG')}</td>
            <td>${sale.product}</td>
            <td>${sale.price}</td>
            <td>${sale.quantity}</td>
            <td>${sale.totalPrice}</td>
        `;
        tableBody.appendChild(row);
    });
    
    document.getElementById('total-sales').textContent = tableData.total;
}

window.onload = loadSalesData;
