// ============================================
// ПРОСТОЙ СКРИПТ ДЛЯ СИСТЕМЫ ЛОГИСТИКИ
// ============================================

// База данных заявок в localStorage
const ORDERS_KEY = 'logistics_orders';
const TRACKING_KEY = 'logistics_tracking';

// Глобальная переменная для заявок
let orders = [];

// ============================================
// 1. РАБОТА С ЛОКАЛЬНЫМ ХРАНИЛИЩЕМ
// ============================================

// Загрузка заявок из localStorage
function loadOrders() {
    try {
        const saved = localStorage.getItem(ORDERS_KEY);
        if (saved) {
            orders = JSON.parse(saved);
            console.log('Загружено заявок:', orders.length);
        } else {
            // Создаем начальные тестовые данные
            orders = [
                {
                    id: 1,
                    customer: "ООО 'Ромашка'",
                    cargo: "Электроника",
                    weight: 150,
                    from: "Москва",
                    to: "Санкт-Петербург",
                    status: "active",
                    driver: "Иванов И.И.",
                    createdAt: "2024-03-15"
                },
                {
                    id: 2,
                    customer: "ИП Петров",
                    cargo: "Мебель",
                    weight: 500,
                    from: "Казань",
                    to: "Екатеринбург",
                    status: "new",
                    driver: "Не назначен",
                    createdAt: "2024-03-16"
                },
                {
                    id: 3,
                    customer: "АО 'Заря'",
                    cargo: "Продукты",
                    weight: 300,
                    from: "Новосибирск",
                    to: "Омск",
                    status: "delivered",
                    driver: "Сидоров С.С.",
                    createdAt: "2024-03-14"
                }
            ];
            saveOrders();
        }
        
        // Находим максимальный ID для новых заявок
        window.maxOrderId = orders.length > 0 
            ? Math.max(...orders.map(o => o.id)) 
            : 0;
            
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
        orders = [];
        window.maxOrderId = 0;
    }
}

// Сохранение заявок в localStorage
function saveOrders() {
    try {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        console.log('Сохранено заявок:', orders.length);
    } catch (error) {
        console.error('Ошибка сохранения:', error);
    }
}

// ============================================
// 2. ОТОБРАЖЕНИЕ ЗАЯВОК НА СТРАНИЦЕ
// ============================================

// Показать все заявки в таблице
function displayOrders() {
    const tbody = document.getElementById('orders-list');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Сортируем по дате создания (новые сверху)
    const sortedOrders = [...orders].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    sortedOrders.forEach(order => {
        const row = document.createElement('tr');
        
        // Определяем цвет статуса
        let statusText, statusClass;
        switch(order.status) {
            case 'new':
                statusText = 'Новая';
                statusClass = 'status-new';
                break;
            case 'active':
                statusText = 'В пути';
                statusClass = 'status-active';
                break;
            case 'delivered':
                statusText = 'Доставлено';
                statusClass = 'status-delivered';
                break;
            default:
                statusText = 'Новая';
                statusClass = 'status-new';
        }
        
        // Форматируем дату
        const createdAt = order.createdAt 
            ? new Date(order.createdAt).toLocaleDateString('ru-RU')
            : 'Не указана';
        
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.cargo}${order.weight ? ` (${order.weight} кг)` : ''}</td>
            <td>${order.from} → ${order.to}</td>
            <td>
                <span class="status ${statusClass}">${statusText}</span>
                ${order.driver && order.driver !== 'Не назначен' 
                    ? `<br><small>👤 ${order.driver}</small>` 
                    : ''}
            </td>
            <td>
                <div class="action-buttons">
                    ${order.status === 'new' ? `
                        <button onclick="changeOrderStatus(${order.id}, 'active')" class="btn-small">
                            📦 В путь
                        </button>
                    ` : ''}
                    
                    ${order.status === 'active' ? `
                        <button onclick="changeOrderStatus(${order.id}, 'delivered')" class="btn-small">
                            ✓ Доставлено
                        </button>
                    ` : ''}
                    
                    <button onclick="showOrderInfo(${order.id})" class="btn-small btn-info">
                        👁️ Подробно
                    </button>
                    
                    ${order.status === 'new' ? `
                        <button onclick="deleteOrder(${order.id})" class="btn-small btn-danger">
                            🗑️ Удалить
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Обновляем счетчики
    updateCounters();
}

// Обновление счетчиков на дашборде
function updateCounters() {
    // Подсчитываем заявки по статусам
    const total = orders.length;
    const active = orders.filter(o => o.status === 'active').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const newOrders = orders.filter(o => o.status === 'new').length;
    
    // Обновляем элементы на странице
    const updateElement = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    
    updateElement('active-orders', total);
    updateElement('in-transit', active);
    updateElement('delivered-today', delivered);
    updateElement('new-orders', newOrders);
    
    // Если элемента для новых заявок нет - создаем
    if (!document.getElementById('new-orders')) {
        const cards = document.querySelector('.dashboard-cards');
        if (cards) {
            const newCard = document.createElement('div');
            newCard.className = 'card';
            newCard.innerHTML = `
                <h3>Новые заявки</h3>
                <p class="big-number" id="new-orders">${newOrders}</p>
            `;
            cards.appendChild(newCard);
        }
    }
}

// ============================================
// 3. РАБОТА С ФОРМОЙ СОЗДАНИЯ ЗАЯВКИ
// ============================================

// Инициализация формы
function initForm() {
    const form = document.getElementById('order-form');
    if (!form) return;
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Получаем данные из формы
        const formData = new FormData(this);
        const orderData = {
            id: ++window.maxOrderId,
            customer: formData.get('customer-name') || '',
            cargo: formData.get('cargo-type') || '',
            weight: formData.get('weight') ? parseInt(formData.get('weight')) : 0,
            from: formData.get('from') || '',
            to: formData.get('to') || '',
            driver: formData.get('driver') || 'Не назначен',
            status: 'new',
            createdAt: new Date().toISOString().split('T')[0]
        };
        
        // Простая валидация
        if (!orderData.customer || !orderData.cargo || !orderData.from || !orderData.to) {
            showMessage('Заполните все обязательные поля!', 'error');
            return;
        }
        
        // Добавляем заявку
        orders.push(orderData);
        saveOrders();
        displayOrders();
        
        // Очищаем форму
        this.reset();
        
        // Показываем сообщение
        showMessage(`Заявка #${orderData.id} создана успешно!`, 'success');
        
        // Добавляем в историю
        addToHistory(`Создана заявка #${orderData.id} для "${orderData.customer}"`);
    });
    
    // Добавляем поле для водителя
    const weightField = document.getElementById('weight');
    if (weightField) {
        const driverField = document.createElement('div');
        driverField.innerHTML = `
            <label for="driver">Водитель (опционально):</label>
            <input type="text" id="driver" name="driver" placeholder="Не назначен">
        `;
        weightField.parentNode.insertBefore(driverField, weightField.nextSibling);
    }
}

// ============================================
// 4. ОСНОВНЫЕ ФУНКЦИИ УПРАВЛЕНИЯ
// ============================================

// Изменить статус заявки
function changeOrderStatus(orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showMessage('Заявка не найдена!', 'error');
        return;
    }
    
    const oldStatus = order.status;
    order.status = newStatus;
    
    // Обновляем водителя если начинается перевозка
    if (newStatus === 'active' && order.driver === 'Не назначен') {
        order.driver = prompt('Введите имя водителя:', 'Иванов И.И.') || 'Иванов И.И.';
    }
    
    saveOrders();
    displayOrders();
    
    // Сообщение
    const statusNames = {
        'new': 'Новая',
        'active': 'В пути',
        'delivered': 'Доставлено'
    };
    
    showMessage(`Заявка #${orderId}: ${statusNames[oldStatus]} → ${statusNames[newStatus]}`, 'success');
    
    // Добавляем в историю
    addToHistory(`Заявка #${orderId}: статус изменен на "${statusNames[newStatus]}"`);
}

// Показать информацию о заявке
function showOrderInfo(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showMessage('Заявка не найдена!', 'error');
        return;
    }
    
    const statusNames = {
        'new': 'Новая',
        'active': 'В пути',
        'delivered': 'Доставлено'
    };
    
    const info = `
        <h3>Заявка #${order.id}</h3>
        <p><strong>Клиент:</strong> ${order.customer}</p>
        <p><strong>Груз:</strong> ${order.cargo} ${order.weight ? `(${order.weight} кг)` : ''}</p>
        <p><strong>Маршрут:</strong> ${order.from} → ${order.to}</p>
        <p><strong>Статус:</strong> ${statusNames[order.status]}</p>
        <p><strong>Водитель:</strong> ${order.driver}</p>
        <p><strong>Создана:</strong> ${order.createdAt}</p>
    `;
    
    alert(info);
}

// Удалить заявку
function deleteOrder(orderId) {
    if (!confirm(`Удалить заявку #${orderId}?`)) return;
    
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) {
        showMessage('Заявка не найдена!', 'error');
        return;
    }
    
    const deletedOrder = orders[index];
    orders.splice(index, 1);
    saveOrders();
    displayOrders();
    
    showMessage(`Заявка #${orderId} удалена`, 'success');
    addToHistory(`Удалена заявка #${orderId} от "${deletedOrder.customer}"`);
}

// ============================================
// 5. ИСТОРИЯ И УВЕДОМЛЕНИЯ
// ============================================

// Добавить запись в историю
function addToHistory(message) {
    try {
        // Загружаем текущую историю
        const history = JSON.parse(localStorage.getItem(TRACKING_KEY) || '[]');
        
        // Добавляем новую запись
        history.push({
            id: history.length + 1,
            message: message,
            time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            date: new Date().toLocaleDateString('ru-RU')
        });
        
        // Ограничиваем 50 записями
        if (history.length > 50) {
            history.shift();
        }
        
        // Сохраняем
        localStorage.setItem(TRACKING_KEY, JSON.stringify(history));
        
        // Обновляем отображение
        updateHistoryDisplay();
        
    } catch (error) {
        console.error('Ошибка сохранения истории:', error);
    }
}

// Обновить отображение истории
function updateHistoryDisplay() {
    const historyList = document.getElementById('tracking-events');
    if (!historyList) return;
    
    try {
        const history = JSON.parse(localStorage.getItem(TRACKING_KEY) || '[]');
        
        // Берем последние 10 записей
        const recent = history.slice(-10).reverse();
        
        historyList.innerHTML = '';
        
        recent.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${item.time}</strong> - ${item.message}`;
            historyList.appendChild(li);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
        historyList.innerHTML = '<li>История пока пуста</li>';
    }
}

// Показать всплывающее сообщение
function showMessage(text, type = 'info') {
    // Создаем элемент сообщения
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type}`;
    messageDiv.textContent = text;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    // Цвета в зависимости от типа
    const colors = {
        'success': '#4CAF50',
        'error': '#f44336',
        'info': '#2196F3',
        'warning': '#ff9800'
    };
    
    messageDiv.style.backgroundColor = colors[type] || colors.info;
    
    // Добавляем на страницу
    document.body.appendChild(messageDiv);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
}

// ============================================
// 6. СИСТЕМА ВЕРСИОНИРОВАНИЯ ДАННЫХ (простая)
// ============================================

// Проверка версии данных при загрузке
function checkDataVersion() {
    const VERSION_KEY = 'data_version';
    const CURRENT_VERSION = '1.0';
    
    const savedVersion = localStorage.getItem(VERSION_KEY);
    
    if (!savedVersion) {
        // Первый запуск
        console.log('Первая загрузка, версия данных:', CURRENT_VERSION);
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    } else if (savedVersion !== CURRENT_VERSION) {
        // Обновление версии
        console.log(`Обновление данных с ${savedVersion} на ${CURRENT_VERSION}`);
        
        // Здесь можно добавить миграции при необходимости
        // Например: convertOldDataFormat();
        
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        showMessage('Данные обновлены до новой версии', 'info');
    }
}

// ============================================
// 7. ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ============================================

// Основная функция инициализации
function init() {
    console.log('Инициализация системы логистики...');
    
    // 1. Проверяем версию данных
    checkDataVersion();
    
    // 2. Загружаем заявки
    loadOrders();
    
    // 3. Настраиваем форму
    initForm();
    
    // 4. Показываем заявки
    displayOrders();
    
    // 5. Загружаем историю
    updateHistoryDisplay();
    
    // 6. Добавляем начальные стили
    addStyles();
    
    // 7. Показываем приветствие
    setTimeout(() => {
        showMessage('Система логистики готова к работе!', 'success');
        addToHistory('Система запущена');
    }, 500);
    
    console.log('Система инициализирована, заявок:', orders.length);
}

// Добавление CSS стилей
function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Анимации для уведомлений */
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        /* Стили для статусов */
        .status {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            display: inline-block;
        }
        
        .status-new {
            background: #ffd700;
            color: #333;
        }
        
        .status-active {
            background: #4caf50;
            color: white;
        }
        
        .status-delivered {
            background: #8bc34a;
            color: white;
        }
        
        /* Кнопки действий */
        .action-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        
        .btn-small {
            padding: 4px 8px;
            font-size: 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        
        .btn-info {
            background: #2196F3;
            color: white;
        }
        
        .btn-danger {
            background: #f44336;
            color: white;
        }
        
        /* Карточки дашборда */
        .card {
            background: #e8eaf6;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border-left: 5px solid #283593;
        }
        
        .big-number {
            font-size: 2.5rem;
            font-weight: bold;
            color: #1a237e;
            margin: 5px 0;
        }
        
        /* История */
        #tracking-events {
            list-style: none;
            padding: 0;
            max-height: 300px;
            overflow-y: auto;
        }
        
        #tracking-events li {
            padding: 8px 12px;
            margin-bottom: 5px;
            background: white;
            border-radius: 6px;
            border-left: 4px solid #283593;
            font-size: 14px;
        }
    `;
    
    document.head.appendChild(style);
}

// ============================================
// ЗАПУСК СИСТЕМЫ
// ============================================

// Запускаем когда страница полностью загружена
document.addEventListener('DOMContentLoaded', init);

// Экспортируем функции для использования в консоли браузера
window.changeOrderStatus = changeOrderStatus;
window.showOrderInfo = showOrderInfo;
window.deleteOrder = deleteOrder;