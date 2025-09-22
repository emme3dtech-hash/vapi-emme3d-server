// Импортируем необходимые модули
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Создаем приложение Express
const app = express();
app.use(express.json());
app.use(cors());

// --- НАСТРОЙКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ ---
// Убедитесь, что вы добавили эти переменные в настройках вашего хостинга (Railway, Render и т.д.)
const VAPI_PRIVATE_KEY = process.env.VAPI_PRIVATE_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const PORT = process.env.PORT || 3000;

// Инициализация клиента Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- ОСНОВНЫЕ ЭНДПОИНТЫ ---

// Эндпоинт для проверки "здоровья" сервера
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Главный эндпоинт для обработки webhook'ов от Vapi.ai
app.post('/vapi-webhook', async (req, res) => {
  const payload = req.body;

  // Проверяем, является ли это событием вызова функции
  if (payload.type === 'function-call') {
    const { functionCall } = payload;
    console.log(`Получен вызов функции: ${functionCall.name}`);

    let result;
    // Обрабатываем разные функции, которые может вызвать ассистент
    if (functionCall.name === 'findProduct') {
      result = await handleFindProduct(functionCall.parameters);
    } else if (functionCall.name === 'transferCall') {
      result = await handleTransferCall(functionCall.parameters);
    } else {
      // Если функция неизвестна, возвращаем ошибку
      result = { error: 'Unknown function name' };
    }
    
    // Отправляем результат обратно в Vapi
    return res.json(result);
  }

  // Для всех остальных типов событий просто возвращаем статус "ok"
  return res.json({ status: 'ok' });
});


// --- ЛОГИКА ОБРАБОТКИ ФУНКЦИЙ ---

/**
 * Обрабатывает поиск продукта в базе данных Supabase.
 * @param {object} params - Параметры от Vapi: { partName, carBrand, carModel }
 */
async function handleFindProduct(params) {
  const { partName, carBrand, carModel } = params;
  console.log(`Ищу продукт: ${partName} для ${carBrand} ${carModel}`);

  // Здесь будет ваша логика поиска в таблице Supabase
  // Пока что возвращаем "заглушку"
  
  // Пример поиска (нужно адаптировать под вашу структуру таблиц)
  /*
  const { data, error } = await supabase
    .from('products')
    .select('product_name, price, stock_status')
    .ilike('product_name', `%${partName}%`)
    .eq('brand', carBrand)
    .limit(1);

  if (error) {
    console.error('Ошибка поиска в Supabase:', error);
    return { result: "Вибачте, сталася помилка під час пошуку." };
  }

  if (data && data.length > 0) {
    return { result: `Знайдено: ${data[0].product_name}. Ціна: ${data[0].price} гривень. Статус: ${data[0].stock_status}.` };
  }
  */

  // Возвращаем тестовый результат
  return { result: `Знайшов деталь '${partName}' для ${carBrand} ${carModel}. Орієнтовна ціна 500 гривень. Деталь є в наявності.` };
}

/**
 * Обрабатывает запрос на перевод звонка.
 */
async function handleTransferCall(params) {
    console.log(`Перевод звонка по причине: ${params.reason}`);
    // В реальном приложении здесь будет логика перевода звонка
    // Пока что просто информируем ассистента
    return { result: "Добре, я з'єдную вас з нашим менеджером. Будь ласка, залишайтесь на лінії." };
}


// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер для EMME3D Vapi запущен на порту ${PORT}`);
});
