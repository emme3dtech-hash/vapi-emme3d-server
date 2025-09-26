const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(cors());

// --- НАСТРОЙКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ ---
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL; // URL вашего n8n-воркфлоу
const PORT = process.env.PORT || 3000;

// Проверяем, что URL для n8n задан
if (!N8N_WEBHOOK_URL) {
    console.error('Критическая ошибка: Переменная окружения N8N_WEBHOOK_URL не установлена.');
    process.exit(1);
}

// --- ГЛАВНЫЙ ЭНДПОИНТ ---

// Эндпоинт для обработки webhook'ов от Vapi.ai
app.post('/vapi-webhook', async (req, res) => {
    const payload = req.body;

    // Ждем только вызов функции 'getAgentResponse'
    if (payload.type === 'function-call' && payload.functionCall.name === 'getAgentResponse') {
        const { userInput } = payload.functionCall.parameters;
        console.log(`Получен текст от пользователя: "${userInput}"`);

        // Отправляем текст в n8n и ждем ответ
        const agentResponse = await askN8NAgent(userInput, payload.call.id);

        // Отправляем результат обратно в Vapi
        return res.json({ result: agentResponse });
    }

    // На все остальные события от Vapi (начало/конец звонка и т.д.) просто отвечаем OK
    return res.json({ status: 'ok' });
});


// --- ФУНКЦИЯ ДЛЯ СВЯЗИ С N8N ---

/**
 * Отправляет сообщение в n8n и возвращает ответ агента.
 * @param {string} userInput - Текст от пользователя.
 * @param {string} sessionId - ID звонка от Vapi для идентификации сессии.
 */
async function askN8NAgent(userInput, sessionId) {
    try {
        const payload = {
            userInput: userInput,
            sessionId: `vapi_${sessionId}`
        };
        console.log('📤 Отправляем в n8n:', payload);

        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            timeout: 15000
        });

        if (!response.ok) {
            throw new Error(`n8n ответил ошибкой: ${response.status}`);
        }

        const result = await response.json();
        const aiResponse = result.output || result.text || 'Извините, я не смог обработать ваш запрос.';
        console.log('📥 Получен ответ от n8n:', aiResponse);
        return aiResponse;

    } catch (error) {
        console.error('❌ Ошибка при вызове n8n агента:', error);
        return 'Простите, произошла техническая ошибка.';
    }
}


// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер-мост для Vapi <-> n8n запущен на порту ${PORT}`);
});
