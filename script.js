// База данных заявок (в реальном проекте здесь будет API)
let orders = [
    { id: 1, customer: "ООО 'Ромашка'", cargo: "Электроника", from: "Москва", to: "Санкт-Петербург", status: "active" },
    { id: 2, customer: "ИП Иванов", cargo: "Мебель", from: "Казань", to: "Екатеринбург", status: "new" },
    { id: 3, customer: "АО 'Заря'", cargo: "Продукты", from: "Новосибирск", to: "Омск", status: "delivered" }
];

// Функции для работы с заявками
function displayOrders() {
    const tbody = document.getElementById('orders-list');
    tbody.innerHTML = '';
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        
        // Определяем цвет статуса
        let statusText, statusClass;
        switch(order.status) {
            case 'new': statusText = 'Новая'; statusClass = 'status-new'; break;
            case 'active': statusText = 'В пути'; statusClass = 'status-active'; break;
            case 'delivered': statusText = 'Доставлено'; statusClass = 'status-delivered'; break;
            default: statusText = 'Новая'; statusClass = 'status-new';
        }
        
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.cargo}</td>
            <td>${order.from} → ${order.to}</td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
            <td>
                <button onclick="changeStatus(${order.id}, 'active')" class="small-btn">В путь</button>
                <button onclick="changeStatus(${order.id}, 'delivered')" class="small-btn">Доставлено</button>
                <button onclick="deleteOrder(${order.id})" class="small-btn delete-btn"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Обновляем счетчики на дашборде
    updateDashboardCounters();
}

// Создание новой заявки
document.getElementById('order-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const customer = document.getElementById('customer-name').value;
    const cargo = document.getElementById('cargo-type').value;
    const weight = document.getElementById('weight').value;
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    
    // Создаем новую заявку
    const newOrder = {
        id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
        customer: customer,
        cargo: cargo + (weight ? ` (${weight} кг)` : ''),
        from: from,
        to: to,
        status: 'new'
    };
    
    orders.push(newOrder);
    displayOrders();
    
    // Очищаем форму
    event.target.reset();
    
    // Показываем уведомление
    showNotification(`Заявка #${newOrder.id} успешно создана!`);
    
    // Добавляем событие в трекинг
    addTrackingEvent(`Заявка #${newOrder.id}: Создана новая заявка для ${customer}`);
});

// Изменение статуса заявки
function changeStatus(orderId, newStatus) {
    const orderIndex = orders.findIndex(order => order.id === orderId);
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        displayOrders();
        
        // Добавляем событие в трекинг
        const statusText = newStatus === 'active' ? 'отправлена в путь' : 'доставлена';
        addTrackingEvent(`Заявка #${orderId}: Груз ${statusText}`);
    }
}

// Удаление заявки
function deleteOrder(orderId) {
    if (confirm('Вы уверены, что хотите удалить эту заявку?')) {
        orders = orders.filter(order => order.id !== orderId);
        displayOrders();
        showNotification('Заявка удалена');
    }
}

// Обновление счетчиков на дашборде
function updateDashboardCounters() {
    const activeOrders = orders.filter(order => order.status === 'active').length;
    const inTransit = orders.filter(order => order.status === 'active').length;
    const deliveredToday = orders.filter(order => order.status === 'delivered').length;
    
    document.getElementById('active-orders').textContent = orders.length;
    document.getElementById('in-transit').textContent = inTransit;
    document.getElementById('delivered-today').textContent = deliveredToday;
}

// Добавление события в трекинг
function addTrackingEvent(eventText) {
    const trackingList = document.getElementById('tracking-events');
    const newEvent = document.createElement('li');
    newEvent.textContent = `${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}: ${eventText}`;
    trackingList.prepend(newEvent);
    
    // Ограничиваем список 5 последними событиями
    if (trackingList.children.length > 5) {
        trackingList.removeChild(trackingList.lastChild);
    }
}

// Вспомогательная функция для уведомлений
function showNotification(message) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Добавляем CSS для анимации уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .small-btn {
        padding: 0.4rem 0.8rem !important;
        font-size: 0.9rem !important;
        margin: 2px;
    }
    .delete-btn {
        background-color: #dc3545 !important;
    }
`;
document.head.appendChild(style);

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    displayOrders();
    updateDashboardCounters();
    
    // Добавляем несколько тестовых событий в трекинг
    addTrackingEvent('Система запущена и готова к работе');
    addTrackingEvent('Заявка #002: Мебель загружена в Казани');
});